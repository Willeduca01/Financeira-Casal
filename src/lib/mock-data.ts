import {
  User,
  CoupleSettings,
  Loan,
  Income,
  Expense,
  LoanAmortization,
  EmergencyFund,
  CreditCard,
  CreditCardInstallment,
  BenefitCard,
} from "@/types";

// Hash Bcrypt seguro de 10 rounds para o PIN padrão de demonstração '1234'
// Garante que nenhuma senha ou PIN exista em texto puro no código-fonte
const DEFAULT_DEMO_PIN_HASH = "$2b$10$0LY2cW0VOdAe220DnhTu2ObpORd72LVgsGZds/252ETATPl0iCSIG";

/**
 * BLINDAGEM DE SEGURANÇA (PRODUÇÃO):
 * Em ambiente de produção, dados mockados são estritamente desautorizados
 * de serem usados como fallback para evitar que dados fictícios mascararem
 * falhas do banco Neon ou exponham simulações financeiras irreais.
 */
export function assertNoProductionMockFallback(dataContext: string) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      `[SECURITY AUDIT] Tentativa de usar mock-data (${dataContext}) como fallback em PRODUÇÃO rejeitada.`
    );
    throw new Error(
      `[SECURITY EXCEPTION] Dados mockados estão bloqueados em ambiente de produção: ${dataContext}`
    );
  }
}

export const INITIAL_USERS: User[] = [
  {
    id: "user-lucas",
    name: "Lucas Silva",
    email: "lucas@casal.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    role: "PARTNER",
    salaryGross: 0,
    salaryNet: 0,
    vrAmount: 0,
    vaAmount: 0,
    incomeProportion: 50.0,
    pinHash: DEFAULT_DEMO_PIN_HASH,
    pin: DEFAULT_DEMO_PIN_HASH,
  },
  {
    id: "user-mariana",
    name: "Mariana Costa",
    email: "mariana@casal.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "PARTNER",
    salaryGross: 0,
    salaryNet: 0,
    vrAmount: 0,
    vaAmount: 0,
    incomeProportion: 50.0,
    pinHash: DEFAULT_DEMO_PIN_HASH,
    pin: DEFAULT_DEMO_PIN_HASH,
  },
];

export const INITIAL_COUPLE_SETTINGS: CoupleSettings = {
  coupleName: "Finanças do Casal",
  emergencyFundMonthsTarget: 6,
  user1SalaryProportion: 50.0,
  user2SalaryProportion: 50.0,
};

export const INITIAL_LOANS: Loan[] = [];

export const INITIAL_INCOMES: Income[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_AMORTIZATIONS: LoanAmortization[] = [];

export const INITIAL_EMERGENCY_FUND: EmergencyFund = {
  id: "fund-1",
  currentAmount: 0,
  targetMonths: 6,
  monthlyLivingCostCalculated: 0,
  notes: "Reserva de emergência pronta para aportes reais do casal.",
};

export const INITIAL_CREDIT_CARDS: CreditCard[] = [];

export const INITIAL_INSTALLMENTS: CreditCardInstallment[] = [];

export const INITIAL_BENEFIT_CARDS: BenefitCard[] = [];
