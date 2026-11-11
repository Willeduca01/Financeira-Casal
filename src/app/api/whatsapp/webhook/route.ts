import { NextRequest, NextResponse } from "next/server";
import {
  sanitizePhoneNumber,
  isNumberAuthorized,
  processFinancialMessage,
} from "@/lib/whatsapp-core";
import { sendWhatsAppMessage } from "@/lib/whatsapp-bot";

/**
 * GET: Verificação de Webhook da Meta (WhatsApp Cloud API)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const queryToken = searchParams.get("hub.verify_token")?.trim();
  const challenge = searchParams.get("hub.challenge");

  const envToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  if (!envToken) {
    console.error(
      "[WHATSAPP_WEBHOOK_SECURITY] WHATSAPP_VERIFY_TOKEN não está configurado no servidor."
    );
    return new Response("Configuração pendente no servidor", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const isTokenValid = mode === "subscribe" && queryToken === envToken;

  if (isTokenValid) {
    console.log(
      "[WHATSAPP_WEBHOOK_VERIFY] Webhook validado com sucesso pela Meta."
    );
    return new Response(challenge || "OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  console.warn(
    "[WHATSAPP_WEBHOOK_VERIFY_REJECTED] Tentativa de verificação com token inválido."
  );
  return new Response("Forbidden", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * POST: Processamento de mensagens recebidas via WhatsApp Cloud API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Extração segura do payload da Meta
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // Se for evento de status (delivered, read, sent) ou não contiver mensagem, responde 200 OK
    if (!message) {
      return NextResponse.json(
        { status: "ignored_no_message_event" },
        { status: 200 }
      );
    }

    const rawFrom = message.from;
    const cleanSender = sanitizePhoneNumber(rawFrom || "");

    // 2. Segurança: Whitelist de números permitidos
    const allowedEnv = process.env.WHATSAPP_ALLOWED_NUMBERS;
    const isAllowed = isNumberAuthorized(cleanSender, allowedEnv);

    if (!isAllowed) {
      console.warn(
        `[WHATSAPP_UNAUTHORIZED] Mensagem recebida de número não autorizado: ${cleanSender}. Ação descartada.`
      );
      return NextResponse.json(
        { status: "ignored_unauthorized_number" },
        { status: 200 }
      );
    }

    // 3. Validação do tipo de mensagem (apenas texto para lançamentos)
    const userText = message?.text?.body?.trim();
    if (!userText) {
      await sendWhatsAppMessage(
        cleanSender,
        "Olá! No momento consigo processar apenas mensagens de texto com seus gastos ou receitas. Digite por exemplo: *30 reais no almoço com VR* 📝"
      );
      return NextResponse.json(
        { status: "ignored_non_text_message" },
        { status: 200 }
      );
    }

    // 4. Processa no core financeiro unificado
    const result = await processFinancialMessage(cleanSender, userText);

    // 5. Envia a resposta amigável de volta para o usuário no WhatsApp
    let whatsappDelivery = null;
    if (result.replyMessage) {
      whatsappDelivery = await sendWhatsAppMessage(
        cleanSender,
        result.replyMessage
      );
    }

    return NextResponse.json({
      success: true,
      intent: result.parsed.intent,
      description: result.parsed.description,
      amount: result.parsed.amount,
      replyMessage: result.replyMessage,
      whatsappDelivery,
    });
  } catch (error) {
    console.error("[WHATSAPP_WEBHOOK_POST_ERROR]", error);

    try {
      const body = await request.clone().json().catch(() => null);
      const sender = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
      if (sender) {
        await sendWhatsAppMessage(
          sanitizePhoneNumber(sender),
          "Tivemos uma pequena oscilação temporária ao processar seu lançamento. Por favor, tente enviar novamente em alguns segundos! ⚠️"
        );
      }
    } catch {
      // Ignora falhas no aviso defensivo
    }

    return NextResponse.json(
      { error: "Internal processing error handled gracefully" },
      { status: 200 }
    );
  }
}
