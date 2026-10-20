export type Role = "PARTNER" | "ADMIN";

export type IncomeCategory =
  | "SALARY"
  | "VR"
  | "VA"
  | "BONUS"
  | "EXTRA"
  | "INVESTMENT"
  | "OTHER";

export type WalletType =
  | "FREE"        // Carteira Livre (Salário Líquido, Bônus, Renda Extra, Débito/Pix)
  | "BENEFITS";   // Carteira de Benefícios (VR e VA)

export type BenefitType = "VR" | "VA";

export type ExpenseCategory =
  | "HOUSING"           // Aluguel, Condomínio
  | "UTILITIES"         // Luz, Água, Internet, Gás
  | "LOAN_INSTALLMENT"  // Parcela de Empréstimo
  | "FOOD_MARKET"       // Mercado
  | "FOOD_PROTEIN"      // Mistura / Carnes / Açougue
  | "SWEETS_SNACKS"     // Doces / Padaria / Lanches
  | "EAT_OUT_DELIVERY"  // Comer Fora / Restaurante / Delivery
  | "WEEKLY_SHOPPING"   // Compras da semana / Feira
  | "LEISURE"           // Lazer / Cinema
  | "TRANSPORT"         // Combustível / Transporte
  | "HEALTH"            // Farmácia / Saúde
  | "SUBSCRIPTION"      // Assinaturas / Streaming
  | "OTHER";

export type ExpenseType = "FIXED" | "VARIABLE" | "LOAN";

export type PaymentMethod =
  | "DEBIT_PIX"     // Débito / Pix / Conta Corrente (Carteira Livre)
  | "VR"            // Vale Refeição (Carteira de Benefícios)
  | "VA"            // Vale Alimentação (Carteira de Benefícios)
  | "CREDIT_CARD";  // Cartão de Crédito (Impacta Carteira Livre na Fatura)

export type LoanStatus = "ACTIVE" | "PAID_OFF";

export type AbatementType = "REDUCE_TERM" | "REDUCE_INSTALLMENT";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  salaryGross: number;
  salaryNet: number;
  vrAmount: number;
  vaAmount: number;
  incomeProportion: number; // Proporção no orçamento (%)
}

export interface Income {
  id: string;
  description: string;
  amountGross: number;
  amountNet: number;
  category: IncomeCategory;
  walletType: WalletType;
  benefitType?: BenefitType;
  receivedAt: string; // ISO date string
  userId: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  category: ExpenseCategory;
  expenseType: ExpenseType;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  dueDate?: string;
  creditCardInvoiceMonth?: string;
  loanId?: string;
  creditCardId?: string;
  benefitCardId?: string;
  userId: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  color: string;
  lastFourDigits?: string;
  totalLimit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  userId: string;
  installments?: CreditCardInstallment[];
}

export interface CreditCardInstallment {
  id: string;
  cardId: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  category: ExpenseCategory;
  purchaseDate: string;
  userId: string;
}

export interface BenefitCard {
  id: string;
  name: string;
  type: BenefitType; // "VR" | "VA"
  currentBalance: number;
  monthlyDeposit: number;
  depositDay: number;
  color: string;
  lastFourDigits?: string;
  userId: string;
}

export interface Loan {
  id: string;
  name: string;
  bank: string;
  originalAmount: number;
  currentBalance: number;
  monthlyInterestRate: number; // % ao mês (ex: 4.85)
  totalInstallments: number;
  paidInstallments: number;
  currentInstallmentAmount: number;
  dueDay: number;
  status: LoanStatus;
  notes?: string;
}

export interface LoanAmortization {
  id: string;
  loanId: string;
  amountPaid: number;
  interestDiscount: number;
  totalAbated: number; // amountPaid + interestDiscount
  abatementType: AbatementType;
  installmentsReduced: number;
  previousInstallmentAmount?: number;
  newInstallmentAmount?: number;
  date: string;
  userId: string;
  notes?: string;
}

export interface EmergencyFund {
  id: string;
  currentAmount: number;
  targetMonths: number; // 3, 6 ou 12
  monthlyLivingCostCalculated: number;
  notes?: string;
}

export interface EmergencyDeposit {
  id: string;
  fundId: string;
  amount: number;
  date: string;
  userId: string;
  notes?: string;
}

export interface CoupleSettings {
  coupleName: string;
  emergencyFundMonthsTarget: number;
  user1SalaryProportion: number;
  user2SalaryProportion: number;
}
