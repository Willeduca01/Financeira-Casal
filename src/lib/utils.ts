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
    const rateA = a.interestRate ?? a.monthlyInterestRate ?? 0;
    const rateB = b.interestRate ?? b.monthlyInterestRate ?? 0;
    return rateB - rateA;
  });
}

/**
 * Ordena os empréstimos pelo Método Bola de Neve (Snowball):
 * Do MENOR saldo devedor restante para o MAIOR (foco em eliminar parcelas rápido).
 */
export function sortLoansBySnowball(loans: Loan[]): Loan[] {
  return [...loans].sort((a, b) => {
    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
    if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
    const remainingA = Math.max(0, a.totalInstallments - a.paidInstallments);
    const remainingB = Math.max(0, b.totalInstallments - b.paidInstallments);
    const balanceA = a.currentBalance > 0 ? a.currentBalance : remainingA * (a.installmentAmount ?? a.currentInstallmentAmount ?? 0);
    const balanceB = b.currentBalance > 0 ? b.currentBalance : remainingB * (b.installmentAmount ?? b.currentInstallmentAmount ?? 0);
    return balanceA - balanceB;
  });
}

/**
 * Calcula o Valor Presente (VP) das últimas n parcelas do contrato trazidas a valor presente:
 * VP = sum_{m = R - n + 1}^{R} (Parcela / (1 + i)^m)
 * onde i = taxa mensal / 100, R = total de parcelas restantes, n = parcelas a antecipar.
 */
export function calculatePresentValueAbatement(
  installmentAmount: number,
  monthlyInterestRate: number,
  installmentsToAbate: number,
  remainingInstallments: number
): {
  presentValue: number;
  originalValue: number;
  savedAmount: number;
  discountPercent: number;
} {
  const n = Math.max(1, Math.min(installmentsToAbate, remainingInstallments));
  const originalValue = Number((n * installmentAmount).toFixed(2));
  const rate = monthlyInterestRate / 100;

  if (rate <= 0 || installmentAmount <= 0) {
    return {
      presentValue: originalValue,
      originalValue,
      savedAmount: 0,
      discountPercent: 0,
    };
  }

  // Desconto das últimas n parcelas (do final do contrato para frente)
  let pvTotal = 0;
  const startMonth = Math.max(1, remainingInstallments - n + 1);
  const endMonth = remainingInstallments;

  for (let m = startMonth; m <= endMonth; m++) {
    const pv = installmentAmount / Math.pow(1 + rate, m);
    pvTotal += pv;
  }

  const presentValue = Number(pvTotal.toFixed(2));
  const savedAmount = Number(Math.max(0, originalValue - presentValue).toFixed(2));
  const discountPercent = originalValue > 0 ? Number(((savedAmount / originalValue) * 100).toFixed(1)) : 0;

  return {
    presentValue,
    originalValue,
    savedAmount,
    discountPercent,
  };
}

/**
 * Calcula a estimativa de quitação à vista de todo o saldo restante hoje (VP de todas as parcelas restantes)
 */
export function calculateTotalPayoffToday(loans: Loan[]): number {
  return loans
    .filter((l) => l.status === "ACTIVE")
    .reduce((sum, l) => {
      const remaining = Math.max(0, l.totalInstallments - l.paidInstallments);
      const installment = l.installmentAmount ?? l.currentInstallmentAmount ?? 0;
      const rate = (l.interestRate ?? l.monthlyInterestRate ?? 0) / 100;
      if (remaining <= 0 || installment <= 0) return sum;
      if (rate <= 0) return sum + remaining * installment;

      let loanPv = 0;
      for (let m = 1; m <= remaining; m++) {
        loanPv += installment / Math.pow(1 + rate, m);
      }
      return sum + loanPv;
    }, 0);
}

/**
 * Simula o impacto de um aporte mensal extraordinário recorrente (ex: R$ 500/mês a mais)
 * Retorna: meses economizados e valor estimado total economizado em juros.
 */
export function simulateExtraMonthlyAmortization(
  loans: Loan[],
  extraMonthlyAmount: number,
  strategy: "AVALANCHE" | "SNOWBALL" = "AVALANCHE"
): {
  baselineMonths: number;
  acceleratedMonths: number;
  monthsSaved: number;
  projectedInterestSavings: number;
} {
  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  if (activeLoans.length === 0) {
    return { baselineMonths: 0, acceleratedMonths: 0, monthsSaved: 0, projectedInterestSavings: 0 };
  }

  // Prazo baseline é o maior prazo restante entre os empréstimos ativos
  const baselineMonths = Math.max(
    ...activeLoans.map((l) => Math.max(0, l.totalInstallments - l.paidInstallments)),
    0
  );

  if (extraMonthlyAmount <= 0) {
    return {
      baselineMonths,
      acceleratedMonths: baselineMonths,
      monthsSaved: 0,
      projectedInterestSavings: 0,
    };
  }

  // Simulação mês a mês da quitação com sobra extra
  const sorted = strategy === "AVALANCHE" ? sortLoansByAvalanche(activeLoans) : sortLoansBySnowball(activeLoans);
  
  // Clone dos saldos e parcelas para a simulação
  let simulatedLoans = sorted.map((l) => {
    const remaining = Math.max(0, l.totalInstallments - l.paidInstallments);
    const installment = l.installmentAmount ?? l.currentInstallmentAmount ?? 0;
    const rate = (l.interestRate ?? l.monthlyInterestRate ?? 0) / 100;
    return {
      remaining,
      installment,
      rate,
    };
  });

  let month = 0;
  let totalInterestSaved = 0;
  const maxSimulationMonths = 240;

  while (simulatedLoans.some((l) => l.remaining > 0) && month < maxSimulationMonths) {
    month++;
    let extraAvailable = extraMonthlyAmount;

    for (const l of simulatedLoans) {
      if (l.remaining <= 0) continue;
      // Pagamento regular do mês
      l.remaining = Math.max(0, l.remaining - 1);

      // Amortização extraordinária se houver sobra
      if (extraAvailable > 0 && l.remaining > 0 && l.installment > 0) {
        // Traz as parcelas do final do contrato a valor presente
        const possibleAbated = Math.min(
          l.remaining,
          Math.max(1, Math.floor(extraAvailable / (l.installment / Math.pow(1 + l.rate, l.remaining))))
        );
        const { presentValue, savedAmount } = calculatePresentValueAbatement(
          l.installment,
          l.rate * 100,
          possibleAbated,
          l.remaining
        );

        if (extraAvailable >= presentValue && presentValue > 0) {
          l.remaining = Math.max(0, l.remaining - possibleAbated);
          extraAvailable -= presentValue;
          totalInterestSaved += savedAmount;
        }
      }
    }
  }

  const acceleratedMonths = month;
  const monthsSaved = Math.max(0, baselineMonths - acceleratedMonths);

  return {
    baselineMonths,
    acceleratedMonths,
    monthsSaved,
    projectedInterestSavings: Number(totalInterestSaved.toFixed(2)),
  };
}

/**
 * Simula a economia de juros em uma amortização (compatibilidade legada)
 */
export function estimateInterestSavings(
  amountToAmortize: number,
  monthlyInterestRate: number,
  remainingInstallments: number
): number {
  if (amountToAmortize <= 0 || monthlyInterestRate <= 0) return 0;
  const rate = monthlyInterestRate / 100;
  const estimatedSavings = amountToAmortize * rate * Math.min(remainingInstallments, 18) * 0.75;
  return Math.round(estimatedSavings * 100) / 100;
}
