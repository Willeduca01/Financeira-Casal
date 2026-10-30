"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  User,
  CoupleSettings,
  Loan,
  LoanPayment,
  LoanStrategy,
  Income,
  Expense,
  LoanAmortization,
  EmergencyFund,
  EmergencyDeposit,
  PaymentMethod,
  AbatementType,
  CreditCard,
  CreditCardInstallment,
  BenefitCard,
} from "@/types";
import {
  INITIAL_USERS,
  INITIAL_COUPLE_SETTINGS,
  INITIAL_LOANS,
  INITIAL_INCOMES,
  INITIAL_EXPENSES,
  INITIAL_AMORTIZATIONS,
  INITIAL_EMERGENCY_FUND,
  INITIAL_CREDIT_CARDS,
  INITIAL_INSTALLMENTS,
  INITIAL_BENEFIT_CARDS,
} from "@/lib/mock-data";
import { sortLoansByAvalanche, estimateInterestSavings } from "@/lib/utils";

interface FinanceContextType {
  // Autenticação & Perfil do Casal
  isAuthenticated: boolean;
  login: (userId: string, pin: string, remember?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserPin: (userId: string, oldPin: string, newPin: string) => Promise<{ success: boolean; message?: string }>;

  // Usuário Ativo
  currentUser: User;
  switchUser: (userId: string) => void;
  users: User[];
  coupleSettings: CoupleSettings;

  // Filtros Globais
  selectedMonth: number; // 0-11
  selectedYear: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;

  // Dados
  incomes: Income[];
  expenses: Expense[];
  loans: Loan[];
  amortizations: LoanAmortization[];
  emergencyFund: EmergencyFund;
  creditCards: CreditCard[];
  installments: CreditCardInstallment[];
  benefitCards: BenefitCard[];

  // Ações CRUD
  addExpense: (expense: Omit<Expense, "id" | "userId"> & { userId?: string }) => void;
  updateExpense: (id: string, updated: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  toggleFixedExpensePaid: (id: string) => void;
  addIncome: (income: Omit<Income, "id" | "userId"> & { userId?: string }) => void;
  deleteIncome: (id: string) => void;

  // Gestão de Empréstimos do Casal
  addLoan: (loan: Omit<Loan, "id" | "totalSaved" | "currentBalance"> & { id?: string; totalSaved?: number; currentBalance?: number }) => void;
  updateLoan: (id: string, updated: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  payRegularLoanInstallment: (loanId: string, createTransaction?: boolean) => void;
  amortizeLoanEarly: (payload: {
    loanId: string;
    installmentsAbated: number;
    originalValue: number;
    paidValue: number;
    strategy: LoanStrategy;
    newInstallmentAmount?: number;
    registerTransaction?: boolean;
    notes?: string;
  }) => void;
  amortizeLoan: (
    loanId: string,
    params: {
      amountPaid: number;
      interestDiscount: number;
      abatementType: AbatementType;
      installmentsReduced?: number;
      newInstallmentAmount?: number;
      notes?: string;
    }
  ) => void;
  payMonthlyInstallment: (loanId: string) => void;
  addEmergencyDeposit: (amount: number, notes?: string) => void;
  updateEmergencyFund: (data: Partial<EmergencyFund>) => Promise<void>;
  withdrawEmergencyFund: (amount: number, notes?: string, createIncomeTransaction?: boolean) => Promise<void>;
  
  // Ações CRUD Cartões & Benefícios
  addCreditCard: (card: Omit<CreditCard, "id">) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addInstallment: (installment: Omit<CreditCardInstallment, "id">) => void;
  deleteInstallment: (id: string) => void;
  addBenefitCard: (card: Omit<BenefitCard, "id">) => void;
  updateBenefitCard: (id: string, card: Partial<BenefitCard>) => void;
  updateBenefitCardBalance: (id: string, newBalance: number) => void;
  deleteBenefitCard: (id: string) => void;
  
  // Configurações de Usuário e Casal
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<void>;
  updateCoupleSettings: (data: Partial<CoupleSettings>) => Promise<void>;
  clearAllTransactionalData: () => Promise<void>;
  resetAllData: () => void;
  refreshFinances: () => Promise<void>;
  isSyncing: boolean;

  cardsMetrics: {
    totalCreditLimit: number;
    totalAvailableLimit: number;
    totalCommittedLimit: number;
    totalMonthlyInstallmentsAmount: number;
    totalBenefitBalanceVR: number;
    totalBenefitBalanceVA: number;
    totalBenefitBalance: number;
    totalMonthlyBenefitDeposit: number;
    totalMonthlyBenefitDepositVR: number;
    totalMonthlyBenefitDepositVA: number;
    usedCreditPercentage: number;
    activeCardsCount: number;
  };

  // Cálculos das Carteiras & Orçamento
  freeWallet: {
    totalIncomeNet: number;
    totalSpentPaid: number;
    currentBalance: number;
    projectedExpenses: number;
    projectedSurplus: number;
  };

  benefitsWallet: {
    totalVRReceived: number;
    totalVRSpent: number;
    remainingVR: number;
    vrUsagePercent: number;
    totalVAReceived: number;
    totalVASpent: number;
    remainingVA: number;
    vaUsagePercent: number;
    totalBenefitsReceived: number;
    totalBenefitsSpent: number;
    remainingTotal: number;
    cardsMonthlyDepositVR: number;
    cardsMonthlyDepositVA: number;
    totalMonthlyDeposit: number;
    benefitCardsCount: number;
  };

  creditCard: {
    totalInvoiceAmount: number;
    expenseInvoiceAmount: number;
    monthlyInstallmentsAmount: number;
    totalCreditLimit: number;
    totalAvailableLimit: number;
    totalCommittedLimit: number;
    usedPercentage: number;
    cardsCount: number;
    installmentsCount: number;
  };

  incomeStats: {
    totalGross: number;
    totalNet: number;
    lucasNet: number;
    marianaNet: number;
    lucasProportion: number;
    marianaProportion: number;
  };

  expenseStats: {
    totalFixed: number;
    totalLoans: number;
    totalFixedAndLoans: number;
    totalVariable: number;
    totalGeneral: number;
    lucasSpent: number;
    marianaSpent: number;
    lucasSpentPercent: number;
    marianaSpentPercent: number;
  };

  // Motor Avalanche
  avalanche: {
    sortedLoans: Loan[];
    targetLoan: Loan | null;
    totalDebtBalance: number;
    totalMonthlyInstallments: number;
    suggestedAmortizationAmount: number;
    estimatedSavingsOnTarget: number;
  };

  // Reserva de Emergência
  emergencyFundMetrics: {
    currentAmount: number;
    monthlyLivingCost: number;
    targets: {
      threeMonths: number;
      sixMonths: number;
      twelveMonths: number;
    };
    progressPercent: number;
  };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = "financas_casal_v2_";

// Helper robusto para garantir conversão numérica estrita e prevenir concatenação de strings
const parseNumber = (val: any, fallback = 0): number => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  const parsed = parseFloat(String(val).replace(",", "."));
  return isNaN(parsed) ? fallback : parsed;
};

const normalizeLoan = (l: any): Loan => {
  const title = l.title || l.name || "Empréstimo";
  const institution = l.institution || l.bank || "Banco";
  const principalAmount = parseNumber(l.principalAmount ?? l.originalAmount);
  const installmentAmount = parseNumber(l.installmentAmount ?? l.currentInstallmentAmount);
  const interestRate = parseNumber(l.interestRate ?? l.monthlyInterestRate);
  const totalInstallments = parseNumber(l.totalInstallments, 1);
  const paidInstallments = parseNumber(l.paidInstallments, 0);
  const remaining = Math.max(0, totalInstallments - paidInstallments);
  const currentBalance = parseNumber(l.currentBalance, remaining * installmentAmount);
  const totalSaved = parseNumber(l.totalSaved, 0);

  return {
    ...l,
    id: l.id,
    title,
    name: title,
    institution,
    bank: institution,
    profileId: l.profileId || null,
    principalAmount,
    originalAmount: principalAmount,
    installmentAmount,
    currentInstallmentAmount: installmentAmount,
    interestRate,
    monthlyInterestRate: interestRate,
    totalInstallments,
    paidInstallments,
    dueDay: parseNumber(l.dueDay, 10),
    startDate: l.startDate || new Date().toISOString(),
    status: l.status || (remaining <= 0 ? "PAID_OFF" : "ACTIVE"),
    totalSaved,
    currentBalance,
    notes: l.notes || undefined,
    payments: Array.isArray(l.payments)
      ? l.payments.map((p: any) => ({
          ...p,
          originalValue: parseNumber(p.originalValue),
          paidValue: parseNumber(p.paidValue),
          savedAmount: parseNumber(p.savedAmount),
          installmentsAbated: parseNumber(p.installmentsAbated),
        }))
      : [],
  };
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Carregamento com suporte a LocalStorage e Mock inicial
  const [isClient, setIsClient] = useState(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [localUserId, setLocalUserId] = useState<string>("cmvgv5a7p0000uai46r748p2a");
  const currentUserId = session?.user?.id || localUserId;
  const setCurrentUserId = setLocalUserId;
  const [coupleSettings, setCoupleSettings] = useState<CoupleSettings>(INITIAL_COUPLE_SETTINGS);

  const [selectedMonth, setSelectedMonth] = useState<number>(9); // Outubro
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const [incomes, setIncomes] = useState<Income[]>(INITIAL_INCOMES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [amortizations, setAmortizations] = useState<LoanAmortization[]>(INITIAL_AMORTIZATIONS);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund>(INITIAL_EMERGENCY_FUND);
  const [creditCards, setCreditCards] = useState<CreditCard[]>(INITIAL_CREDIT_CARDS);
  const [installments, setInstallments] = useState<CreditCardInstallment[]>(INITIAL_INSTALLMENTS);
  const [benefitCards, setBenefitCards] = useState<BenefitCard[]>(INITIAL_BENEFIT_CARDS);

  // Sincronização contínua com Neon Postgres (Multi-dispositivos / Nuvem)
  const refreshFromBackend = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch("/api/finances", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();

      if (data?.users && data.users.length > 0) {
        setUsers(
          data.users.map((u: any) => ({
            ...u,
            salaryGross: parseNumber(u.salaryGross),
            salaryNet: parseNumber(u.salaryNet),
            vrAmount: parseNumber(u.vrAmount),
            vaAmount: parseNumber(u.vaAmount),
            incomeProportion: parseNumber(u.incomeProportion, 50),
          }))
        );
      }
      if (data?.coupleSettings) {
        setCoupleSettings(data.coupleSettings);
      }

      if (data?.authenticated) {
        if (data.loans !== undefined) {
          setLoans(data.loans.map(normalizeLoan));
        }
        if (data.expenses !== undefined) {
          setExpenses(
            data.expenses.map((e: any) => ({
              ...e,
              amount: parseNumber(e.amount),
            }))
          );
        }
        if (data.incomes !== undefined) {
          setIncomes(
            data.incomes.map((i: any) => ({
              ...i,
              amountGross: parseNumber(i.amountGross),
              amountNet: parseNumber(i.amountNet),
            }))
          );
        }
        if (data.creditCards !== undefined) {
          setCreditCards(
            data.creditCards.map((c: any) => ({
              ...c,
              totalLimit: parseNumber(c.totalLimit),
              availableLimit: parseNumber(c.availableLimit),
              closingDay: parseNumber(c.closingDay, 1),
              dueDay: parseNumber(c.dueDay, 10),
            }))
          );
        }
        if (data.installments !== undefined) {
          setInstallments(
            data.installments.map((inst: any) => ({
              ...inst,
              totalAmount: parseNumber(inst.totalAmount),
              installmentAmount: parseNumber(inst.installmentAmount),
              totalInstallments: parseNumber(inst.totalInstallments),
              currentInstallment: parseNumber(inst.currentInstallment),
            }))
          );
        }
        if (data.benefitCards !== undefined) {
          setBenefitCards(
            data.benefitCards.map((b: any) => ({
              ...b,
              currentBalance: parseNumber(b.currentBalance),
              monthlyDeposit: parseNumber(b.monthlyDeposit),
              depositDay: parseNumber(b.depositDay, 1),
            }))
          );
        }
        if (data.emergencyFund !== undefined) {
          setEmergencyFund({
            ...data.emergencyFund,
            currentAmount: parseNumber(data.emergencyFund.currentAmount),
            targetMonths: parseNumber(data.emergencyFund.targetMonths, 6),
            monthlyLivingCostCalculated: parseNumber(data.emergencyFund.monthlyLivingCostCalculated),
          });
        }
      }
    } catch (err) {
      console.warn("[SYNC] Erro ao sincronizar com banco em nuvem:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUserId]);

  // Inicialização no cliente
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());

    try {
      // 1. Limpeza automática defensiva de dados demonstrativos legados (v1) no aparelho do usuário
      const legacyKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("financas_casal_v1_")) {
          legacyKeys.push(k);
        }
      }
      if (legacyKeys.length > 0) {
        legacyKeys.forEach((k) => localStorage.removeItem(k));
        console.log(`[STORAGE] ${legacyKeys.length} chaves demonstrativas legadas v1 removidas.`);
      }

      // 2. Leitura do LocalStorage v2 com conversão estrita de tipos
      const savedAuth = localStorage.getItem(STORAGE_KEY_PREFIX + "isAuthenticated");
      const savedUsers = localStorage.getItem(STORAGE_KEY_PREFIX + "users");
      const savedCurrentUserId = localStorage.getItem(STORAGE_KEY_PREFIX + "currentUserId");
      const savedIncomes = localStorage.getItem(STORAGE_KEY_PREFIX + "incomes");
      const savedExpenses = localStorage.getItem(STORAGE_KEY_PREFIX + "expenses");
      const savedLoans = localStorage.getItem(STORAGE_KEY_PREFIX + "loans");
      const savedAmortizations = localStorage.getItem(STORAGE_KEY_PREFIX + "amortizations");
      const savedEmergencyFund = localStorage.getItem(STORAGE_KEY_PREFIX + "emergencyFund");
      const savedCreditCards = localStorage.getItem(STORAGE_KEY_PREFIX + "creditCards");
      const savedInstallments = localStorage.getItem(STORAGE_KEY_PREFIX + "installments");
      const savedBenefitCards = localStorage.getItem(STORAGE_KEY_PREFIX + "benefitCards");
      const savedCoupleSettings = localStorage.getItem(STORAGE_KEY_PREFIX + "coupleSettings");

      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          setUsers(
            parsed.map((u: any) => ({
              ...u,
              salaryGross: parseNumber(u.salaryGross),
              salaryNet: parseNumber(u.salaryNet),
              vrAmount: parseNumber(u.vrAmount),
              vaAmount: parseNumber(u.vaAmount),
            }))
          );
        }
      }
      if (savedCoupleSettings) setCoupleSettings(JSON.parse(savedCoupleSettings));
      if (savedCurrentUserId) setCurrentUserId(savedCurrentUserId);
      if (savedIncomes) {
        const parsed = JSON.parse(savedIncomes);
        if (Array.isArray(parsed)) {
          setIncomes(
            parsed.map((i: any) => ({
              ...i,
              amountGross: parseNumber(i.amountGross),
              amountNet: parseNumber(i.amountNet),
            }))
          );
        }
      }
      if (savedExpenses) {
        const parsed = JSON.parse(savedExpenses);
        if (Array.isArray(parsed)) {
          setExpenses(
            parsed.map((e: any) => ({
              ...e,
              amount: parseNumber(e.amount),
            }))
          );
        }
      }
      if (savedLoans) {
        const parsed = JSON.parse(savedLoans);
        if (Array.isArray(parsed)) {
          setLoans(parsed.map(normalizeLoan));
        }
      }
      if (savedAmortizations) setAmortizations(JSON.parse(savedAmortizations));
      if (savedEmergencyFund) {
        const parsed = JSON.parse(savedEmergencyFund);
        setEmergencyFund({
          ...parsed,
          currentAmount: parseNumber(parsed.currentAmount),
          targetMonths: parseNumber(parsed.targetMonths, 6),
          monthlyLivingCostCalculated: parseNumber(parsed.monthlyLivingCostCalculated),
        });
      }
      if (savedCreditCards) {
        const parsed = JSON.parse(savedCreditCards);
        if (Array.isArray(parsed)) {
          setCreditCards(
            parsed.map((c: any) => ({
              ...c,
              totalLimit: parseNumber(c.totalLimit),
              availableLimit: parseNumber(c.availableLimit),
              closingDay: parseNumber(c.closingDay, 1),
              dueDay: parseNumber(c.dueDay, 10),
            }))
          );
        }
      }
      if (savedInstallments) {
        const parsed = JSON.parse(savedInstallments);
        if (Array.isArray(parsed)) {
          setInstallments(
            parsed.map((inst: any) => ({
              ...inst,
              totalAmount: parseNumber(inst.totalAmount),
              installmentAmount: parseNumber(inst.installmentAmount),
              totalInstallments: parseNumber(inst.totalInstallments),
              currentInstallment: parseNumber(inst.currentInstallment),
            }))
          );
        }
      }
      if (savedBenefitCards) {
        const parsed = JSON.parse(savedBenefitCards);
        if (Array.isArray(parsed)) {
          setBenefitCards(
            parsed.map((b: any) => ({
              ...b,
              currentBalance: parseNumber(b.currentBalance),
              monthlyDeposit: parseNumber(b.monthlyDeposit),
              depositDay: parseNumber(b.depositDay, 1),
            }))
          );
        }
      }

    } catch (e) {
      console.warn("Erro ao ler do LocalStorage:", e);
    }

    // 3. Re-sincronizar apenas quando o usuário retornar ao app autenticado
    const handleWindowFocus = () => {
      if (status === "authenticated") {
        refreshFromBackend();
      }
    };
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [status, refreshFromBackend]);

  // Sincronização pós-autenticação segura via NextAuth
  useEffect(() => {
    if (status === "authenticated") {
      const timer = setTimeout(() => {
        void refreshFromBackend();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [status, refreshFromBackend]);

  // Salvar alterações
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + "users", JSON.stringify(users));
      localStorage.setItem(STORAGE_KEY_PREFIX + "currentUserId", currentUserId);
      localStorage.setItem(STORAGE_KEY_PREFIX + "incomes", JSON.stringify(incomes));
      localStorage.setItem(STORAGE_KEY_PREFIX + "expenses", JSON.stringify(expenses));
      localStorage.setItem(STORAGE_KEY_PREFIX + "loans", JSON.stringify(loans));
      localStorage.setItem(STORAGE_KEY_PREFIX + "amortizations", JSON.stringify(amortizations));
      localStorage.setItem(STORAGE_KEY_PREFIX + "emergencyFund", JSON.stringify(emergencyFund));
      localStorage.setItem(STORAGE_KEY_PREFIX + "creditCards", JSON.stringify(creditCards));
      localStorage.setItem(STORAGE_KEY_PREFIX + "installments", JSON.stringify(installments));
      localStorage.setItem(STORAGE_KEY_PREFIX + "benefitCards", JSON.stringify(benefitCards));
      localStorage.setItem(STORAGE_KEY_PREFIX + "coupleSettings", JSON.stringify(coupleSettings));
    } catch (e) {
      console.error("Erro ao persistir no LocalStorage:", e);
    }
  }, [isClient, users, coupleSettings, currentUserId, incomes, expenses, loans, amortizations, emergencyFund, creditCards, installments, benefitCards]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || users[0],
    [users, currentUserId]
  );

  // Helper para sincronização em background com rollback em caso de erro (Optimistic UI)
  const syncWithBackend = useCallback(
    async (
      execute: () => Promise<Response>,
      rollback: () => void,
      onSuccess?: (resData: any) => void
    ) => {
      try {
        const res = await execute();
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error(`[SYNC_ERROR] Falha na sincronização (${res.status}):`, errText);
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        const json = await res.json();
        if (onSuccess && json?.data) {
          onSuccess(json.data);
        }
      } catch (err) {
        console.error(
          "[OPTIMISTIC_UI_ROLLBACK] Erro na sincronização com o banco. Revertendo para o snapshot anterior:",
          err
        );
        rollback();
      }
    },
    []
  );

  const switchUser = useCallback(
    (userId: string) => {
      setCurrentUserId(userId);
      if (isClient) {
        localStorage.setItem(STORAGE_KEY_PREFIX + "currentUserId", userId);
      }
    },
    [isClient]
  );

  // Autenticação Segura via NextAuth Credentials no Servidor (Sem comparação de PIN no cliente)
  const login = useCallback(
    async (
      userId: string,
      pin: string,
      remember: boolean = true
    ): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await signIn("credentials", {
          redirect: false,
          userId,
          password: pin.trim(),
        });

        if (!res || res.error || !res.ok) {
          return { success: false, message: "PIN incorreto ou usuário não autorizado." };
        }

        setLocalUserId(userId);

        if (remember && isClient) {
          localStorage.setItem(STORAGE_KEY_PREFIX + "isAuthenticated", "true");
          localStorage.setItem(STORAGE_KEY_PREFIX + "currentUserId", userId);
        }

        await refreshFromBackend();
        return { success: true };
      } catch (err) {
        console.error("[AUTH_LOGIN_ERROR]", err);
        return { success: false, message: "Erro de comunicação ao validar credenciais." };
      }
    },
    [isClient, refreshFromBackend]
  );

  const logout = useCallback(() => {
    if (isClient) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + "isAuthenticated");
      localStorage.removeItem(STORAGE_KEY_PREFIX + "currentUserId");
    }
    try {
      signOut({ redirect: false }).catch(() => {});
    } catch {}
  }, [isClient]);

  // Troca de PIN Segura no Servidor (Validação do PIN atual via bcrypt no servidor)
  const updateUserPin = useCallback(
    async (
      _userId: string,
      oldPin: string,
      newPin: string
    ): Promise<{ success: boolean; message?: string }> => {
      if (newPin.trim().length < 4) {
        return { success: false, message: "O novo PIN deve ter pelo menos 4 dígitos." };
      }

      try {
        const res = await fetch("/api/finances", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "user",
            id: currentUserId,
            data: {
              currentPin: oldPin.trim(),
              newPin: newPin.trim(),
            },
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            message: data.message || data.error || "Erro ao atualizar PIN no servidor.",
          };
        }

        return { success: true, message: "PIN alterado com sucesso no servidor!" };
      } catch (err) {
        console.error("[UPDATE_PIN_ERROR]", err);
        return { success: false, message: "Falha de comunicação ao alterar PIN." };
      }
    },
    [currentUserId]
  );

  // Filtragem de movimentações do mês/ano selecionado
  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      const d = new Date(inc.receivedAt);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [incomes, selectedMonth, selectedYear]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const d = new Date(exp.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // CÁLCULO: 1. Rastreabilidade e Divisão do Casal (Receitas)
  // Somente receitas efetivamente cadastradas e registradas no banco para o mês selecionado
  const incomeStats = useMemo(() => {
    const user1Id = users[0]?.id;
    const user2Id = users[1]?.id;

    const totalGross = filteredIncomes.reduce(
      (sum, inc) => sum + parseNumber(inc.amountGross),
      0
    );
    const totalNet = filteredIncomes.reduce(
      (sum, inc) => sum + parseNumber(inc.amountNet),
      0
    );

    const lucasNet = filteredIncomes
      .filter((inc) => inc.userId === user1Id || inc.userId === "user-lucas")
      .reduce((sum, inc) => sum + parseNumber(inc.amountNet), 0);

    const marianaNet = filteredIncomes
      .filter((inc) => inc.userId === user2Id || inc.userId === "user-mariana")
      .reduce((sum, inc) => sum + parseNumber(inc.amountNet), 0);

    const totalNetCombined = lucasNet + marianaNet;
    const lucasProportion =
      totalNetCombined > 0 ? (lucasNet / totalNetCombined) * 100 : 0;
    const marianaProportion =
      totalNetCombined > 0 ? (marianaNet / totalNetCombined) * 100 : 0;

    return {
      totalGross,
      totalNet,
      lucasNet,
      marianaNet,
      lucasProportion: Math.round(lucasProportion * 10) / 10,
      marianaProportion: Math.round(marianaProportion * 10) / 10,
    };
  }, [filteredIncomes, users]);

  // CÁLCULO: 2. Métricas dos Cartões de Crédito & Benefícios (VR/VA)
  // Valores dos cartões de crédito e benefícios registrados no banco de dados
  const cardsMetrics = useMemo(() => {
    const totalCreditLimit = creditCards.reduce(
      (acc, c) => acc + parseNumber(c.totalLimit),
      0
    );
    const totalAvailableLimit = creditCards.reduce(
      (acc, c) => acc + parseNumber(c.availableLimit),
      0
    );
    const totalCommittedLimit = Math.max(0, totalCreditLimit - totalAvailableLimit);
    const totalMonthlyInstallmentsAmount = installments.reduce(
      (acc, i) => acc + parseNumber(i.installmentAmount),
      0
    );

    const totalBenefitBalanceVR = benefitCards
      .filter((b) => b.type === "VR")
      .reduce((acc, b) => acc + parseNumber(b.currentBalance), 0);

    const totalBenefitBalanceVA = benefitCards
      .filter((b) => b.type === "VA")
      .reduce((acc, b) => acc + parseNumber(b.currentBalance), 0);

    const totalBenefitBalance = totalBenefitBalanceVR + totalBenefitBalanceVA;

    const totalMonthlyBenefitDepositVR = benefitCards
      .filter((b) => b.type === "VR")
      .reduce((acc, b) => acc + parseNumber(b.monthlyDeposit), 0);

    const totalMonthlyBenefitDepositVA = benefitCards
      .filter((b) => b.type === "VA")
      .reduce((acc, b) => acc + parseNumber(b.monthlyDeposit), 0);

    const totalMonthlyBenefitDeposit = totalMonthlyBenefitDepositVR + totalMonthlyBenefitDepositVA;

    const usedCreditPercentage =
      totalCreditLimit > 0 ? Math.round((totalCommittedLimit / totalCreditLimit) * 100) : 0;

    return {
      totalCreditLimit,
      totalAvailableLimit,
      totalCommittedLimit,
      totalMonthlyInstallmentsAmount,
      totalBenefitBalanceVR,
      totalBenefitBalanceVA,
      totalBenefitBalance,
      totalMonthlyBenefitDeposit,
      totalMonthlyBenefitDepositVR,
      totalMonthlyBenefitDepositVA,
      usedCreditPercentage,
      activeCardsCount: creditCards.length,
    };
  }, [creditCards, installments, benefitCards]);

  // CÁLCULOS: 3. Cartão de Crédito
  const creditCard = useMemo(() => {
    const expenseInvoiceAmount = filteredExpenses
      .filter((exp) => exp.paymentMethod === "CREDIT_CARD")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    const monthlyInstallmentsAmount = cardsMetrics.totalMonthlyInstallmentsAmount;
    const totalInvoiceAmount = expenseInvoiceAmount + monthlyInstallmentsAmount;

    return {
      totalInvoiceAmount,
      expenseInvoiceAmount,
      monthlyInstallmentsAmount,
      totalCreditLimit: cardsMetrics.totalCreditLimit,
      totalAvailableLimit: cardsMetrics.totalAvailableLimit,
      totalCommittedLimit: cardsMetrics.totalCommittedLimit,
      usedPercentage: cardsMetrics.usedCreditPercentage,
      cardsCount: cardsMetrics.activeCardsCount,
      installmentsCount: installments.length,
    };
  }, [filteredExpenses, cardsMetrics, installments.length]);

  // CÁLCULOS: 4. Carteira de Benefícios (VR e VA - Sincronizado com os cartões)
  const benefitsWallet = useMemo(() => {
    // 1. Entradas VR e VA por receitas do extrato
    const totalVRReceived = filteredIncomes
      .filter((inc) => inc.walletType === "BENEFITS" && inc.benefitType === "VR")
      .reduce((sum, inc) => sum + parseNumber(inc.amountNet), 0);

    const totalVAReceived = filteredIncomes
      .filter((inc) => inc.walletType === "BENEFITS" && inc.benefitType === "VA")
      .reduce((sum, inc) => sum + parseNumber(inc.amountNet), 0);

    // 2. Recargas configuradas nos cartões de benefício
    const cardsVRDeposit = cardsMetrics.totalMonthlyBenefitDepositVR;
    const cardsVADeposit = cardsMetrics.totalMonthlyBenefitDepositVA;
    const totalMonthlyDeposit = cardsMetrics.totalMonthlyBenefitDeposit;

    // 3. Gastos no mês em VR e VA
    const totalVRSpent = filteredExpenses
      .filter((exp) => exp.paymentMethod === "VR")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    const totalVASpent = filteredExpenses
      .filter((exp) => exp.paymentMethod === "VA")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    // 4. Saldo restante: Prioriza os saldos reais preenchidos nos cartões de benefício
    const hasBenefitCards = benefitCards.length > 0;
    const remainingVR = hasBenefitCards
      ? cardsMetrics.totalBenefitBalanceVR
      : Math.max(0, totalVRReceived - totalVRSpent);

    const remainingVA = hasBenefitCards
      ? cardsMetrics.totalBenefitBalanceVA
      : Math.max(0, totalVAReceived - totalVASpent);

    const remainingTotal = remainingVR + remainingVA;

    // 5. Porcentagem de uso
    const vrBase = totalVRReceived > 0 ? totalVRReceived : cardsVRDeposit;
    const vaBase = totalVAReceived > 0 ? totalVAReceived : cardsVADeposit;

    const vrUsagePercent =
      totalVRSpent > 0 && vrBase > 0 ? Math.min(100, Math.round((totalVRSpent / vrBase) * 100)) : 0;
    const vaUsagePercent =
      totalVASpent > 0 && vaBase > 0 ? Math.min(100, Math.round((totalVASpent / vaBase) * 100)) : 0;

    const totalBenefitsReceived = totalVRReceived + totalVAReceived;
    const totalBenefitsSpent = totalVRSpent + totalVASpent;

    return {
      totalVRReceived,
      totalVRSpent,
      remainingVR,
      vrUsagePercent,
      totalVAReceived,
      totalVASpent,
      remainingVA,
      vaUsagePercent,
      totalBenefitsReceived,
      totalBenefitsSpent,
      remainingTotal,
      cardsMonthlyDepositVR: cardsVRDeposit,
      cardsMonthlyDepositVA: cardsVADeposit,
      totalMonthlyDeposit,
      benefitCardsCount: benefitCards.length,
    };
  }, [filteredIncomes, filteredExpenses, cardsMetrics, benefitCards.length]);

  // CÁLCULOS: 5. Carteira Livre (Pote Único)
  // Somente receitas e despesas registradas no banco de dados
  const freeWallet = useMemo(() => {
    // Entradas na Carteira Livre cadastradas no mês
    const totalIncomeNet = filteredIncomes
      .filter((inc) => inc.walletType === "FREE")
      .reduce((sum, inc) => sum + parseNumber(inc.amountNet), 0);

    // Saídas já pagas da Carteira Livre (Débito/Pix)
    const paidExpenses = filteredExpenses.filter(
      (exp) => exp.isPaid && exp.paymentMethod === "DEBIT_PIX"
    );
    const totalSpentPaid = paidExpenses.reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    // Saldo atual em conta
    const currentBalance = totalIncomeNet - totalSpentPaid;

    // Despesas projetadas da carteira livre (débito/pix + cartão + parcelamentos ativos)
    const allFreeExpenses = filteredExpenses.filter(
      (exp) => exp.paymentMethod === "DEBIT_PIX" || exp.paymentMethod === "CREDIT_CARD"
    );
    const manualExpensesTotal = allFreeExpenses.reduce(
      (sum, exp) => sum + parseNumber(exp.amount),
      0
    );

    // Inclui parcelas ativas de cartão de crédito registradas
    const projectedExpenses = manualExpensesTotal + parseNumber(creditCard.monthlyInstallmentsAmount);

    // Sobra projetada do mês para o Pote Único (o que pode ir para o Avalanche!)
    const projectedSurplus = Math.max(0, totalIncomeNet - projectedExpenses);

    return {
      totalIncomeNet,
      totalSpentPaid,
      currentBalance,
      projectedExpenses,
      projectedSurplus,
    };
  }, [filteredIncomes, filteredExpenses, creditCard.monthlyInstallmentsAmount]);

  // CÁLCULOS: 6. Despesas por Tipo e Rastreabilidade
  const expenseStats = useMemo(() => {
    const totalFixed = filteredExpenses
      .filter((exp) => exp.expenseType === "FIXED")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    const totalLoans = filteredExpenses
      .filter((exp) => exp.expenseType === "LOAN")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    const totalVariable = filteredExpenses
      .filter((exp) => exp.expenseType === "VARIABLE")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    const totalGeneral = totalFixed + totalLoans + totalVariable;

    const user1Id = users[0]?.id;
    const user2Id = users[1]?.id;

    const lucasSpent = filteredExpenses
      .filter((exp) => exp.userId === user1Id || exp.userId === "user-lucas")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    const marianaSpent = filteredExpenses
      .filter((exp) => exp.userId === user2Id || exp.userId === "user-mariana")
      .reduce((sum, exp) => sum + parseNumber(exp.amount), 0);

    const lucasSpentPercent = totalGeneral > 0 ? (lucasSpent / totalGeneral) * 100 : 0;
    const marianaSpentPercent = totalGeneral > 0 ? (marianaSpent / totalGeneral) * 100 : 0;

    return {
      totalFixed,
      totalLoans,
      totalFixedAndLoans: totalFixed + totalLoans,
      totalVariable,
      totalGeneral,
      lucasSpent,
      marianaSpent,
      lucasSpentPercent: Math.round(lucasSpentPercent * 10) / 10,
      marianaSpentPercent: Math.round(marianaSpentPercent * 10) / 10,
    };
  }, [filteredExpenses, users]);

  // CÁLCULOS: 6. Motor Método Avalanche (Ordenação pela maior taxa de juros)
  const avalanche = useMemo(() => {
    const sortedLoans = sortLoansByAvalanche(loans);
    const activeLoans = sortedLoans.filter((l) => l.status === "ACTIVE");
    const targetLoan = activeLoans.length > 0 ? activeLoans[0] : null;

    const totalDebtBalance = activeLoans.reduce((sum, l) => sum + l.currentBalance, 0);
    const totalMonthlyInstallments = activeLoans.reduce(
      (sum, l) => sum + (l.installmentAmount ?? l.currentInstallmentAmount ?? 0),
      0
    );

    const suggestedAmortizationAmount = freeWallet.projectedSurplus;

    const targetRate = targetLoan ? (targetLoan.interestRate ?? targetLoan.monthlyInterestRate ?? 0) : 0;
    const estimatedSavingsOnTarget = targetLoan
      ? estimateInterestSavings(
          suggestedAmortizationAmount > 0 ? suggestedAmortizationAmount : 1000,
          targetRate,
          targetLoan.totalInstallments - targetLoan.paidInstallments
        )
      : 0;

    return {
      sortedLoans,
      targetLoan,
      totalDebtBalance,
      totalMonthlyInstallments,
      suggestedAmortizationAmount,
      estimatedSavingsOnTarget,
    };
  }, [loans, freeWallet.projectedSurplus]);

  // CÁLCULOS: 7. Reserva de Emergência
  const emergencyFundMetrics = useMemo(() => {
    // Custo de vida mensal = Gastos Fixos + Parcelas + Gastos Variáveis Essenciais
    const monthlyLivingCost =
      expenseStats.totalFixedAndLoans + Math.max(1500, expenseStats.totalVariable * 0.85);

    const targetMonths = emergencyFund.targetMonths || 6;
    const targetAmount = monthlyLivingCost * targetMonths;
    const currentAmount = emergencyFund.currentAmount;
    const progressPercent =
      targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;

    return {
      currentAmount,
      monthlyLivingCost: Math.round(monthlyLivingCost),
      targets: {
        threeMonths: Math.round(monthlyLivingCost * 3),
        sixMonths: Math.round(monthlyLivingCost * 6),
        twelveMonths: Math.round(monthlyLivingCost * 12),
      },
      progressPercent: Math.round(progressPercent * 10) / 10,
    };
  }, [expenseStats, emergencyFund]);

  // AÇÕES: Despesas (Optimistic UI com Rollback)
  const addExpense = useCallback(
    (expenseData: Omit<Expense, "id" | "userId"> & { userId?: string }) => {
      const tempId = "temp-" + Date.now();
      const newExpense: Expense = {
        ...expenseData,
        id: tempId,
        userId: expenseData.userId || currentUser.id,
      };

      // 1. Snapshot do estado anterior
      const prevExpenses = expenses;
      const prevCards = creditCards;
      const prevBenefits = benefitCards;

      // 2. Atualização local IMEDIATA (Optimistic UI - 0ms de percepção de atraso)
      setExpenses((prev) => [newExpense, ...prev]);

      if (newExpense.paymentMethod === "CREDIT_CARD" && newExpense.creditCardId) {
        setCreditCards((prevCardsState) =>
          prevCardsState.map((c) => {
            if (c.id === newExpense.creditCardId) {
              return {
                ...c,
                availableLimit: Math.max(0, Number((c.availableLimit - newExpense.amount).toFixed(2))),
              };
            }
            return c;
          })
        );
      }

      if (
        (newExpense.paymentMethod === "VR" || newExpense.paymentMethod === "VA") &&
        newExpense.benefitCardId
      ) {
        setBenefitCards((prevBenefitsState) =>
          prevBenefitsState.map((b) => {
            if (b.id === newExpense.benefitCardId) {
              return {
                ...b,
                currentBalance: Math.max(0, Number((b.currentBalance - newExpense.amount).toFixed(2))),
              };
            }
            return b;
          })
        );
      }

      // 3. Sincronização em background com a API e rollback em caso de falha
      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "expense",
              data: {
                description: newExpense.description,
                amount: newExpense.amount,
                date: newExpense.date,
                category: newExpense.category,
                expenseType: newExpense.expenseType,
                paymentMethod: newExpense.paymentMethod,
                isPaid: newExpense.isPaid,
                dueDate: newExpense.dueDate,
                creditCardInvoiceMonth: newExpense.creditCardInvoiceMonth,
                creditCardId: newExpense.creditCardId,
                loanId: newExpense.loanId,
              },
            }),
          }),
        () => {
          setExpenses(prevExpenses);
          setCreditCards(prevCards);
          setBenefitCards(prevBenefits);
        },
        (savedData) => {
          if (savedData?.id) {
            setExpenses((prev) =>
              prev.map((e) => (e.id === tempId ? { ...e, id: savedData.id } : e))
            );
          }
        }
      );
    },
    [currentUser.id, expenses, creditCards, benefitCards, syncWithBackend]
  );

  const updateExpense = useCallback(
    (id: string, updatedData: Partial<Expense>) => {
      const existing = expenses.find((e) => e.id === id);
      if (!existing) return;

      const merged: Expense = { ...existing, ...updatedData };
      const prevExpenses = expenses;
      const prevCards = creditCards;

      const oldCardId = existing.paymentMethod === "CREDIT_CARD" ? existing.creditCardId : undefined;
      const newCardId = merged.paymentMethod === "CREDIT_CARD" ? merged.creditCardId : undefined;

      if (oldCardId !== newCardId || existing.amount !== merged.amount) {
        setCreditCards((prevCardsState) =>
          prevCardsState.map((c) => {
            let limit = c.availableLimit;
            if (oldCardId && c.id === oldCardId) limit += existing.amount;
            if (newCardId && c.id === newCardId) limit -= merged.amount;
            return {
              ...c,
              availableLimit: Math.min(c.totalLimit, Math.max(0, Number(limit.toFixed(2)))),
            };
          })
        );
      }

      setExpenses((prev) => prev.map((e) => (e.id === id ? merged : e)));

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity: "expense", id, data: updatedData }),
          }),
        () => {
          setExpenses(prevExpenses);
          setCreditCards(prevCards);
        }
      );
    },
    [expenses, creditCards, syncWithBackend]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const expenseToDelete = expenses.find((e) => e.id === id);
      if (!expenseToDelete) return;

      const prevExpenses = expenses;
      const prevCards = creditCards;
      const prevBenefits = benefitCards;

      if (expenseToDelete.paymentMethod === "CREDIT_CARD" && expenseToDelete.creditCardId) {
        setCreditCards((prevCardsState) =>
          prevCardsState.map((c) => {
            if (c.id === expenseToDelete.creditCardId) {
              return {
                ...c,
                availableLimit: Math.min(
                  c.totalLimit,
                  Number((c.availableLimit + expenseToDelete.amount).toFixed(2))
                ),
              };
            }
            return c;
          })
        );
      }

      if (
        (expenseToDelete.paymentMethod === "VR" || expenseToDelete.paymentMethod === "VA") &&
        expenseToDelete.benefitCardId
      ) {
        setBenefitCards((prevBenefitsState) =>
          prevBenefitsState.map((b) => {
            if (b.id === expenseToDelete.benefitCardId) {
              return {
                ...b,
                currentBalance: Number((b.currentBalance + expenseToDelete.amount).toFixed(2)),
              };
            }
            return b;
          })
        );
      }

      setExpenses((prev) => prev.filter((e) => e.id !== id));

      syncWithBackend(
        () => fetch(`/api/finances?entity=expense&id=${id}`, { method: "DELETE" }),
        () => {
          setExpenses(prevExpenses);
          setCreditCards(prevCards);
          setBenefitCards(prevBenefits);
        }
      );
    },
    [expenses, creditCards, benefitCards, syncWithBackend]
  );

  const toggleFixedExpensePaid = useCallback(
    (id: string) => {
      const target = expenses.find((e) => e.id === id);
      if (!target) return;

      const prevExpenses = expenses;
      const nextPaid = !target.isPaid;

      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isPaid: nextPaid } : e))
      );

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity: "expense", id, data: { isPaid: nextPaid } }),
          }),
        () => setExpenses(prevExpenses)
      );
    },
    [expenses, syncWithBackend]
  );

  // AÇÕES: Receitas (Optimistic UI com Rollback)
  const addIncome = useCallback(
    (incomeData: Omit<Income, "id" | "userId"> & { userId?: string }) => {
      const tempId = "temp-" + Date.now();
      const newIncome: Income = {
        ...incomeData,
        id: tempId,
        userId: incomeData.userId || currentUser.id,
      };

      const prevIncomes = incomes;
      setIncomes((prev) => [newIncome, ...prev]);

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "income",
              data: {
                description: newIncome.description,
                amountGross: newIncome.amountGross,
                amountNet: newIncome.amountNet,
                category: newIncome.category,
                walletType: newIncome.walletType,
                benefitType: newIncome.benefitType,
                receivedAt: newIncome.receivedAt,
              },
            }),
          }),
        () => setIncomes(prevIncomes),
        (savedData) => {
          if (savedData?.id) {
            setIncomes((prev) =>
              prev.map((i) => (i.id === tempId ? { ...i, id: savedData.id } : i))
            );
          }
        }
      );
    },
    [currentUser.id, incomes, syncWithBackend]
  );

  const deleteIncome = useCallback(
    (id: string) => {
      const prevIncomes = incomes;
      setIncomes((prev) => prev.filter((i) => i.id !== id));

      syncWithBackend(
        () => fetch(`/api/finances?entity=income&id=${id}`, { method: "DELETE" }),
        () => setIncomes(prevIncomes)
      );
    },
    [incomes, syncWithBackend]
  );

  // AÇÕES: Amortização de Empréstimos (Método Avalanche com Optimistic UI)
  const amortizeLoan = useCallback(
    (
      loanId: string,
      params: {
        amountPaid: number;
        interestDiscount: number;
        abatementType: AbatementType;
        installmentsReduced?: number;
        newInstallmentAmount?: number;
        notes?: string;
      }
    ) => {
      const loan = loans.find((l) => l.id === loanId);
      if (!loan) return;

      const prevLoans = loans;
      const prevAmort = amortizations;
      const prevExpenses = expenses;

      const totalAbated = params.amountPaid + params.interestDiscount;
      const newBalance = Math.max(0, loan.currentBalance - totalAbated);
      const isPaidOff = newBalance <= 0;

      let updatedTotalInstallments = loan.totalInstallments;
      const currentInst = loan.installmentAmount ?? loan.currentInstallmentAmount ?? 1;
      let updatedInstallmentAmount = currentInst;

      if (params.abatementType === "REDUCE_TERM") {
        const reduced =
          params.installmentsReduced || Math.ceil(totalAbated / Math.max(1, currentInst));
        updatedTotalInstallments = Math.max(loan.paidInstallments, loan.totalInstallments - reduced);
      } else if (params.abatementType === "REDUCE_INSTALLMENT" && params.newInstallmentAmount) {
        updatedInstallmentAmount = params.newInstallmentAmount;
      }

      // Atualizar Empréstimo imediatamente
      setLoans((prev) =>
        prev.map((l) =>
          l.id === loanId
            ? {
                ...l,
                currentBalance: newBalance,
                totalInstallments: updatedTotalInstallments,
                currentInstallmentAmount: updatedInstallmentAmount,
                status: isPaidOff ? "PAID_OFF" : "ACTIVE",
              }
            : l
        )
      );

      const tempAmortId = "temp-" + Date.now();
      const newAmortization: LoanAmortization = {
        id: tempAmortId,
        loanId,
        amountPaid: params.amountPaid,
        interestDiscount: params.interestDiscount,
        totalAbated,
        abatementType: params.abatementType,
        installmentsReduced: params.installmentsReduced || 0,
        previousInstallmentAmount: loan.currentInstallmentAmount,
        newInstallmentAmount: params.newInstallmentAmount,
        date: new Date().toISOString(),
        userId: currentUser.id,
        notes: params.notes,
      };
      setAmortizations((prev) => [newAmortization, ...prev]);

      // Criar movimentação de saída na Carteira Livre
      addExpense({
        description: `Amortização ${loan.name} (Desc. Juros: R$ ${params.interestDiscount.toFixed(2)})`,
        amount: params.amountPaid,
        date: new Date().toISOString(),
        category: "LOAN_INSTALLMENT",
        expenseType: "LOAN",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        loanId,
        userId: currentUser.id,
      });

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "amortization",
              data: {
                loanId,
                amountPaid: params.amountPaid,
                interestDiscount: params.interestDiscount,
                totalAbated,
                abatementType: params.abatementType,
                installmentsReduced: params.installmentsReduced || 0,
                newInstallmentAmount: params.newInstallmentAmount,
                notes: params.notes,
              },
            }),
          }),
        () => {
          setLoans(prevLoans);
          setAmortizations(prevAmort);
          setExpenses(prevExpenses);
        },
        (savedData) => {
          if (savedData?.id) {
            setAmortizations((prev) =>
              prev.map((a) => (a.id === tempAmortId ? { ...a, id: savedData.id } : a))
            );
          }
        }
      );
    },
    [loans, amortizations, expenses, currentUser.id, addExpense, syncWithBackend]
  );

  // GESTÃO DE EMPRÉSTIMOS DO CASAL
  const addLoan = useCallback(
    (loanData: Omit<Loan, "id" | "totalSaved" | "currentBalance"> & { id?: string; totalSaved?: number; currentBalance?: number }) => {
      const tempId = loanData.id || "temp-loan-" + Date.now();
      const newLoan = normalizeLoan({
        ...loanData,
        id: tempId,
      });

      const prevLoans = loans;
      setLoans((prev) => [newLoan, ...prev]);

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "loan",
              data: {
                title: newLoan.title,
                institution: newLoan.institution,
                profileId: newLoan.profileId || undefined,
                principalAmount: newLoan.principalAmount,
                installmentAmount: newLoan.installmentAmount,
                interestRate: newLoan.interestRate,
                totalInstallments: newLoan.totalInstallments,
                paidInstallments: newLoan.paidInstallments,
                dueDay: newLoan.dueDay,
                startDate: newLoan.startDate,
                status: newLoan.status,
                notes: newLoan.notes,
              },
            }),
          }),
        () => setLoans(prevLoans),
        (savedData) => {
          if (savedData?.id) {
            setLoans((prev) =>
              prev.map((l) => (l.id === tempId ? normalizeLoan({ ...l, ...savedData, payments: l.payments }) : l))
            );
          }
        }
      );
    },
    [loans, syncWithBackend]
  );

  const updateLoan = useCallback(
    (id: string, updatedData: Partial<Loan>) => {
      const existing = loans.find((l) => l.id === id);
      if (!existing) return;

      const merged = normalizeLoan({ ...existing, ...updatedData });
      const prevLoans = loans;
      setLoans((prev) => prev.map((l) => (l.id === id ? merged : l)));

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "loan",
              id,
              data: {
                title: merged.title,
                institution: merged.institution,
                profileId: merged.profileId || undefined,
                principalAmount: merged.principalAmount,
                installmentAmount: merged.installmentAmount,
                interestRate: merged.interestRate,
                totalInstallments: merged.totalInstallments,
                paidInstallments: merged.paidInstallments,
                dueDay: merged.dueDay,
                startDate: merged.startDate,
                status: merged.status,
                notes: merged.notes,
              },
            }),
          }),
        () => setLoans(prevLoans),
        (savedData) => {
          if (savedData) {
            setLoans((prev) =>
              prev.map((l) => (l.id === id ? normalizeLoan({ ...l, ...savedData, payments: l.payments }) : l))
            );
          }
        }
      );
    },
    [loans, syncWithBackend]
  );

  const deleteLoan = useCallback(
    (id: string) => {
      const prevLoans = loans;
      setLoans((prev) => prev.filter((l) => l.id !== id));

      syncWithBackend(
        () => fetch(`/api/finances?entity=loan&id=${id}`, { method: "DELETE" }),
        () => setLoans(prevLoans)
      );
    },
    [loans, syncWithBackend]
  );

  const payRegularLoanInstallment = useCallback(
    (loanId: string, createTransaction = true) => {
      const loan = loans.find((l) => l.id === loanId);
      if (!loan) return;

      const prevLoans = loans;
      const prevExpenses = expenses;

      const newPaid = Math.min(loan.totalInstallments, loan.paidInstallments + 1);
      const remaining = Math.max(0, loan.totalInstallments - newPaid);
      const newBalance = Math.max(0, remaining * loan.installmentAmount);
      const isPaidOff = newPaid >= loan.totalInstallments || newBalance <= 0;

      const tempPaymentId = "temp-pay-" + Date.now();
      const paymentRecord: LoanPayment = {
        id: tempPaymentId,
        loanId,
        date: new Date().toISOString(),
        type: "REGULAR",
        strategy: "TERM_REDUCTION",
        installmentsAbated: 1,
        originalValue: loan.installmentAmount,
        paidValue: loan.installmentAmount,
        savedAmount: 0,
        notes: `Pagamento regular da parcela ${newPaid}/${loan.totalInstallments}`,
        userId: loan.profileId || currentUser.id,
      };

      setLoans((prev) =>
        prev.map((l) =>
          l.id === loanId
            ? {
                ...l,
                paidInstallments: newPaid,
                currentBalance: newBalance,
                status: isPaidOff ? "PAID_OFF" : "ACTIVE",
                payments: [paymentRecord, ...(l.payments || [])],
              }
            : l
        )
      );

      if (createTransaction) {
        addExpense({
          description: `Parcela ${loan.title} (${newPaid}/${loan.totalInstallments})`,
          amount: loan.installmentAmount,
          date: new Date().toISOString(),
          category: "LOAN_INSTALLMENT",
          expenseType: "LOAN",
          paymentMethod: "DEBIT_PIX",
          isPaid: true,
          loanId,
          userId: loan.profileId || currentUser.id,
        });
      }

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "payRegularLoanInstallment",
              data: { loanId, createTransaction },
            }),
          }),
        () => {
          setLoans(prevLoans);
          setExpenses(prevExpenses);
        },
        (savedData) => {
          if (savedData?.loan) {
            setLoans((prev) =>
              prev.map((l) => (l.id === loanId ? normalizeLoan(savedData.loan) : l))
            );
          }
        }
      );
    },
    [loans, expenses, currentUser.id, addExpense, syncWithBackend]
  );

  const amortizeLoanEarly = useCallback(
    (payload: {
      loanId: string;
      installmentsAbated: number;
      originalValue: number;
      paidValue: number;
      strategy: LoanStrategy;
      newInstallmentAmount?: number;
      registerTransaction?: boolean;
      notes?: string;
    }) => {
      const loan = loans.find((l) => l.id === payload.loanId);
      if (!loan) return;

      const prevLoans = loans;
      const prevExpenses = expenses;

      const savedAmount = Math.max(0, payload.originalValue - payload.paidValue);
      let updatedPaid = loan.paidInstallments;
      let updatedInstallment = loan.installmentAmount;
      let updatedBalance = loan.currentBalance;

      if (payload.strategy === "TERM_REDUCTION") {
        updatedPaid = Math.min(loan.totalInstallments, loan.paidInstallments + payload.installmentsAbated);
        const remaining = Math.max(0, loan.totalInstallments - updatedPaid);
        updatedBalance = Math.max(0, remaining * updatedInstallment);
      } else {
        // Redução de parcela
        const remaining = Math.max(1, loan.totalInstallments - loan.paidInstallments);
        updatedInstallment = payload.newInstallmentAmount ?? Math.max(1, (loan.currentBalance - payload.paidValue) / remaining);
        updatedBalance = Math.max(0, loan.currentBalance - payload.paidValue);
      }

      const isPaidOff = updatedPaid >= loan.totalInstallments || updatedBalance <= 0;
      const updatedTotalSaved = (loan.totalSaved || 0) + savedAmount;

      const tempPaymentId = "temp-amort-" + Date.now();
      const paymentRecord: LoanPayment = {
        id: tempPaymentId,
        loanId: payload.loanId,
        date: new Date().toISOString(),
        type: "EARLY_AMORTIZATION",
        strategy: payload.strategy,
        installmentsAbated: payload.installmentsAbated,
        originalValue: payload.originalValue,
        paidValue: payload.paidValue,
        savedAmount,
        notes: payload.notes || `Antecipação com economia de R$ ${savedAmount.toFixed(2)}`,
        userId: loan.profileId || currentUser.id,
      };

      setLoans((prev) =>
        prev.map((l) =>
          l.id === payload.loanId
            ? {
                ...l,
                paidInstallments: updatedPaid,
                installmentAmount: updatedInstallment,
                currentInstallmentAmount: updatedInstallment,
                currentBalance: updatedBalance,
                totalSaved: updatedTotalSaved,
                status: isPaidOff ? "PAID_OFF" : "ACTIVE",
                payments: [paymentRecord, ...(l.payments || [])],
              }
            : l
        )
      );

      if (payload.registerTransaction !== false) {
        addExpense({
          description: `Quitação Antecipada ${loan.title} (${payload.installmentsAbated} parc. | Econ. R$ ${savedAmount.toFixed(2)})`,
          amount: payload.paidValue,
          date: new Date().toISOString(),
          category: "LOAN_INSTALLMENT",
          expenseType: "LOAN",
          paymentMethod: "DEBIT_PIX",
          isPaid: true,
          loanId: payload.loanId,
          userId: loan.profileId || currentUser.id,
        });
      }

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "amortizeLoanEarly",
              data: payload,
            }),
          }),
        () => {
          setLoans(prevLoans);
          setExpenses(prevExpenses);
        },
        (savedData) => {
          if (savedData?.loan) {
            setLoans((prev) =>
              prev.map((l) => (l.id === payload.loanId ? normalizeLoan(savedData.loan) : l))
            );
          }
        }
      );
    },
    [loans, expenses, currentUser.id, addExpense, syncWithBackend]
  );

  // Wrapper para compatibilidade com código legado
  const payMonthlyInstallment = useCallback(
    (loanId: string) => {
      payRegularLoanInstallment(loanId, true);
    },
    [payRegularLoanInstallment]
  );

  // Reserva de Emergência: Aporte
  const addEmergencyDeposit = useCallback(
    (amount: number, notes?: string) => {
      if (amount <= 0) return;
      const prevFund = emergencyFund;
      const prevExpenses = expenses;

      setEmergencyFund((prev) => ({
        ...prev,
        currentAmount: prev.currentAmount + amount,
      }));

      addExpense({
        description: `Aporte Reserva de Emergência (${notes || "Poupança"})`,
        amount,
        date: new Date().toISOString(),
        category: "OTHER",
        expenseType: "FIXED",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        userId: currentUser.id,
      });

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "emergencyDeposit",
              data: {
                fundId: emergencyFund.id || "fund-main",
                amount,
                notes,
              },
            }),
          }),
        () => {
          setEmergencyFund(prevFund);
          setExpenses(prevExpenses);
        }
      );
    },
    [emergencyFund, expenses, currentUser.id, addExpense, syncWithBackend]
  );

  const updateEmergencyFund = useCallback(
    async (data: Partial<EmergencyFund>) => {
      const prevFund = emergencyFund;
      setEmergencyFund((prev) => ({
        ...prev,
        ...data,
      }));

      await syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "emergencyFund",
              id: emergencyFund.id || "fund-1",
              data,
            }),
          }),
        () => setEmergencyFund(prevFund)
      );
    },
    [emergencyFund, syncWithBackend]
  );

  const withdrawEmergencyFund = useCallback(
    async (amount: number, notes?: string, createIncomeTransaction = false) => {
      if (amount <= 0) return;
      const prevFund = emergencyFund;
      const newAmount = Math.max(0, emergencyFund.currentAmount - amount);

      setEmergencyFund((prev) => ({
        ...prev,
        currentAmount: newAmount,
      }));

      if (createIncomeTransaction) {
        addIncome({
          description: `Resgate Reserva de Emergência (${notes || "Uso imprevisto"})`,
          amountGross: amount,
          amountNet: amount,
          category: "EXTRA",
          walletType: "FREE",
          receivedAt: new Date().toISOString(),
          userId: currentUser.id,
        });
      }

      await syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "emergencyFund",
              id: emergencyFund.id || "fund-1",
              data: {
                currentAmount: newAmount,
                notes: notes ? `Resgate: R$ ${amount.toFixed(2)} - ${notes}` : prevFund.notes,
              },
            }),
          }),
        () => setEmergencyFund(prevFund)
      );
    },
    [emergencyFund, currentUser.id, addIncome, syncWithBackend]
  );

  // AÇÕES: Cartões de Crédito (Optimistic UI com Rollback)
  const addCreditCard = useCallback(
    (cardData: Omit<CreditCard, "id">) => {
      const tempId = "temp-" + Date.now();
      const newCard: CreditCard = {
        ...cardData,
        id: tempId,
      };
      const prevCards = creditCards;
      setCreditCards((prev) => [...prev, newCard]);

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "creditCard",
              data: {
                name: newCard.name,
                bank: newCard.bank,
                color: newCard.color,
                lastFourDigits: newCard.lastFourDigits,
                totalLimit: newCard.totalLimit,
                availableLimit: newCard.availableLimit,
                closingDay: newCard.closingDay,
                dueDay: newCard.dueDay,
              },
            }),
          }),
        () => setCreditCards(prevCards),
        (savedData) => {
          if (savedData?.id) {
            setCreditCards((prev) =>
              prev.map((c) => (c.id === tempId ? { ...c, id: savedData.id } : c))
            );
          }
        }
      );
    },
    [creditCards, syncWithBackend]
  );

  const updateCreditCard = useCallback(
    (id: string, cardData: Partial<CreditCard>) => {
      const prevCards = creditCards;
      setCreditCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...cardData } : c))
      );

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity: "creditCard", id, data: cardData }),
          }),
        () => setCreditCards(prevCards)
      );
    },
    [creditCards, syncWithBackend]
  );

  const deleteCreditCard = useCallback(
    (id: string) => {
      const prevCards = creditCards;
      const prevInst = installments;

      setCreditCards((prev) => prev.filter((c) => c.id !== id));
      setInstallments((prev) => prev.filter((i) => i.cardId !== id));

      syncWithBackend(
        () => fetch(`/api/finances?entity=creditCard&id=${id}`, { method: "DELETE" }),
        () => {
          setCreditCards(prevCards);
          setInstallments(prevInst);
        }
      );
    },
    [creditCards, installments, syncWithBackend]
  );

  // AÇÕES: Parcelamentos (Optimistic UI com Rollback)
  const addInstallment = useCallback(
    (instData: Omit<CreditCardInstallment, "id">) => {
      const tempId = "temp-" + Date.now();
      const newInst: CreditCardInstallment = {
        ...instData,
        id: tempId,
      };
      const prevInst = installments;
      const prevCards = creditCards;

      setInstallments((prev) => [...prev, newInst]);

      // Abater do limite liberado do cartão se aplicável
      setCreditCards((prev) =>
        prev.map((c) => {
          if (c.id === instData.cardId) {
            return {
              ...c,
              availableLimit: Math.max(0, c.availableLimit - instData.installmentAmount),
            };
          }
          return c;
        })
      );

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "installment",
              data: {
                cardId: instData.cardId,
                description: instData.description,
                totalAmount: instData.totalAmount,
                installmentAmount: instData.installmentAmount,
                totalInstallments: instData.totalInstallments,
                currentInstallment: instData.currentInstallment,
                category: instData.category,
                purchaseDate: instData.purchaseDate,
              },
            }),
          }),
        () => {
          setInstallments(prevInst);
          setCreditCards(prevCards);
        },
        (savedData) => {
          if (savedData?.id) {
            setInstallments((prev) =>
              prev.map((i) => (i.id === tempId ? { ...i, id: savedData.id } : i))
            );
          }
        }
      );
    },
    [installments, creditCards, syncWithBackend]
  );

  const deleteInstallment = useCallback(
    (id: string) => {
      const prevInst = installments;
      setInstallments((prev) => prev.filter((i) => i.id !== id));

      syncWithBackend(
        () => fetch(`/api/finances?entity=installment&id=${id}`, { method: "DELETE" }),
        () => setInstallments(prevInst)
      );
    },
    [installments, syncWithBackend]
  );

  // AÇÕES: Cartões de Benefício (VR/VA - Optimistic UI com Rollback)
  const addBenefitCard = useCallback(
    (cardData: Omit<BenefitCard, "id">) => {
      const tempId = "temp-" + Date.now();
      const newCard: BenefitCard = {
        ...cardData,
        id: tempId,
      };
      const prevBenefits = benefitCards;
      setBenefitCards((prev) => [...prev, newCard]);

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "benefitCard",
              data: {
                name: cardData.name,
                type: cardData.type,
                currentBalance: cardData.currentBalance,
                monthlyDeposit: cardData.monthlyDeposit,
                depositDay: cardData.depositDay,
                color: cardData.color,
                lastFourDigits: cardData.lastFourDigits,
              },
            }),
          }),
        () => setBenefitCards(prevBenefits),
        (savedData) => {
          if (savedData?.id) {
            setBenefitCards((prev) =>
              prev.map((b) => (b.id === tempId ? { ...b, id: savedData.id } : b))
            );
          }
        }
      );
    },
    [benefitCards, syncWithBackend]
  );

  const updateBenefitCard = useCallback(
    (id: string, cardData: Partial<BenefitCard>) => {
      const prevBenefits = benefitCards;
      setBenefitCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...cardData } : c))
      );

      syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity: "benefitCard", id, data: cardData }),
          }),
        () => setBenefitCards(prevBenefits)
      );
    },
    [benefitCards, syncWithBackend]
  );

  const updateBenefitCardBalance = useCallback(
    (id: string, newBalance: number) => {
      updateBenefitCard(id, { currentBalance: newBalance });
    },
    [updateBenefitCard]
  );

  const deleteBenefitCard = useCallback(
    (id: string) => {
      const prevBenefits = benefitCards;
      setBenefitCards((prev) => prev.filter((c) => c.id !== id));

      syncWithBackend(
        () => fetch(`/api/finances?entity=benefitCard&id=${id}`, { method: "DELETE" }),
        () => setBenefitCards(prevBenefits)
      );
    },
    [benefitCards, syncWithBackend]
  );

  // Atualização do Perfil do Integrante (Nome, Foto, Salários, Benefícios)
  const updateUserProfile = useCallback(
    async (userId: string, updatedFields: Partial<User>) => {
      const prevUsers = [...users];
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u))
      );

      await syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              entity: "user",
              id: userId,
              data: updatedFields,
            }),
          }),
        () => {
          setUsers(prevUsers);
        }
      );
    },
    [users, syncWithBackend]
  );

  // Atualização das Configurações Gerais do Casal
  const updateCoupleSettings = useCallback(
    async (updatedFields: Partial<CoupleSettings>) => {
      const prevSettings = { ...coupleSettings };
      setCoupleSettings((prev) => ({ ...prev, ...updatedFields }));

      await syncWithBackend(
        () =>
          fetch("/api/finances", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              entity: "coupleSettings",
              id: "default",
              data: updatedFields,
            }),
          }),
        () => {
          setCoupleSettings(prevSettings);
        }
      );
    },
    [coupleSettings, syncWithBackend]
  );

  // Limpeza de todos os dados transacionais (começar do zero com dados reais)
  const clearAllTransactionalData = useCallback(async () => {
    setExpenses([]);
    setIncomes([]);
    setLoans([]);
    setAmortizations([]);
    setCreditCards([]);
    setInstallments([]);
    setBenefitCards([]);
    setEmergencyFund({
      id: "fund-1",
      currentAmount: 0,
      targetMonths: 6,
      monthlyLivingCostCalculated: 0,
      notes: "Reserva de emergência pronta para aportes reais do casal.",
    });

    if (typeof window !== "undefined") {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (
            k &&
            (k.startsWith("financas_casal_v1_") || k.startsWith("financas_casal_v2_")) &&
            !k.includes("isAuthenticated") &&
            !k.includes("currentUserId") &&
            !k.includes("users")
          ) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  }, []);

  // Resetar dados para o padrão limpo
  const resetAllData = useCallback(() => {
    clearAllTransactionalData();
  }, [clearAllTransactionalData]);

  // Objeto de contexto memoizado para prevenir re-renderizações desnecessárias
  const contextValue = useMemo(
    () => ({
      currentUser,
      switchUser,
      users,
      coupleSettings,
      isAuthenticated,
      login,
      logout,
      updateUserPin,
      selectedMonth,
      selectedYear,
      setSelectedMonth,
      setSelectedYear,
      incomes: filteredIncomes,
      expenses: filteredExpenses,
      loans,
      amortizations,
      emergencyFund,
      creditCards,
      installments,
      benefitCards,
      addExpense,
      updateExpense,
      deleteExpense,
      toggleFixedExpensePaid,
      addIncome,
      deleteIncome,
      addLoan,
      updateLoan,
      deleteLoan,
      payRegularLoanInstallment,
      amortizeLoanEarly,
      amortizeLoan,
      payMonthlyInstallment,
      addEmergencyDeposit,
      updateEmergencyFund,
      withdrawEmergencyFund,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      addInstallment,
      deleteInstallment,
      addBenefitCard,
      updateBenefitCard,
      updateBenefitCardBalance,
      deleteBenefitCard,
      updateUserProfile,
      updateCoupleSettings,
      clearAllTransactionalData,
      resetAllData,
      refreshFinances: refreshFromBackend,
      isSyncing,
      freeWallet,
      benefitsWallet,
      creditCard,
      incomeStats,
      expenseStats,
      avalanche,
      emergencyFundMetrics,
      cardsMetrics,
    }),
    [
      currentUser,
      switchUser,
      users,
      coupleSettings,
      isAuthenticated,
      login,
      logout,
      updateUserPin,
      selectedMonth,
      selectedYear,
      filteredIncomes,
      filteredExpenses,
      loans,
      amortizations,
      emergencyFund,
      creditCards,
      installments,
      benefitCards,
      addExpense,
      updateExpense,
      deleteExpense,
      toggleFixedExpensePaid,
      addIncome,
      deleteIncome,
      addLoan,
      updateLoan,
      deleteLoan,
      payRegularLoanInstallment,
      amortizeLoanEarly,
      amortizeLoan,
      payMonthlyInstallment,
      addEmergencyDeposit,
      updateEmergencyFund,
      withdrawEmergencyFund,
      addCreditCard,
      updateCreditCard,
      deleteCreditCard,
      addInstallment,
      deleteInstallment,
      addBenefitCard,
      updateBenefitCard,
      updateBenefitCardBalance,
      deleteBenefitCard,
      updateUserProfile,
      updateCoupleSettings,
      clearAllTransactionalData,
      resetAllData,
      refreshFromBackend,
      isSyncing,
      freeWallet,
      benefitsWallet,
      creditCard,
      incomeStats,
      expenseStats,
      avalanche,
      emergencyFundMetrics,
      cardsMetrics,
    ]
  );

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance deve ser utilizado dentro de um FinanceProvider");
  }
  return context;
};
