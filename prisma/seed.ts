import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed no banco de dados...");

  // Limpar tabelas existentes em cascata
  await prisma.loanAmortization.deleteMany({});
  await prisma.emergencyDeposit.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.emergencyFund.deleteMany({});
  await prisma.coupleSettings.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Criar Casal
  const lucas = await prisma.user.create({
    data: {
      name: "Lucas Silva",
      email: "lucas@casal.com",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      role: "PARTNER",
      salaryGross: 7500.0,
      salaryNet: 5850.0,
      vrAmount: 650.0,
      vaAmount: 450.0,
      incomeProportion: 58.2,
    },
  });

  const mariana = await prisma.user.create({
    data: {
      name: "Mariana Costa",
      email: "mariana@casal.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      role: "PARTNER",
      salaryGross: 5200.0,
      salaryNet: 4200.0,
      vrAmount: 500.0,
      vaAmount: 350.0,
      incomeProportion: 41.8,
    },
  });

  // 2. Configurações do Casal
  await prisma.coupleSettings.create({
    data: {
      coupleName: "Lucas & Mariana",
      emergencyFundMonthsTarget: 6,
      user1SalaryProportion: 58.2,
      user2SalaryProportion: 41.8,
    },
  });

  // 3. Cadastrar Empréstimos (Método Avalanche)
  const loanNubank = await prisma.loan.create({
    data: {
      name: "Empréstimo Pessoal Nubank",
      bank: "Nubank",
      originalAmount: 12000.0,
      currentBalance: 8420.0,
      monthlyInterestRate: 4.85, // Maior taxa -> Alvo #1 Avalanche
      totalInstallments: 24,
      paidInstallments: 9,
      currentInstallmentAmount: 785.4,
      dueDay: 10,
      status: "ACTIVE",
      notes: "Contrato firmado em 2025 para reforma da cozinha",
    },
  });

  const loanCaixa = await prisma.loan.create({
    data: {
      name: "Empréstimo Caixa Consignado",
      bank: "Caixa Econômica Federal",
      originalAmount: 25000.0,
      currentBalance: 18600.0,
      monthlyInterestRate: 2.1,
      totalInstallments: 48,
      paidInstallments: 16,
      currentInstallmentAmount: 740.0,
      dueDay: 5,
      status: "ACTIVE",
      notes: "Débito em conta corrente",
    },
  });

  const loanSantander = await prisma.loan.create({
    data: {
      name: "Crédito Pessoal Santander",
      bank: "Santander",
      originalAmount: 6000.0,
      currentBalance: 3200.0,
      monthlyInterestRate: 1.89,
      totalInstallments: 18,
      paidInstallments: 10,
      currentInstallmentAmount: 410.0,
      dueDay: 20,
      status: "ACTIVE",
    },
  });

  // 4. Receitas do Mês Atual
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 5);

  // Entradas Lucas
  await prisma.income.createMany({
    data: [
      {
        description: "Salário Lucas (Empresa Tech)",
        amountGross: 7500.0,
        amountNet: 5850.0,
        category: "SALARY",
        walletType: "FREE",
        receivedAt: currentMonthStart,
        userId: lucas.id,
      },
      {
        description: "Vale Refeição (Sodexo VR)",
        amountGross: 650.0,
        amountNet: 650.0,
        category: "VR",
        walletType: "BENEFITS",
        benefitType: "VR",
        receivedAt: currentMonthStart,
        userId: lucas.id,
      },
      {
        description: "Vale Alimentação (Sodexo VA)",
        amountGross: 450.0,
        amountNet: 450.0,
        category: "VA",
        walletType: "BENEFITS",
        benefitType: "VA",
        receivedAt: currentMonthStart,
        userId: lucas.id,
      },
    ],
  });

  // Entradas Mariana
  await prisma.income.createMany({
    data: [
      {
        description: "Salário Mariana (Hospital)",
        amountGross: 5200.0,
        amountNet: 4200.0,
        category: "SALARY",
        walletType: "FREE",
        receivedAt: currentMonthStart,
        userId: mariana.id,
      },
      {
        description: "Vale Refeição (Alelo VR)",
        amountGross: 500.0,
        amountNet: 500.0,
        category: "VR",
        walletType: "BENEFITS",
        benefitType: "VR",
        receivedAt: currentMonthStart,
        userId: mariana.id,
      },
      {
        description: "Vale Alimentação (Alelo VA)",
        amountGross: 350.0,
        amountNet: 350.0,
        category: "VA",
        walletType: "BENEFITS",
        benefitType: "VA",
        receivedAt: currentMonthStart,
        userId: mariana.id,
      },
      {
        description: "Renda Extra Plantão / Consultoria",
        amountGross: 600.0,
        amountNet: 600.0,
        category: "EXTRA",
        walletType: "FREE",
        receivedAt: new Date(now.getFullYear(), now.getMonth(), 12),
        userId: mariana.id,
      },
    ],
  });

  // 5. Gastos Fixos e Parcelas
  await prisma.expense.createMany({
    data: [
      {
        description: "Aluguel Apartamento + Condomínio",
        amount: 2400.0,
        date: new Date(now.getFullYear(), now.getMonth(), 10),
        category: "HOUSING",
        expenseType: "FIXED",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        userId: lucas.id,
      },
      {
        description: "Energia Elétrica (Enel)",
        amount: 240.0,
        date: new Date(now.getFullYear(), now.getMonth(), 15),
        category: "UTILITIES",
        expenseType: "FIXED",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        userId: mariana.id,
      },
      {
        description: "Internet Fibra Óptica 500MB",
        amount: 129.9,
        date: new Date(now.getFullYear(), now.getMonth(), 18),
        category: "UTILITIES",
        expenseType: "FIXED",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        userId: lucas.id,
      },
      {
        description: "Conta de Água (Sabesp)",
        amount: 85.0,
        date: new Date(now.getFullYear(), now.getMonth(), 22),
        category: "UTILITIES",
        expenseType: "FIXED",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        userId: mariana.id,
      },
      {
        description: "Parcela Empréstimo Nubank (09/24)",
        amount: 785.4,
        date: new Date(now.getFullYear(), now.getMonth(), 10),
        category: "LOAN_INSTALLMENT",
        expenseType: "LOAN",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        loanId: loanNubank.id,
        userId: lucas.id,
      },
      {
        description: "Parcela Empréstimo Caixa (16/48)",
        amount: 740.0,
        date: new Date(now.getFullYear(), now.getMonth(), 5),
        category: "LOAN_INSTALLMENT",
        expenseType: "LOAN",
        paymentMethod: "DEBIT_PIX",
        isPaid: false, // Pendente no mês
        loanId: loanCaixa.id,
        userId: mariana.id,
      },
      {
        description: "Parcela Empréstimo Santander (10/18)",
        amount: 410.0,
        date: new Date(now.getFullYear(), now.getMonth(), 20),
        category: "LOAN_INSTALLMENT",
        expenseType: "LOAN",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        loanId: loanSantander.id,
        userId: lucas.id,
      },
      {
        description: "Assinaturas Streaming (Netflix & Spotify)",
        amount: 89.9,
        date: new Date(now.getFullYear(), now.getMonth(), 14),
        category: "SUBSCRIPTION",
        expenseType: "FIXED",
        paymentMethod: "CREDIT_CARD",
        isPaid: true,
        userId: mariana.id,
      },
    ],
  });

  // 6. Gastos Variáveis (Alimentação, Mercado, Mistura, Doces, Lazer)
  await prisma.expense.createMany({
    data: [
      {
        description: "Mercado do Mês (Atacadão)",
        amount: 580.0,
        date: new Date(now.getFullYear(), now.getMonth(), 6),
        category: "FOOD_MARKET",
        expenseType: "VARIABLE",
        paymentMethod: "VA", // Pago com VA
        isPaid: true,
        userId: lucas.id,
      },
      {
        description: "Açougue - Mistura da Semana (Carnes e Frango)",
        amount: 240.0,
        date: new Date(now.getFullYear(), now.getMonth(), 8),
        category: "FOOD_PROTEIN",
        expenseType: "VARIABLE",
        paymentMethod: "VA", // Pago com VA
        isPaid: true,
        userId: mariana.id,
      },
      {
        description: "Padaria & Doces para o fim de semana",
        amount: 145.0,
        date: new Date(now.getFullYear(), now.getMonth(), 11),
        category: "SWEETS_SNACKS",
        expenseType: "VARIABLE",
        paymentMethod: "VR", // Pago com VR
        isPaid: true,
        userId: lucas.id,
      },
      {
        description: "Jantar de Aniversário (Comer Fora - Outback)",
        amount: 260.0,
        date: new Date(now.getFullYear(), now.getMonth(), 13),
        category: "EAT_OUT_DELIVERY",
        expenseType: "VARIABLE",
        paymentMethod: "VR", // Pago com VR
        isPaid: true,
        userId: mariana.id,
      },
      {
        description: "Feira Livre - Verduras e Frutas",
        amount: 85.0,
        date: new Date(now.getFullYear(), now.getMonth(), 14),
        category: "WEEKLY_SHOPPING",
        expenseType: "VARIABLE",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        userId: mariana.id,
      },
      {
        description: "Farmácia - Vitaminas e Remédios",
        amount: 115.0,
        date: new Date(now.getFullYear(), now.getMonth(), 16),
        category: "HEALTH",
        expenseType: "VARIABLE",
        paymentMethod: "DEBIT_PIX",
        isPaid: true,
        userId: lucas.id,
      },
      {
        description: "Combustível Carro (Posto Ipiranga)",
        amount: 280.0,
        date: new Date(now.getFullYear(), now.getMonth(), 15),
        category: "TRANSPORT",
        expenseType: "VARIABLE",
        paymentMethod: "CREDIT_CARD",
        isPaid: true,
        userId: lucas.id,
      },
      {
        description: "Cinema + Pipoca (Fim de Semana)",
        amount: 95.0,
        date: new Date(now.getFullYear(), now.getMonth(), 17),
        category: "LEISURE",
        expenseType: "VARIABLE",
        paymentMethod: "CREDIT_CARD",
        isPaid: true,
        userId: mariana.id,
      },
    ],
  });

  // 7. Registro de Amortização Anterior
  await prisma.loanAmortization.create({
    data: {
      loanId: loanNubank.id,
      amountPaid: 1500.0,
      interestDiscount: 450.0,
      totalAbated: 1950.0,
      abatementType: "REDUCE_TERM",
      installmentsReduced: 3,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 25),
      userId: lucas.id,
      notes: "Amortização extraordinária usando sobra do orçamento!",
    },
  });

  // 8. Reserva de Emergência
  const emergencyFund = await prisma.emergencyFund.create({
    data: {
      currentAmount: 6800.0,
      targetMonths: 6,
      monthlyLivingCostCalculated: 6250.0,
      notes: "Meta de 6 meses do custo de vida essencial do casal",
    },
  });

  await prisma.emergencyDeposit.create({
    data: {
      fundId: emergencyFund.id,
      amount: 1000.0,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
      userId: mariana.id,
      notes: "Aporte mensal programado da reserva",
    },
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
