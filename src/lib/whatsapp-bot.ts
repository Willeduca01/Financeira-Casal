import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

/**
 * Obtém o cliente Google Generative AI configurado dinamicamente
 */
function getGoogleProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "A chave GOOGLE_GENERATIVE_AI_API_KEY não está configurada no ambiente."
    );
  }
  return createGoogleGenerativeAI({ apiKey });
}

/**
 * Schema Zod para extração de intenção financeira estruturada
 */
export const WhatsAppFinancialExtractionSchema = z.object({
  intent: z
    .enum([
      "register_expense",
      "register_income",
      "check_balance",
      "missing_info",
      "unknown",
    ])
    .describe(
      "Intenção principal da mensagem: 'register_expense' para gastos/compras/pagamentos, 'register_income' para recebimentos/salários/pix recebido, 'check_balance' para consultar saldo, limite ou valores disponíveis em cartões de crédito ou benefícios (VR/VA) ou saldos gerais (ex: 'qual o valor do pluxee VA?', 'quanto tenho no caju?', 'limite nubank', 'quais os saldos dos meus cartões?'), 'missing_info' se o usuário quis registrar algo mas faltou o valor monetário ou detalhe crítico, 'unknown' para saudações ou mensagens não financeiras."
    ),
  missingFields: z
    .array(z.string())
    .describe(
      "Campos que faltaram caso o intent seja 'missing_info' (ex: ['amount', 'card'])"
    ),
  description: z
    .string()
    .describe(
      "Descrição padronizada e limpa do gasto ou receita (ex: 'Bolacha - Loja do Seu Zé', 'Almoço Restaurante', 'Uber Centro')"
    ),
  amount: z
    .number()
    .describe(
      "Valor financeiro em reais como número positivo (ex: 12.50). Deve ser 0 se não foi informado na mensagem."
    ),
  category: z
    .enum([
      "HOUSING",
      "UTILITIES",
      "LOAN_INSTALLMENT",
      "FOOD_MARKET",
      "FOOD_PROTEIN",
      "SWEETS_SNACKS",
      "EAT_OUT_DELIVERY",
      "WEEKLY_SHOPPING",
      "LEISURE",
      "TRANSPORT",
      "HEALTH",
      "SUBSCRIPTION",
      "OTHER",
    ])
    .describe(
      "Categoria compatível com o orçamento do casal. Ex: 'FOOD_MARKET' para compras de mercado, 'EAT_OUT_DELIVERY' para restaurantes/iFood, 'TRANSPORT' para gasolina/Uber, 'HEALTH' para farmácia, etc."
    ),
  paymentTarget: z
    .enum(["account_balance", "credit_card", "benefit_card"])
    .describe(
      "Destino do pagamento: 'credit_card' se usou cartão de crédito; 'benefit_card' se usou VR ou VA (Vale Refeição / Alimentação); 'account_balance' se foi débito, dinheiro, Pix ou saldo de conta."
    ),
  matchedCardId: z
    .string()
    .nullable()
    .describe(
      "ID exato do CreditCard ou BenefitCard fornecido no contexto que melhor casa com a menção do usuário. Se não foi citado cartão ou não encontrou na lista, retorne null."
    ),
  installments: z
    .number()
    .default(1)
    .describe(
      "Número total de parcelas. Padrão 1 se for à vista ou não informado; se o usuário disse 'em 3x', '3 vezes', etc., retorne o número de parcelas (ex: 3)."
    ),
  replyMessage: z
    .string()
    .describe(
      "Mensagem amigável, clara e curta em português com emojis para enviar de volta no WhatsApp. Se registrou com sucesso, confirme o item, valor (R$), parcelas (se > 1), cartão/forma e categoria. Se faltou o valor ou o cartão não existe, pergunte gentilmente."
    ),
});

export type WhatsAppFinancialExtraction = z.infer<
  typeof WhatsAppFinancialExtractionSchema
>;

export interface CardContextItem {
  id: string;
  name: string;
  bank?: string;
  type?: string;
  totalLimit?: number;
  availableLimit?: number;
  currentBalance?: number;
  ownerName?: string;
  lastFourDigits?: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface BotContext {
  creditCards: CardContextItem[];
  benefitCards: CardContextItem[];
  recentHistory?: ChatMessage[];
}

/**
 * Envia uma mensagem de texto para o usuário via WhatsApp Cloud API (Meta Graph API)
 */
export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  let phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn(
      "[WHATSAPP_BOT] Variáveis WHATSAPP_ACCESS_TOKEN ou WHATSAPP_PHONE_NUMBER_ID não configuradas. Mensagem não enviada."
    );
    return {
      success: false,
      error: "WhatsApp Cloud API credentials not configured",
    };
  }

  // Tratamento de correção de dígito para o ID de teste da Meta caso venha com 15 dígitos em vez de 16
  if (phoneNumberId === "141445141749473") {
    phoneNumberId = "1414445141749473";
  }

  const cleanTo = to.replace(/\D/g, "");
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(
        "[WHATSAPP_BOT_API_ERROR] Falha ao enviar mensagem:",
        response.status,
        responseData
      );
      return {
        success: false,
        error: `Meta API error: ${response.status}`,
        data: responseData,
      };
    }

    console.log(
      `[WHATSAPP_BOT_SENT] Mensagem enviada com sucesso para ${cleanTo}:`,
      responseData?.messages?.[0]?.id || "OK"
    );

    return { success: true, data: responseData };
  } catch (error) {
    console.error("[WHATSAPP_BOT_SEND_EXCEPTION]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Interpreta a mensagem natural do usuário utilizando o Google Gemini com saída estruturada via Zod.
 * Tenta os modelos recomendados com fallback automático resiliente.
 */
export async function interpretFinancialMessage(
  messageText: string,
  context: BotContext
): Promise<WhatsAppFinancialExtraction> {
  const google = getGoogleProvider();

  const promptSystem = `Você é o assistente inteligente de finanças do casal (Financeira-Casal).
Seu objetivo é interpretar mensagens naturais enviadas pelos cônjuges no WhatsApp para registrar despesas, compras no cartão de crédito, gastos com benefícios (VR/VA) ou receitas.

CONTEXTO DOS CARTÕES CADASTRADOS NO SISTEMA DO CASAL:
- Cartões de Crédito disponíveis:
${
  context.creditCards.length > 0
    ? context.creditCards
        .map(
          (c) =>
            `  * ID: "${c.id}" | Nome: "${c.name}" ${c.bank ? `| Banco: ${c.bank}` : ""} | Limite Disponível: R$ ${(c.availableLimit ?? 0).toFixed(2)} | Limite Total: R$ ${(c.totalLimit ?? 0).toFixed(2)}${c.ownerName ? ` | Titular: ${c.ownerName}` : ""}`
        )
        .join("\n")
    : "  (Nenhum cartão de crédito cadastrado)"
}

- Cartões de Benefícios (VR / VA) disponíveis:
${
  context.benefitCards.length > 0
    ? context.benefitCards
        .map(
          (b) =>
            `  * ID: "${b.id}" | Nome: "${b.name}" ${b.type ? `| Tipo: ${b.type}` : ""} | Saldo Atual Disponível: R$ ${(b.currentBalance ?? 0).toFixed(2)}${b.ownerName ? ` | Titular: ${b.ownerName}` : ""}`
        )
        .join("\n")
    : "  (Nenhum cartão de benefícios cadastrado)"
}
${
  context.recentHistory && context.recentHistory.length > 0
    ? `\nHISTÓRICO RECENTE DA CONVERSA (Contexto das mensagens anteriores imediatas):\n${context.recentHistory
        .map((h) => `* [${h.role === "user" ? "USUÁRIO" : "BOT"}]: "${h.text}"`)
        .join("\n")}\n`
    : ""
}

CATEGORIAS ORÇAMENTÁRIAS PERMITIDAS:
- HOUSING: Moradia, Aluguel, Condomínio
- UTILITIES: Luz, Água, Gás, Internet, Celular
- LOAN_INSTALLMENT: Empréstimos, Financiamentos
- FOOD_MARKET: Compras de supermercado do mês
- FOOD_PROTEIN: Açougue, Carnes, Peixaria, Proteínas
- SWEETS_SNACKS: Doces, Padaria, Cafeteria, Lanches rápidos
- EAT_OUT_DELIVERY: Restaurante, Bares, iFood, Comer fora
- WEEKLY_SHOPPING: Feira livre, Sacolão, Hortifrúti
- LEISURE: Lazer, Cinema, Passeios, Festas
- TRANSPORT: Combustível, Uber, Táxi, Estacionamento, Transporte público
- HEALTH: Farmácia, Remédios, Médico, Exames
- SUBSCRIPTION: Netflix, Spotify, Assinaturas recorrentes
- OTHER: Outros gastos gerais

DIRETRIZES DE EXTRAÇÃO:
1. VALOR MONETÁRIO E DESCRIÇÃO COM LOCAL:
   - Extraia sempre o valor em reais (ex: "12 reais" -> 12, "45,90" -> 45.9).
   - LOCAL / ESTABELECIMENTO: Se o usuário mencionar ONDE comprou (ex: "na Bacio di Latte", "no McDonald's", "no posto Shell", "no shopping", "na padaria do Zé"), INCLUA o estabelecimento na 'description' de forma padronizada (ex: "Sorvete - Bacio di Latte", "Almoço - McDonald's", "Combustível - Posto Shell").
   - Se nenhum valor numérico foi informado, marque intent como 'missing_info', adicione 'amount' em missingFields e peça o valor educadamente na replyMessage, mencionando o que já foi entendido (ex: "Anotei o sorvete! Quanto custou? 🍦").
2. PARCELAMENTO: Se o usuário mencionar algo como "em 3x", "4 vezes", "parcelado em 2", configure 'installments' com esse número e deduza que o 'paymentTarget' é 'credit_card'.
3. MATCHING DE CARTÕES:
   - Se o usuário mencionar nomes aproximados (ex: "bradesco", "nubank", "inter", "itaú", "flash", "sodexo", "alelo"), tente associar ao melhor 'matchedCardId' das listas acima.
   - Se mencionou VR ou Vale Refeição ou Vale Alimentação ou VA, direcione para 'benefit_card' e combine com o benefício correspondente.
   - Se não especificou cartão ou disse Pix / Débito / Dinheiro, 'paymentTarget' é 'account_balance' e 'matchedCardId' é null.
4. MENSAGEM DE RESPOSTA (replyMessage):
   - Curta, calorosa e assertiva em português (com emojis).
   - Se 'register_expense': confirme que registrou, detalhando descrição (com o local se informado), valor em R$ (e parcelas se > 1) e forma de pagamento.
   - Se 'missing_info': pergunte amigavelmente o dado que faltou (ex: "Qual foi o valor gasto nessa compra? 💰").
   - Se 'unknown': responda educadamente dizendo como eles podem registrar ou consultar (ex: "Olá! Para registrar um gasto, diga por exemplo: '35 reais no almoço com cartão VR' ou 'Mercado 120 reais no Nubank'. Para consultar saldos, basta perguntar: 'Qual o saldo do Pluxee VA?' ou 'Quanto tenho no cartão Caju?' 💳").

5. CONSULTA DE SALDO E LIMITES ('check_balance'):
   - Se o usuário perguntar o saldo ou valor disponível de um benefício (ex: "qual o valor que tem no cartão pluxee VA", "quanto tenho no caju?", "saldo VR", "quanto sobrou no vale refeição"):
     * Identifique o cartão correspondente nas listas acima e defina 'matchedCardId'.
     * Configure 'paymentTarget' como 'benefit_card'.
     * Na 'replyMessage', responda com o saldo atual exato em R$ do cartão mencionado de forma amigável e com emojis (ex: "O saldo atual do seu cartão Pluxee (VA) é de R$ 270,00 🍽️" ou "Você tem R$ 726,00 disponíveis no cartão Caju (VR) 🥗").
   - Se o usuário perguntar o limite de um cartão de crédito (ex: "quanto tenho de limite no Nubank?", "qual limite disponível no cartão Inter?"):
     * Identifique o cartão correspondente nas listas acima e defina 'matchedCardId'.
     * Configure 'paymentTarget' como 'credit_card'.
     * Na 'replyMessage', responda com o limite disponível e o limite total em R$ (ex: "Seu cartão Nubank está com R$ 1.450,00 de limite disponível (de um limite total de R$ 3.000,00) 💳").
   - Se a pergunta for ampla ou geral (ex: "quais os saldos dos meus cartões?", "meus saldos", "quanto temos nos cartões?"):
     * Defina 'matchedCardId' como null.
     * Na 'replyMessage', gere uma lista clara, organizada e bonita com todos os cartões cadastrados e seus respectivos saldos de benefícios e limites de crédito disponíveis.

6. CONTINUIDADE E CONTEXTO DE CONVERSA (MEMÓRIA MULTI-TURN - EXTREMAMENTE IMPORTANTE):
   - Os usuários no WhatsApp enviam mensagens fragmentadas e sequenciais (exemplo: primeiro 'sorvete na sorveteria do shopping' e depois '13 reais no nubank', ou 'almoço' e depois '30 reais no vr', ou se perguntar o local 'foi na kibon').
   - ANALISE SEMPRE O HISTÓRICO RECENTE: Se houver contexto de mensagens anteriores:
     * NUNCA pergunte novamente o que já foi respondido ou esclarecido no histórico!
     * COMBINE as informações anteriores (item, local/estabelecimento, cartão citado) com as novas mensagens (valor, complemento de local, cartão).
     * Se o usuário acrescentar onde foi a compra (ex: 'foi no McDonald's' ou 'na Bacio di Latte') durante ou logo após a conversa, atualize a descrição da compra.
     * Conclua o lançamento com intent 'register_expense', informando descrição completa (Item + Local), valor e cartão na replyMessage!
`;

  // Modelos em ordem de prioridade com fallback automático caso o tier da chave não suporte um deles
  const candidateModels = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];

  let lastError: unknown;

  for (const modelName of candidateModels) {
    try {
      const { object } = await generateObject({
        model: google(modelName),
        schema: WhatsAppFinancialExtractionSchema,
        system: promptSystem,
        prompt: `Mensagem enviada pelo usuário: "${messageText}"`,
      });

      return object;
    } catch (error) {
      lastError = error;
      console.warn(
        `[WHATSAPP_AI_MODEL_FALLBACK] Modelo ${modelName} falhou, tentando próximo modelo... Erro:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  throw lastError || new Error("Nenhum modelo do Gemini respondeu com sucesso.");
}
