import { z } from "zod";

/**
 * ==============================================================================
 * SANITIZAÇÃO CONTRA STORED XSS E VALIDAÇÃO ESTREITA (FASE 2)
 * ==============================================================================
 * Funções e helpers de sanitização que removem blocos <script>, tags HTML
 * e caracteres de controle perigosos de strings armazenadas em banco.
 */
export function sanitizeHtmlString(val: string): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[<>]/g, "")
    .trim();
}

/**
 * Helper de texto sanitizado com limites de caracteres
 */
export const sanitizedString = (min = 1, max = 120, fieldName = "Campo") =>
  z
    .string()
    .trim()
    .min(min, `${fieldName} deve conter no mínimo ${min} caractere(s).`)
    .max(max, `${fieldName} não pode exceder ${max} caracteres.`)
    .transform((val) => sanitizeHtmlString(val));

export const optionalSanitizedString = (max = 255) =>
  z
    .string()
    .trim()
    .max(max, `Não pode exceder ${max} caracteres.`)
    .transform((val) => sanitizeHtmlString(val))
    .optional()
    .nullable();

/**
 * Helpers Monetários Rigorosos:
 * Impede injeção de valores negativos em créditos, NaN, Infinity ou overflow.
 */
export const positiveMonetary = (fieldName = "Valor monetário") =>
  z
    .number()
    .positive(`${fieldName} deve ser um valor estritamente maior que zero.`)
    .finite(`${fieldName} inválido (não pode ser infinito ou NaN).`)
    .max(10_000_000, `${fieldName} excede o limite máximo permitido.`);

export const nonNegativeMonetary = (fieldName = "Valor monetário") =>
  z
    .number()
    .nonnegative(`${fieldName} não pode ser um número negativo.`)
    .finite(`${fieldName} inválido (não pode ser infinito ou NaN).`)
    .max(10_000_000, `${fieldName} excede o limite máximo permitido.`);

export const validId = z
  .string()
  .trim()
  .min(1, "ID não pode ser vazio.")
  .max(100, "ID inválido.");

/**
 * ==============================================================================
 * ENUMS DEFINIDOS NO PRISMA SCHEMA E TYPES DO CASAL
 * ==============================================================================
 */
export const IncomeCategoryEnum = z.enum([
  "SALARY",
  "VR",
  "VA",
  "BONUS",
  "EXTRA",
  "INVESTMENT",
  "OTHER",
]);

export const WalletTypeEnum = z.enum(["FREE", "BENEFITS"]);

export const BenefitTypeEnum = z.enum(["VR", "VA"]);

export const ExpenseCategoryEnum = z.enum([
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
]);

export const ExpenseTypeEnum = z.enum(["FIXED", "VARIABLE", "LOAN"]);

export const PaymentMethodEnum = z.enum([
  "DEBIT_PIX",
  "VR",
  "VA",
  "CREDIT_CARD",
]);

export const LoanStatusEnum = z.enum(["ACTIVE", "PAID_OFF"]);

export const AbatementTypeEnum = z.enum([
  "REDUCE_TERM",
  "REDUCE_INSTALLMENT",
]);

/**
 * ==============================================================================
 * SCHEMAS DE ENTIDADES FINANCEIRAS
 * ==============================================================================
 */

// 1. Despesas / Gastos
export const CreateExpenseSchema = z.object({
  description: sanitizedString(1, 120, "Descrição da despesa"),
  amount: positiveMonetary("Valor da despesa"),
  date: z.string().datetime({ message: "Data deve estar no formato ISO 8601 válido." }),
  category: ExpenseCategoryEnum,
  expenseType: ExpenseTypeEnum,
  paymentMethod: PaymentMethodEnum,
  isPaid: z.boolean().default(true),
  dueDate: z.string().datetime().optional().nullable(),
  creditCardInvoiceMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Mês de fatura deve seguir o padrão YYYY-MM (ex: 2026-10)")
    .optional()
    .nullable(),
  loanId: validId.optional().nullable(),
  creditCardId: validId.optional().nullable(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

// 2. Receitas
export const CreateIncomeSchema = z.object({
  description: sanitizedString(1, 120, "Descrição da receita"),
  amountGross: positiveMonetary("Valor bruto"),
  amountNet: positiveMonetary("Valor líquido"),
  category: IncomeCategoryEnum,
  walletType: WalletTypeEnum.default("FREE"),
  benefitType: BenefitTypeEnum.optional().nullable(),
  receivedAt: z.string().datetime({ message: "Data de recebimento no formato ISO 8601." }),
});

export const UpdateIncomeSchema = CreateIncomeSchema.partial();

// 3. Cartões de Crédito
export const CreateCreditCardSchema = z
  .object({
    name: sanitizedString(1, 60, "Nome do cartão"),
    bank: sanitizedString(1, 60, "Banco emissor"),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Cor hexadecimal inválida (ex: #820AD1)")
      .default("#820AD1"),
    lastFourDigits: z
      .string()
      .regex(/^\d{4}$/, "Dígitos finais devem conter exatamente 4 números.")
      .optional()
      .nullable(),
    totalLimit: positiveMonetary("Limite total do cartão"),
    availableLimit: nonNegativeMonetary("Limite liberado/disponível"),
    closingDay: z.number().int().min(1, "Dia mínimo é 1").max(31, "Dia máximo é 31"),
    dueDay: z.number().int().min(1, "Dia mínimo é 1").max(31, "Dia máximo é 31"),
  })
  .refine((data) => data.availableLimit <= data.totalLimit, {
    message: "O limite disponível não pode ser superior ao limite total do cartão.",
    path: ["availableLimit"],
  });

export const UpdateCreditCardSchema = z.object({
  name: sanitizedString(1, 60, "Nome do cartão").optional(),
  bank: sanitizedString(1, 60, "Banco emissor").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  lastFourDigits: z.string().regex(/^\d{4}$/).optional().nullable(),
  totalLimit: positiveMonetary("Limite total").optional(),
  availableLimit: nonNegativeMonetary("Limite liberado").optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
});

// 4. Parcelamento de Cartão
export const CreateCreditCardInstallmentSchema = z.object({
  cardId: validId,
  description: sanitizedString(1, 120, "Descrição da compra parcelada"),
  totalAmount: positiveMonetary("Valor total parcelado"),
  installmentAmount: positiveMonetary("Valor da parcela"),
  totalInstallments: z.number().int().min(1).max(120, "Máximo de 120 parcelas"),
  currentInstallment: z.number().int().min(1).max(120).default(1),
  category: ExpenseCategoryEnum.default("OTHER"),
  purchaseDate: z.string().datetime().optional(),
});

// 5. Cartão de Benefício (VR/VA)
export const CreateBenefitCardSchema = z.object({
  name: sanitizedString(1, 60, "Nome do cartão benefício"),
  type: BenefitTypeEnum,
  currentBalance: nonNegativeMonetary("Saldo atual"),
  monthlyDeposit: nonNegativeMonetary("Recarga mensal"),
  depositDay: z.number().int().min(1).max(31).default(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#7A8B68"),
  lastFourDigits: z.string().regex(/^\d{4}$/).optional().nullable(),
});

export const UpdateBenefitCardSchema = z.object({
  name: sanitizedString(1, 60, "Nome do cartão benefício").optional(),
  currentBalance: nonNegativeMonetary("Saldo atual").optional(),
  monthlyDeposit: nonNegativeMonetary("Recarga mensal").optional(),
  depositDay: z.number().int().min(1).max(31).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  lastFourDigits: z.string().regex(/^\d{4}$/).optional().nullable(),
});

// 6. Amortização de Empréstimos (Método Avalanche)
export const CreateLoanAmortizationSchema = z.object({
  loanId: validId,
  amountPaid: positiveMonetary("Valor pago na amortização"),
  interestDiscount: nonNegativeMonetary("Desconto de juros obtido").default(0),
  abatementType: AbatementTypeEnum,
  installmentsReduced: z.number().int().nonnegative().default(0),
  previousInstallmentAmount: positiveMonetary("Valor anterior da parcela").optional().nullable(),
  newInstallmentAmount: positiveMonetary("Novo valor da parcela").optional().nullable(),
  notes: optionalSanitizedString(255),
});

// 7. Aporte na Reserva de Emergência
export const CreateEmergencyDepositSchema = z.object({
  fundId: validId,
  amount: positiveMonetary("Valor do aporte"),
  notes: optionalSanitizedString(255),
});

// 8. Pagamento de Parcela Mensal
export const PayLoanInstallmentSchema = z.object({
  loanId: validId,
});

/**
 * ==============================================================================
 * DISPATCHER ACTION SCHEMAS (POST, PUT, DELETE)
 * ==============================================================================
 */
export const FinancePostActionSchema = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("expense"), data: CreateExpenseSchema }),
  z.object({ entity: z.literal("income"), data: CreateIncomeSchema }),
  z.object({ entity: z.literal("creditCard"), data: CreateCreditCardSchema }),
  z.object({ entity: z.literal("installment"), data: CreateCreditCardInstallmentSchema }),
  z.object({ entity: z.literal("benefitCard"), data: CreateBenefitCardSchema }),
  z.object({ entity: z.literal("amortization"), data: CreateLoanAmortizationSchema }),
  z.object({ entity: z.literal("emergencyDeposit"), data: CreateEmergencyDepositSchema }),
  z.object({ entity: z.literal("payInstallment"), data: PayLoanInstallmentSchema }),
]);

export const FinancePutActionSchema = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("expense"), id: validId, data: UpdateExpenseSchema }),
  z.object({ entity: z.literal("income"), id: validId, data: UpdateIncomeSchema }),
  z.object({ entity: z.literal("creditCard"), id: validId, data: UpdateCreditCardSchema }),
  z.object({ entity: z.literal("benefitCard"), id: validId, data: UpdateBenefitCardSchema }),
]);

export const FinanceDeleteQuerySchema = z.object({
  entity: z.enum([
    "expense",
    "income",
    "creditCard",
    "installment",
    "benefitCard",
  ]),
  id: validId,
});
