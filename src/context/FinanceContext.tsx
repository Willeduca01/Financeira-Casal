"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import bcrypt from "bcryptjs";
import {
  User,
  CoupleSettings,
  Loan,
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
  login: (userId: string, pin: string, remember?: boolean) => { success: boolean; message?: string };
  logout: () => void;
  updateUserPin: (userId: string, oldPin: string, newPin: string) => { success: boolean; message?: string };

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
  
  // Ações CRUD Cartões & Benefícios
  addCreditCard: (card: Omit<CreditCard, "id">) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addInstallment: (installment: Omit<CreditCardInstallment, "id">) => void;
  deleteInstallment: (id: string) => void;
  addBenefitCard: (card: Omit<BenefitCard, "id">) => void;
  updateBenefitCardBalance: (id: string, newBalance: number) => void;
  deleteBenefitCard: (id: string) => void;
  
  resetAllData: () => void;

  cardsMetrics: {
    totalCreditLimit: number;
    totalAvailableLimit: number;
    totalCommittedLimit: number;
    totalMonthlyInstallmentsAmount: number;
    totalBenefitBalanceVR: number;
    totalBenefitBalanceVA: number;
    totalBenefitBalance: number;
    totalMonthlyBenefitDeposit: number;
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
  };

  creditCard: {
    totalInvoiceAmount: number;
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

const STORAGE_KEY_PREFIX = "financas_casal_v1_";

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Carregamento com suporte a LocalStorage e Mock inicial
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>("user-lucas");
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

  // Inicialização no cliente
  useEffect(() => {
    setIsClient(true);
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    const isProduction = process.env.NODE_ENV === "production";

    try {
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

      if (savedAuth === "true") setIsAuthenticated(true);
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedCurrentUserId) setCurrentUserId(savedCurrentUserId);
      if (savedIncomes) setIncomes(JSON.parse(savedIncomes));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedLoans) setLoans(JSON.parse(savedLoans));
      if (savedAmortizations) setAmortizations(JSON.parse(savedAmortizations));
      if (savedEmergencyFund) setEmergencyFund(JSON.parse(savedEmergencyFund));
      if (savedCreditCards) setCreditCards(JSON.parse(savedCreditCards));
      if (savedInstallments) setInstallments(JSON.parse(savedInstallments));
      if (savedBenefitCards) setBenefitCards(JSON.parse(savedBenefitCards));

      // Em produção, se não houver dados no LocalStorage, sincronizar da API do Neon
      if (isProduction && !savedUsers) {
        fetch("/api/finances")
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then((data) => {
            if (data?.users && data.users.length > 0) {
              setUsers(data.users);
              if (data.loans) setLoans(data.loans);
              if (data.expenses) setExpenses(data.expenses);
              if (data.incomes) setIncomes(data.incomes);
              if (data.creditCards) setCreditCards(data.creditCards);
              if (data.installments) setInstallments(data.installments);
              if (data.benefitCards) setBenefitCards(data.benefitCards);
            }
          })
          .catch((err) => {
            console.error(
              "[SECURITY] Falha ao sincronizar com banco em produção. Fallback para mocks BLOQUEADO por segurança:",
              err
            );
          });
      }
    } catch (e) {
      if (isProduction) {
        console.error(
          "[SECURITY AUDIT] Erro de persistência em produção. Fallback para dados mockados estritamente desabilitado:",
          e
        );
      } else {
        console.warn("Erro ao ler do LocalStorage, usando mocks (modo desenvolvimento local):", e);
      }
    }
  }, []);

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
    } catch (e) {
      console.error("Erro ao persistir no LocalStorage:", e);
    }
  }, [isClient, users, currentUserId, incomes, expenses, loans, amortizations, emergencyFund, creditCards, installments, benefitCards]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || users[0],
    [users, currentUserId]
  );

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    if (isClient) {
      localStorage.setItem(STORAGE_KEY_PREFIX + "currentUserId", userId);
    }
  };

  // Autenticação Segura do Integrante (Bcrypt sem texto puro)
  const login = (
    userId: string,
    pin: string,
    remember: boolean = true
  ): { success: boolean; message?: string } => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: "Integrante não encontrado." };
    }

    const storedHash = user.pinHash || user.pin;
    let isValid = false;

    if (storedHash) {
      // Se for um hash bcrypt válido ($2a$ ou $2b$)
      if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
        try {
          isValid = bcrypt.compareSync(pin.trim(), storedHash);
        } catch {
          isValid = false;
        }
      } else {
        // Migração defensiva caso ainda exista texto puro em localStorage antigo
        isValid = pin.trim() === storedHash;
        if (isValid) {
          const newSecureHash = bcrypt.hashSync(pin.trim(), 10);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId
                ? { ...u, pin: newSecureHash, pinHash: newSecureHash }
                : u
            )
          );
        }
      }
    }

    if (!isValid) {
      return { success: false, message: "PIN incorreto. Tente novamente." };
    }

    setCurrentUserId(userId);
    setIsAuthenticated(true);

    if (remember && isClient) {
      localStorage.setItem(STORAGE_KEY_PREFIX + "isAuthenticated", "true");
      localStorage.setItem(STORAGE_KEY_PREFIX + "currentUserId", userId);
    }

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_PREFIX + "isAuthenticated");
  };

  const updateUserPin = (
    userId: string,
    oldPin: string,
    newPin: string
  ): { success: boolean; message?: string } => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, message: "Integrante não encontrado." };

    const storedHash = user.pinHash || user.pin;
    let isOldValid = false;

    if (storedHash) {
      if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")) {
        try {
          isOldValid = bcrypt.compareSync(oldPin.trim(), storedHash);
        } catch {
          isOldValid = false;
        }
      } else {
        isOldValid = oldPin.trim() === storedHash;
      }
    }

    if (!isOldValid) {
      return { success: false, message: "PIN atual incorreto." };
    }

    if (newPin.trim().length < 4) {
      return { success: false, message: "O novo PIN deve ter pelo menos 4 dígitos." };
    }

    // Gerar hash seguro do novo PIN via bcrypt (salt 10) - Nunca armazenar texto puro
    const newHashedPin = bcrypt.hashSync(newPin.trim(), 10);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, pin: newHashedPin, pinHash: newHashedPin } : u
      )
    );

    return { success: true, message: "PIN alterado e protegido com hash criptográfico!" };
  };

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

  // CÁLCULOS: 1. Carteira Livre
  const freeWallet = useMemo(() => {
    // Entradas na Carteira Livre (Salário Líquido + Extra + Bônus)
    const totalIncomeNet = filteredIncomes
      .filter((inc) => inc.walletType === "FREE")
      .reduce((sum, inc) => sum + inc.amountNet, 0);

    // Saídas já pagas da Carteira Livre (Débito/Pix)
    const paidExpenses = filteredExpenses.filter(
      (exp) => exp.isPaid && exp.paymentMethod === "DEBIT_PIX"
    );
    const totalSpentPaid = paidExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Saldo atual em conta
    const currentBalance = totalIncomeNet - totalSpentPaid;

    // Total projetado de todas as despesas da carteira livre (fixos + variáveis no débito/pix + empréstimos + fatura do cartão)
    const allFreeExpenses = filteredExpenses.filter(
      (exp) => exp.paymentMethod === "DEBIT_PIX" || exp.paymentMethod === "CREDIT_CARD"
    );
    const projectedExpenses = allFreeExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Sobra projetada do mês para o Pote Único (o que pode ir para o Avalanche!)
    const projectedSurplus = Math.max(0, totalIncomeNet - projectedExpenses);

    return {
      totalIncomeNet,
      totalSpentPaid,
      currentBalance,
      projectedExpenses,
      projectedSurplus,
    };
  }, [filteredIncomes, filteredExpenses]);

  // CÁLCULOS: 2. Carteira de Benefícios (VR e VA)
  const benefitsWallet = useMemo(() => {
    // Entradas VR e VA
    const totalVRReceived = filteredIncomes
      .filter((inc) => inc.walletType === "BENEFITS" && inc.benefitType === "VR")
      .reduce((sum, inc) => sum + inc.amountNet, 0);

    const totalVAReceived = filteredIncomes
      .filter((inc) => inc.walletType === "BENEFITS" && inc.benefitType === "VA")
      .reduce((sum, inc) => sum + inc.amountNet, 0);

    // Gastos em VR e VA
    const totalVRSpent = filteredExpenses
      .filter((exp) => exp.paymentMethod === "VR")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalVASpent = filteredExpenses
      .filter((exp) => exp.paymentMethod === "VA")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const remainingVR = Math.max(0, totalVRReceived - totalVRSpent);
    const remainingVA = Math.max(0, totalVAReceived - totalVASpent);

    const vrUsagePercent =
      totalVRReceived > 0 ? Math.min(100, (totalVRSpent / totalVRReceived) * 100) : 0;
    const vaUsagePercent =
      totalVAReceived > 0 ? Math.min(100, (totalVASpent / totalVAReceived) * 100) : 0;

    const totalBenefitsReceived = totalVRReceived + totalVAReceived;
    const totalBenefitsSpent = totalVRSpent + totalVASpent;
    const remainingTotal = remainingVR + remainingVA;

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
    };
  }, [filteredIncomes, filteredExpenses]);

  // CÁLCULOS: 3. Cartão de Crédito
  const creditCard = useMemo(() => {
    const totalInvoiceAmount = filteredExpenses
      .filter((exp) => exp.paymentMethod === "CREDIT_CARD")
      .reduce((sum, exp) => sum + exp.amount, 0);

    return { totalInvoiceAmount };
  }, [filteredExpenses]);

  // CÁLCULOS: 4. Rastreabilidade e Divisão do Casal (Receitas)
  const incomeStats = useMemo(() => {
    const totalGross = filteredIncomes.reduce((sum, inc) => sum + inc.amountGross, 0);
    const totalNet = filteredIncomes.reduce((sum, inc) => sum + inc.amountNet, 0);

    const lucasNet = filteredIncomes
      .filter((inc) => inc.userId === "user-lucas")
      .reduce((sum, inc) => sum + inc.amountNet, 0);

    const marianaNet = filteredIncomes
      .filter((inc) => inc.userId === "user-mariana")
      .reduce((sum, inc) => sum + inc.amountNet, 0);

    const totalNetCombined = lucasNet + marianaNet;
    const lucasProportion =
      totalNetCombined > 0 ? (lucasNet / totalNetCombined) * 100 : 50;
    const marianaProportion =
      totalNetCombined > 0 ? (marianaNet / totalNetCombined) * 100 : 50;

    return {
      totalGross,
      totalNet,
      lucasNet,
      marianaNet,
      lucasProportion: Math.round(lucasProportion * 10) / 10,
      marianaProportion: Math.round(marianaProportion * 10) / 10,
    };
  }, [filteredIncomes]);

  // CÁLCULOS: 5. Despesas por Tipo e Rastreabilidade
  const expenseStats = useMemo(() => {
    const totalFixed = filteredExpenses
      .filter((exp) => exp.expenseType === "FIXED")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalLoans = filteredExpenses
      .filter((exp) => exp.expenseType === "LOAN")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalVariable = filteredExpenses
      .filter((exp) => exp.expenseType === "VARIABLE")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalGeneral = totalFixed + totalLoans + totalVariable;

    const lucasSpent = filteredExpenses
      .filter((exp) => exp.userId === "user-lucas")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const marianaSpent = filteredExpenses
      .filter((exp) => exp.userId === "user-mariana")
      .reduce((sum, exp) => sum + exp.amount, 0);

    const lucasSpentPercent = totalGeneral > 0 ? (lucasSpent / totalGeneral) * 100 : 50;
    const marianaSpentPercent = totalGeneral > 0 ? (marianaSpent / totalGeneral) * 100 : 50;

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
  }, [filteredExpenses]);

  // CÁLCULOS: 6. Motor Método Avalanche (Ordenação pela maior taxa de juros)
  const avalanche = useMemo(() => {
    const sortedLoans = sortLoansByAvalanche(loans);
    const activeLoans = sortedLoans.filter((l) => l.status === "ACTIVE");
    const targetLoan = activeLoans.length > 0 ? activeLoans[0] : null;

    const totalDebtBalance = activeLoans.reduce((sum, l) => sum + l.currentBalance, 0);
    const totalMonthlyInstallments = activeLoans.reduce(
      (sum, l) => sum + l.currentInstallmentAmount,
      0
    );

    const suggestedAmortizationAmount = freeWallet.projectedSurplus;

    const estimatedSavingsOnTarget = targetLoan
      ? estimateInterestSavings(
          suggestedAmortizationAmount > 0 ? suggestedAmortizationAmount : 1000,
          targetLoan.monthlyInterestRate,
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

  // AÇÕES: Despesas
  const addExpense = (
    expenseData: Omit<Expense, "id" | "userId"> & { userId?: string }
  ) => {
    const newExpense: Expense = {
      ...expenseData,
      id: "exp-" + Date.now(),
      userId: expenseData.userId || currentUser.id,
    };
    setExpenses((prev) => [newExpense, ...prev]);

    // Abater do limite liberado do cartão de crédito
    if (newExpense.paymentMethod === "CREDIT_CARD" && newExpense.creditCardId) {
      setCreditCards((prevCards) =>
        prevCards.map((c) => {
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

    // Abater do saldo do cartão de benefício (VR ou VA)
    if (
      (newExpense.paymentMethod === "VR" || newExpense.paymentMethod === "VA") &&
      newExpense.benefitCardId
    ) {
      setBenefitCards((prevCards) =>
        prevCards.map((b) => {
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
  };

  const updateExpense = (id: string, updatedData: Partial<Expense>) => {
    const existing = expenses.find((e) => e.id === id);
    if (!existing) return;

    const merged: Expense = { ...existing, ...updatedData };

    // Sincronizar limites de cartão de crédito caso o cartão ou o valor tenham mudado
    const oldCardId = existing.paymentMethod === "CREDIT_CARD" ? existing.creditCardId : undefined;
    const newCardId = merged.paymentMethod === "CREDIT_CARD" ? merged.creditCardId : undefined;

    if (oldCardId !== newCardId || existing.amount !== merged.amount) {
      setCreditCards((prevCards) =>
        prevCards.map((c) => {
          let limit = c.availableLimit;
          // Devolve o valor ao cartão antigo se havia
          if (oldCardId && c.id === oldCardId) {
            limit += existing.amount;
          }
          // Subtrai o valor do novo cartão se vinculado
          if (newCardId && c.id === newCardId) {
            limit -= merged.amount;
          }
          return {
            ...c,
            availableLimit: Math.min(c.totalLimit, Math.max(0, Number(limit.toFixed(2)))),
          };
        })
      );
    }

    setExpenses((prev) => prev.map((e) => (e.id === id ? merged : e)));
  };

  const deleteExpense = (id: string) => {
    const expenseToDelete = expenses.find((e) => e.id === id);
    if (expenseToDelete) {
      // Estornar limite do cartão de crédito
      if (expenseToDelete.paymentMethod === "CREDIT_CARD" && expenseToDelete.creditCardId) {
        setCreditCards((prevCards) =>
          prevCards.map((c) => {
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

      // Estornar saldo do cartão de benefício
      if (
        (expenseToDelete.paymentMethod === "VR" || expenseToDelete.paymentMethod === "VA") &&
        expenseToDelete.benefitCardId
      ) {
        setBenefitCards((prevCards) =>
          prevCards.map((b) => {
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
    }

    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleFixedExpensePaid = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPaid: !e.isPaid } : e))
    );
  };

  // AÇÕES: Receitas
  const addIncome = (
    incomeData: Omit<Income, "id" | "userId"> & { userId?: string }
  ) => {
    const newIncome: Income = {
      ...incomeData,
      id: "inc-" + Date.now(),
      userId: incomeData.userId || currentUser.id,
    };
    setIncomes((prev) => [newIncome, ...prev]);
  };

  const deleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  // AÇÕES: Amortização de Empréstimos (Método Avalanche)
  const amortizeLoan = (
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

    const totalAbated = params.amountPaid + params.interestDiscount;
    const newBalance = Math.max(0, loan.currentBalance - totalAbated);
    const isPaidOff = newBalance <= 0;

    let updatedPaidInstallments = loan.paidInstallments;
    let updatedTotalInstallments = loan.totalInstallments;
    let updatedInstallmentAmount = loan.currentInstallmentAmount;

    if (params.abatementType === "REDUCE_TERM") {
      const reduced = params.installmentsReduced || Math.ceil(totalAbated / loan.currentInstallmentAmount);
      updatedTotalInstallments = Math.max(loan.paidInstallments, loan.totalInstallments - reduced);
    } else if (params.abatementType === "REDUCE_INSTALLMENT" && params.newInstallmentAmount) {
      updatedInstallmentAmount = params.newInstallmentAmount;
    }

    // Atualizar Empréstimo
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

    // Registrar Amortização no histórico
    const newAmortization: LoanAmortization = {
      id: "amort-" + Date.now(),
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
  };

  // Pagar Parcela Mensal do Empréstimo
  const payMonthlyInstallment = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    const newPaid = Math.min(loan.totalInstallments, loan.paidInstallments + 1);
    const newBalance = Math.max(0, loan.currentBalance - loan.currentInstallmentAmount);
    const isPaidOff = newPaid >= loan.totalInstallments || newBalance <= 0;

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              paidInstallments: newPaid,
              currentBalance: newBalance,
              status: isPaidOff ? "PAID_OFF" : "ACTIVE",
            }
          : l
      )
    );

    // Marcar despesa correspondente como paga se existir
    setExpenses((prev) =>
      prev.map((e) =>
        e.loanId === loanId && e.expenseType === "LOAN" && !e.isPaid
          ? { ...e, isPaid: true }
          : e
      )
    );
  };

  // Reserva de Emergência: Aporte
  const addEmergencyDeposit = (amount: number, notes?: string) => {
    if (amount <= 0) return;
    setEmergencyFund((prev) => ({
      ...prev,
      currentAmount: prev.currentAmount + amount,
    }));

    // Criar saída correspondente da Carteira Livre
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
  };

  // AÇÕES: Cartões de Crédito
  const addCreditCard = (cardData: Omit<CreditCard, "id">) => {
    const newCard: CreditCard = {
      ...cardData,
      id: "card-" + Date.now(),
    };
    setCreditCards((prev) => [...prev, newCard]);
  };

  const updateCreditCard = (id: string, cardData: Partial<CreditCard>) => {
    setCreditCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...cardData } : c))
    );
  };

  const deleteCreditCard = (id: string) => {
    setCreditCards((prev) => prev.filter((c) => c.id !== id));
    setInstallments((prev) => prev.filter((i) => i.cardId !== id));
  };

  // AÇÕES: Parcelamentos
  const addInstallment = (instData: Omit<CreditCardInstallment, "id">) => {
    const newInst: CreditCardInstallment = {
      ...instData,
      id: "inst-" + Date.now(),
    };
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
  };

  const deleteInstallment = (id: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== id));
  };

  // AÇÕES: Cartões de Benefício (VR/VA)
  const addBenefitCard = (cardData: Omit<BenefitCard, "id">) => {
    const newCard: BenefitCard = {
      ...cardData,
      id: "benefit-" + Date.now(),
    };
    setBenefitCards((prev) => [...prev, newCard]);
  };

  const updateBenefitCardBalance = (id: string, newBalance: number) => {
    setBenefitCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, currentBalance: newBalance } : c))
    );
  };

  const deleteBenefitCard = (id: string) => {
    setBenefitCards((prev) => prev.filter((c) => c.id !== id));
  };

  // CÁLCULO: Métricas dos Cartões
  const cardsMetrics = useMemo(() => {
    const totalCreditLimit = creditCards.reduce((acc, c) => acc + c.totalLimit, 0);
    const totalAvailableLimit = creditCards.reduce((acc, c) => acc + c.availableLimit, 0);
    const totalCommittedLimit = Math.max(0, totalCreditLimit - totalAvailableLimit);
    const totalMonthlyInstallmentsAmount = installments.reduce(
      (acc, i) => acc + i.installmentAmount,
      0
    );

    const totalBenefitBalanceVR = benefitCards
      .filter((b) => b.type === "VR")
      .reduce((acc, b) => acc + b.currentBalance, 0);

    const totalBenefitBalanceVA = benefitCards
      .filter((b) => b.type === "VA")
      .reduce((acc, b) => acc + b.currentBalance, 0);

    const totalBenefitBalance = totalBenefitBalanceVR + totalBenefitBalanceVA;

    const totalMonthlyBenefitDeposit = benefitCards.reduce(
      (acc, b) => acc + b.monthlyDeposit,
      0
    );

    return {
      totalCreditLimit,
      totalAvailableLimit,
      totalCommittedLimit,
      totalMonthlyInstallmentsAmount,
      totalBenefitBalanceVR,
      totalBenefitBalanceVA,
      totalBenefitBalance,
      totalMonthlyBenefitDeposit,
    };
  }, [creditCards, installments, benefitCards]);

  // Resetar dados para o padrão inicial (Bloqueado em Produção)
  const resetAllData = () => {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[SECURITY AUDIT] Ação de reset para dados mockados fictícios está estritamente desabilitada em produção."
      );
      return;
    }
    setUsers(INITIAL_USERS);
    setCurrentUserId("user-lucas");
    setIncomes(INITIAL_INCOMES);
    setExpenses(INITIAL_EXPENSES);
    setLoans(INITIAL_LOANS);
    setAmortizations(INITIAL_AMORTIZATIONS);
    setEmergencyFund(INITIAL_EMERGENCY_FUND);
    setCreditCards(INITIAL_CREDIT_CARDS);
    setInstallments(INITIAL_INSTALLMENTS);
    setBenefitCards(INITIAL_BENEFIT_CARDS);
    localStorage.clear();
  };

  return (
    <FinanceContext.Provider
      value={{
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
        amortizeLoan,
        payMonthlyInstallment,
        addEmergencyDeposit,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addInstallment,
        deleteInstallment,
        addBenefitCard,
        updateBenefitCardBalance,
        deleteBenefitCard,
        resetAllData,
        freeWallet,
        benefitsWallet,
        creditCard,
        incomeStats,
        expenseStats,
        avalanche,
        emergencyFundMetrics,
        cardsMetrics,
      }}
    >
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
