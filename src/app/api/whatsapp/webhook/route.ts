import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  interpretFinancialMessage,
  sendWhatsAppMessage,
} from "@/lib/whatsapp-bot";

/**
 * Normaliza número de telefone removendo caracteres não numéricos
 */
function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Validação de Whitelist com suporte à variação do 9º dígito em números brasileiros
 */
function isNumberAuthorized(
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

/**
 * GET: Verificação de Webhook da Meta (WhatsApp Cloud API)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const queryToken = searchParams.get("hub.verify_token")?.trim();
  const challenge = searchParams.get("hub.challenge");

  const DEFAULT_TOKEN = "financas_casal_token_secure";
  const envToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  const isTokenValid =
    queryToken === DEFAULT_TOKEN ||
    (Boolean(envToken) && queryToken === envToken);

  if ((mode === "subscribe" || !mode) && isTokenValid) {
    console.log(
      "[WHATSAPP_WEBHOOK_VERIFY] Webhook validado com sucesso pela Meta."
    );
    return new Response(challenge || "OK", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  console.warn(
    `[WHATSAPP_WEBHOOK_VERIFY_REJECTED] Falha na verificação de token. Recebido: "${queryToken}", Esperado: "${DEFAULT_TOKEN}"`
  );
  return new Response(
    `Forbidden: token_received='${queryToken}', expected='${DEFAULT_TOKEN}'`,
    {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }
  );
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

    // 2. Segurança estrita: Whitelist de números permitidos
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

    // 3. Validação do tipo de mensagem (apenas texto é processado para lançamentos)
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

    // 4. Consulta em paralelo aos cartões existentes e usuários no Neon Postgres
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

    // Identificação de qual pessoa do casal enviou a mensagem (Pessoa 1 ou Pessoa 2)
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

    // 5. Interpretação com Google Gemini 2.5 Flash via AI SDK
    const parsed = await interpretFinancialMessage(userText, {
      creditCards: creditCards.map((c) => ({
        id: c.id,
        name: c.name,
        bank: c.bank,
      })),
      benefitCards: benefitCards.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
      })),
    });

    // 6. Gravação no banco Prisma de acordo com as regras de negócio
    if (parsed.intent === "register_expense" && parsed.amount > 0) {
      if (parsed.paymentTarget === "credit_card") {
        const matchedCard =
          creditCards.find((c) => c.id === parsed.matchedCardId) ||
          creditCards[0];

        const targetUserId =
          matchedCard?.userId || senderUser?.id || "user-lucas";

        if (parsed.installments > 1 && matchedCard) {
          // Compra Parcelada no Cartão de Crédito
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

          // Atualiza limite disponível no cartão
          const currentLimit = Number(matchedCard.availableLimit);
          await prisma.creditCard.update({
            where: { id: matchedCard.id },
            data: {
              availableLimit: Math.max(0, currentLimit - parsed.amount),
            },
          });
        } else {
          // Compra à Vista no Cartão de Crédito
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
        const matchedBenefit =
          benefitCards.find((b) => b.id === parsed.matchedCardId) ||
          benefitCards[0];

        const targetUserId =
          matchedBenefit?.userId || senderUser?.id || "user-lucas";
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
        const targetUserId = senderUser?.id || "user-lucas";

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
      const targetUserId = senderUser?.id || "user-lucas";

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

    // 7. Envia a resposta amigável de volta para o usuário no WhatsApp
    let whatsappDelivery = null;
    if (parsed.replyMessage) {
      whatsappDelivery = await sendWhatsAppMessage(cleanSender, parsed.replyMessage);
    }

    return NextResponse.json({
      success: true,
      intent: parsed.intent,
      description: parsed.description,
      amount: parsed.amount,
      replyMessage: parsed.replyMessage,
      whatsappDelivery,
    });
  } catch (error) {
    console.error("[WHATSAPP_WEBHOOK_POST_ERROR]", error);

    // Tentativa defensiva de avisar o usuário se possível
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

    // SEMPRE retorna 200 OK para a Meta não ficar reenviando em loop
    return NextResponse.json(
      { error: "Internal processing error handled gracefully" },
      { status: 200 }
    );
  }
}
