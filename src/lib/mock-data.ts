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

export const INITIAL_USERS: User[] = [
  {
    id: "cmvgv5a7p0000uai46r748p2a",
    name: "William Santos",
    email: "william@casal.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    role: "PARTNER",
    salaryGross: 0,
    salaryNet: 0,
    vrAmount: 0,
    vaAmount: 0,
    incomeProportion: 50.0,
  },
  {
    id: "cmvgv5ag40001uai4go52d5h3",
    name: "Laura Xavier",
    email: "laura@casal.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "PARTNER",
    salaryGross: 0,
    salaryNet: 0,
    vrAmount: 0,
    vaAmount: 0,
    incomeProportion: 50.0,
  },
];

export const INITIAL_COUPLE_SETTINGS: CoupleSettings = {
  coupleName: "Laura & William",
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
