import { prisma } from "@/lib/prisma";
import {
  interpretFinancialMessage,
  WhatsAppFinancialExtraction,
  ChatMessage,
} from "@/lib/whatsapp-bot";

/**
 * Normaliza número de telefone removendo caracteres não numéricos
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Validação de Whitelist com suporte à variação do 9º dígito em números brasileiros (DDI 55)
 */
export function isNumberAuthorized(
  fromNumber: string,
  allowedNumbersEnv?: string
): boolean {
  if (!allowedNumbersEnv || allowedNumbersEnv.trim() === "") {
    console.warn(
      "[WHATSAPP_SECURITY] WHATSAPP_ALLOWED_NUMBERS não foi configurado. Nenhuma mensagem será processada por segurança."
    );
    return false;
  }

  const cleanFrom = sanitizePhoneNumber(fromNumber);
  if (!cleanFrom) return false;

  const allowedList = allowedNumbersEnv
    .split(",")
    .map((num) => sanitizePhoneNumber(num.trim()))
    .filter((num) => num.length > 0);

  for (const allowed of allowedList) {
    if (cleanFrom === allowed) {
      return true;
    }

    // Regra de tolerância do nono dígito para números brasileiros (DDI 55)
    // Ex: 5511999998888 vs 551199998888
    if (cleanFrom.startsWith("55") && allowed.startsWith("55")) {
      const fromDdd = cleanFrom.slice(2, 4);
      const allowedDdd = allowed.slice(2, 4);
      const fromLast8 = cleanFrom.slice(-8);
      const allowedLast8 = allowed.slice(-8);

      if (fromDdd === allowedDdd && fromLast8 === allowedLast8) {
        return true;
      }
    }
  }

  return false;
}

export interface ProcessFinancialMessageResult {
  parsed: WhatsAppFinancialExtraction;
  success: boolean;
  replyMessage: string;
}

/**
 * Processa a mensagem de texto do WhatsApp:
 * 1. Carrega dados de contexto (cartões, benefícios, usuários)
 * 2. Interpreta com o Google Gemini
 * 3. Grava no banco Neon Postgres via Prisma
 * 4. Retorna a resposta que deve ser enviada de volta ao usuário
 */
export async function processFinancialMessage(
  cleanSender: string,
  userText: string,
  recentHistory?: ChatMessage[]
): Promise<ProcessFinancialMessageResult> {
  const allowedEnv = process.env.WHATSAPP_ALLOWED_NUMBERS;

  // 1. Carrega cartões e usuários do Neon Postgres
  const [creditCards, benefitCards, allUsers] = await Promise.all([
    prisma.creditCard.findMany({
      select: {
        id: true,
        name: true,
        bank: true,
        totalLimit: true,
        availableLimit: true,
        userId: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.benefitCard.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        currentBalance: true,
        userId: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Identificação do cônjuge remetente (Pessoa 1 ou Pessoa 2)
  const allowedList = (allowedEnv || "")
    .split(",")
    .map((num) => sanitizePhoneNumber(num.trim()))
    .filter((num) => num.length > 0);

  const senderIndex = allowedList.findIndex((allowed) => {
    if (cleanSender === allowed) return true;
    if (cleanSender.startsWith("55") && allowed.startsWith("55")) {
      return (
        cleanSender.slice(2, 4) === allowed.slice(2, 4) &&
        cleanSender.slice(-8) === allowed.slice(-8)
      );
    }
    return false;
  });

  const senderUser =
    senderIndex >= 0 && allUsers[senderIndex]
      ? allUsers[senderIndex]
      : allUsers[0];

  // Mapeamento de nomes dos cônjuges para contexto dos cartões
  const userMap = new Map(allUsers.map((u) => [u.id, u.name.split(" ")[0]]));

  // 2. Interpretação com Google Gemini
  const parsed = await interpretFinancialMessage(userText, {
    creditCards: creditCards.map((c) => ({
      id: c.id,
      name: c.name,
      bank: c.bank,
      totalLimit: Number(c.totalLimit),
      availableLimit: Number(c.availableLimit),
      ownerName: c.userId ? userMap.get(c.userId) : undefined,
    })),
    benefitCards: benefitCards.map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      currentBalance: Number(b.currentBalance),
      ownerName: b.userId ? userMap.get(b.userId) : undefined,
    })),
    recentHistory,
  });

  // 3. Consulta de Saldos e Limites ('check_balance')
  if (parsed.intent === "check_balance") {
    let reply = parsed.replyMessage;

    // Fallback defensivo com dados exatos do Neon caso a IA não tenha formatado
    if (!reply || reply.trim().length === 0) {
      if (parsed.matchedCardId) {
        const benefit = benefitCards.find((b) => b.id === parsed.matchedCardId);
        if (benefit) {
          const bal = Number(benefit.currentBalance).toFixed(2).replace(".", ",");
          reply = `O saldo atual do seu cartão *${benefit.name} (${benefit.type})* é de *R$ ${bal}* 🥗`;
        } else {
          const credit = creditCards.find((c) => c.id === parsed.matchedCardId);
          if (credit) {
            const avail = Number(credit.availableLimit).toFixed(2).replace(".", ",");
            const tot = Number(credit.totalLimit).toFixed(2).replace(".", ",");
            reply = `Seu cartão *${credit.name}* está com *R$ ${avail}* de limite disponível (Limite total: R$ ${tot}) 💳`;
          }
        }
      }

      if (!reply) {
        const benLines = benefitCards.map(
          (b) => `• *${b.name} (${b.type})*: R$ ${Number(b.currentBalance).toFixed(2).replace(".", ",")}`
        );
        const credLines = creditCards.map(
          (c) => `• *${c.name}*: R$ ${Number(c.availableLimit).toFixed(2).replace(".", ",")} disponíveis`
        );
        reply = `Aqui estão os saldos e limites atuais dos seus cartões 💳\n\n🥗 *Benefícios (VR/VA):*\n${benLines.join("\n")}\n\n💳 *Cartões de Crédito:*\n${credLines.join("\n")}`;
      }
    }

    return {
      parsed,
      success: true,
      replyMessage: reply,
    };
  }

  // 4. Gravação no banco Prisma
  if (parsed.intent === "register_expense" && parsed.amount > 0) {
    if (parsed.paymentTarget === "credit_card") {
      const matchedCard =
        creditCards.find((c) => c.id === parsed.matchedCardId) ||
        creditCards[0];

      const targetUserId =
        matchedCard?.userId || senderUser?.id || allUsers[0]?.id;

      if (parsed.installments > 1 && matchedCard) {
        // Compra parcelada no Cartão
        const installmentVal = Number(
          (parsed.amount / parsed.installments).toFixed(2)
        );

        await prisma.creditCardInstallment.create({
          data: {
            cardId: matchedCard.id,
            description: parsed.description,
            totalAmount: parsed.amount,
            installmentAmount: installmentVal,
            totalInstallments: parsed.installments,
            currentInstallment: 1,
            category: parsed.category,
            purchaseDate: new Date(),
            userId: targetUserId,
          },
        });

        // Atualiza limite disponível
        const currentLimit = Number(matchedCard.availableLimit);
        await prisma.creditCard.update({
          where: { id: matchedCard.id },
          data: {
            availableLimit: Math.max(0, currentLimit - parsed.amount),
          },
        });
      } else {
        // Compra à vista no Cartão
        await prisma.expense.create({
          data: {
            description: parsed.description,
            amount: parsed.amount,
            date: new Date(),
            category: parsed.category,
            expenseType: "VARIABLE",
            paymentMethod: "CREDIT_CARD",
            isPaid: true,
            creditCardId: matchedCard?.id || null,
            userId: targetUserId,
          },
        });

        if (matchedCard) {
          const currentLimit = Number(matchedCard.availableLimit);
          await prisma.creditCard.update({
            where: { id: matchedCard.id },
            data: {
              availableLimit: Math.max(0, currentLimit - parsed.amount),
            },
          });
        }
      }
    } else if (parsed.paymentTarget === "benefit_card") {
      // Cartão de Benefício (VR / VA)
      const matchedBenefit =
        benefitCards.find((b) => b.id === parsed.matchedCardId) ||
        benefitCards[0];

      const targetUserId =
        matchedBenefit?.userId || senderUser?.id || allUsers[0]?.id;
      const paymentMethod = matchedBenefit?.type === "VA" ? "VA" : "VR";

      await prisma.expense.create({
        data: {
          description: parsed.description,
          amount: parsed.amount,
          date: new Date(),
          category: parsed.category,
          expenseType: "VARIABLE",
          paymentMethod: paymentMethod,
          isPaid: true,
          userId: targetUserId,
        },
      });

      if (matchedBenefit) {
        const currentBal = Number(matchedBenefit.currentBalance);
        await prisma.benefitCard.update({
          where: { id: matchedBenefit.id },
          data: {
            currentBalance: Math.max(0, currentBal - parsed.amount),
          },
        });
      }
    } else {
      // Débito / Pix / Saldo Livre
      const targetUserId = senderUser?.id || allUsers[0]?.id;

      await prisma.expense.create({
        data: {
          description: parsed.description,
          amount: parsed.amount,
          date: new Date(),
          category: parsed.category,
          expenseType: "VARIABLE",
          paymentMethod: "DEBIT_PIX",
          isPaid: true,
          userId: targetUserId,
        },
      });
    }
  } else if (parsed.intent === "register_income" && parsed.amount > 0) {
    const targetUserId = senderUser?.id || allUsers[0]?.id;

    await prisma.income.create({
      data: {
        description: parsed.description,
        amountGross: parsed.amount,
        amountNet: parsed.amount,
        category: "EXTRA",
        walletType: "FREE",
        receivedAt: new Date(),
        userId: targetUserId,
      },
    });
  }

  return {
    parsed,
    success: true,
    replyMessage:
      parsed.replyMessage ||
      "Mensagem recebida e processada pelo assistente financeiro! 💰",
  };
}

/**
 * Recupera o histórico recente comprimido da conversa do usuário pelo número de WhatsApp direto do Neon Postgres.
 * Garante que o robô nunca esqueça o contexto mesmo após reinicializações ou hibernação do container.
 */
export async function getContactHistory(
  phoneNumber: string
): Promise<ChatMessage[]> {
  try {
    const clean = sanitizePhoneNumber(phoneNumber);
    const record = await prisma.whatsAppSession.findUnique({
      where: { id: `chat_hist_${clean}` },
    });
    if (!record?.data) return [];
    const parsed = JSON.parse(record.data);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // Filtra mensagens das últimas 24h e limita às últimas 8 mensagens mais recentes
    return parsed
      .filter(
        (m: any) => !m.timestamp || now - m.timestamp < TWENTY_FOUR_HOURS_MS
      )
      .slice(-8)
      .map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        text: String(m.text || "").slice(0, 200),
      }));
  } catch (err) {
    console.warn("[HISTORY] Falha ao recuperar histórico do contato:", err);
    return [];
  }
}

/**
 * Salva o histórico da conversa comprimido no Neon Postgres indexado pelo número de telefone.
 * Mantém no máximo 8 mensagens compactadas (ocupando menos de 1 KB).
 */
export async function saveContactHistory(
  phoneNumber: string,
  history: ChatMessage[]
): Promise<void> {
  try {
    const clean = sanitizePhoneNumber(phoneNumber);
    const now = Date.now();
    const compactList = history.slice(-8).map((m) => ({
      role: m.role,
      text: m.text.slice(0, 200),
      timestamp: now,
    }));

    await prisma.whatsAppSession.upsert({
      where: { id: `chat_hist_${clean}` },
      update: { data: JSON.stringify(compactList) },
      create: { id: `chat_hist_${clean}`, data: JSON.stringify(compactList) },
    });
  } catch (err) {
    console.warn("[HISTORY] Falha ao salvar histórico do contato no Neon:", err);
  }
}

/**
 * Limpa o histórico de pendências quando o gasto é finalizado
 */
export async function clearContactHistory(phoneNumber: string): Promise<void> {
  try {
    const clean = sanitizePhoneNumber(phoneNumber);
    await prisma.whatsAppSession
      .delete({
        where: { id: `chat_hist_${clean}` },
      })
      .catch(() => null);
  } catch {}
}

