import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ExpenseCategory, PaymentMethod, ExpenseType, IncomeCategory, Loan } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número como moeda brasileira (BRL - R$)
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata percentual (ex: 4.85 -> 4,85%)
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Formata data curta no padrão brasileiro (DD/MM ou DD/MM/AAAA)
 */
export function formatDateBR(dateString: string, includeYear: boolean = false): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      ...(includeYear ? { year: "numeric" } : {}),
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Tradução amigável das categorias de despesas
 */
export const CATEGORY_DETAILS: Record<
  ExpenseCategory,
  { label: string; color: string; icon: string; isVariableFood?: boolean }
> = {
  HOUSING: { label: "Moradia & Aluguel", color: "#8C6D53", icon: "Home" },
  UTILITIES: { label: "Contas da Casa", color: "#A3B18A", icon: "Zap" },
  LOAN_INSTALLMENT: { label: "Parcela Empréstimo", color: "#C46D53", icon: "Flame" },
  FOOD_MARKET: { label: "Mercado do Mês", color: "#7A8B68", icon: "ShoppingCart", isVariableFood: true },
  FOOD_PROTEIN: { label: "Mistura / Açougue", color: "#B05B42", icon: "Beef", isVariableFood: true },
  SWEETS_SNACKS: { label: "Doces & Padaria", color: "#D99B52", icon: "Cookie", isVariableFood: true },
  EAT_OUT_DELIVERY: { label: "Comer Fora / Delivery", color: "#E07A5F", icon: "Utensils", isVariableFood: true },
  WEEKLY_SHOPPING: { label: "Compras da Semana / Feira", color: "#9EA98A", icon: "ShoppingBag", isVariableFood: true },
  LEISURE: { label: "Lazer & Passeios", color: "#C2956E", icon: "Sparkles" },
  TRANSPORT: { label: "Transporte / Combustível", color: "#657554", icon: "Car" },
  HEALTH: { label: "Saúde & Farmácia", color: "#A77B68", icon: "HeartPulse" },
  SUBSCRIPTION: { label: "Assinaturas & Apps", color: "#8D7B68", icon: "Tv" },
  OTHER: { label: "Outros Gastos", color: "#A69B8D", icon: "MoreHorizontal" },
};

/**
 * Detalhes dos meios de pagamento
 */
export const PAYMENT_METHOD_DETAILS: Record<
  PaymentMethod,
  { label: string; badge: string; walletName: string; color: string }
> = {
  DEBIT_PIX: {
    label: "Débito / Pix",
    badge: "Conta Corrente",
    walletName: "Carteira Livre",
    color: "#7A8B68",
  },
  VR: {
    label: "Vale Refeição (VR)",
    badge: "Benefício VR",
    walletName: "Carteira Benefícios",
    color: "#D99B52",
  },
  VA: {
    label: "Vale Alimentação (VA)",
    badge: "Benefício VA",
    walletName: "Carteira Benefícios",
    color: "#C2956E",
  },
  CREDIT_CARD: {
    label: "Cartão de Crédito",
    badge: "Fatura Mensal",
    walletName: "Fatura Crédito",
    color: "#C46D53",
  },
};

export const INCOME_CATEGORY_DETAILS: Record<
  IncomeCategory,
  { label: string; color: string }
> = {
  SALARY: { label: "Salário Mensal", color: "#7A8B68" },
  VR: { label: "Vale Refeição (VR)", color: "#D99B52" },
  VA: { label: "Vale Alimentação (VA)", color: "#C2956E" },
  BONUS: { label: "Bônus / PLR", color: "#C46D53" },
  EXTRA: { label: "Renda Extra", color: "#A3B18A" },
  INVESTMENT: { label: "Rendimentos", color: "#8C6D53" },
  OTHER: { label: "Outras Entradas", color: "#786B5E" },
};

/**
 * Ordena os empréstimos pelo Método Avalanche:
 * Da MAIOR taxa de juros mensal para a MENOR.
 */
export function sortLoansByAvalanche(loans: Loan[]): Loan[] {
  return [...loans].sort((a, b) => {
    // Primeiro os ativos
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
    // Se ambos ativos, maior taxa de juros primeiro
    return b.monthlyInterestRate - a.monthlyInterestRate;
  });
}

/**
 * Simula a economia de juros em uma amortização
 * com base na taxa de juros do contrato
 */
export function estimateInterestSavings(
  amountToAmortize: number,
  monthlyInterestRate: number,
  remainingInstallments: number
): number {
  if (amountToAmortize <= 0 || monthlyInterestRate <= 0) return 0;
  // Estimativa aproximada de juros compostos evitados pelo prazo remanescente
  const rate = monthlyInterestRate / 100;
  const estimatedSavings = amountToAmortize * rate * Math.min(remainingInstallments, 18) * 0.75;
  return Math.round(estimatedSavings * 100) / 100;
}
