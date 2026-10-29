import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * ==============================================================================
 * SISTEMA DE RATE LIMITING E PROTEÇÃO DE INFRAESTRUTURA (FASE 1)
 * ==============================================================================
 * 
 * NOTA DE ARQUITETURA PARA ESCALA CORPORATIVA / SERVERLESS DISTRIBUÍDO:
 * A implementação abaixo utiliza um Map em memória com algoritmo de Janela Fixa
 * (Fixed Window) e purga periódica de TTL. É autossuficiente e não gera custos
 * externos imediatos.
 * 
 * Para ambientes de produção com instâncias Vercel Edge distribuídas globalmente,
 * o desacoplamento pode ser feito plugando o Upstash Redis:
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(...) });
 * ==============================================================================
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

let lastCleanupTime = Date.now();
const PURGE_INTERVAL_MS = 60_000; // Limpeza de memória a cada 1 minuto

function purgeExpiredRecords(now: number) {
  if (now - lastCleanupTime < PURGE_INTERVAL_MS) return;
  lastCleanupTime = now;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

function extractClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  return "127.0.0.1";
}

interface RateLimitRule {
  limit: number;
  windowMs: number;
  ruleName: string;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apenas rotas de API possuem regras estritas de rate limit no middleware
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Rotas públicas / Webhooks externos da Meta (WhatsApp Cloud API)
  if (pathname.startsWith("/api/whatsapp/webhook")) {
    return NextResponse.next();
  }

  const now = Date.now();
  purgeExpiredRecords(now);

  const clientIp = extractClientIp(request);

  // Definição das políticas conforme requisitos de segurança
  let rule: RateLimitRule | null = null;

  if (pathname.startsWith("/api/auth/callback") || pathname === "/api/auth/signin") {
    // 1. Tentativas de login e autenticação com credenciais (proteção anti-força bruta)
    rule = {
      limit: 10,
      windowMs: 5 * 60 * 1000, // 5 minutos
      ruleName: "auth-sensitive",
    };
  } else if (pathname.startsWith("/api/auth")) {
    // 2. Verificação de sessão NextAuth e CSRF do cliente
    rule = {
      limit: 100,
      windowMs: 60 * 1000, // 1 minuto
      ruleName: "auth-session",
    };
  } else if (pathname.startsWith("/api/finances")) {
    // 2. Operações de leitura/escrita financeira: 60 requisições por minuto
    rule = {
      limit: 60,
      windowMs: 60 * 1000, // 1 minuto (60.000 ms)
      ruleName: "finances-standard",
    };
  } else {
    // 3. Fallback defensivo geral para qualquer outro endpoint de API
    rule = {
      limit: 100,
      windowMs: 60 * 1000,
      ruleName: "api-general",
    };
  }

  const cacheKey = `${rule.ruleName}:${clientIp}`;
  let record = rateLimitStore.get(cacheKey);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + rule.windowMs,
    };
    rateLimitStore.set(cacheKey, record);
  } else {
    record.count += 1;
  }

  // Se exceder a cota permitida -> Retornar HTTP 429 Too Many Requests
  if (record.count > rule.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

    return NextResponse.json(
      {
        error: "Muitas tentativas (Rate Limit Exceeded)",
        message:
          "Você atingiu o limite de requisições de segurança para este endereço IP. Por motivos de proteção dos dados financeiros do casal, aguarde antes de tentar novamente.",
        statusCode: 429,
        retryAfterSeconds: retryAfterSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(record.resetAt / 1000)),
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }

  // Requisição permitida: injetar headers informativos
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(rule.limit));
  response.headers.set(
    "X-RateLimit-Remaining",
    String(Math.max(0, rule.limit - record.count))
  );
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(record.resetAt / 1000)));

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
