import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanData() {
  console.log("Iniciando limpeza de dados demonstrativos do banco de dados...");

  // 1. Limpar tabelas transacionais e operacionais
  const deletedInstallments = await prisma.creditCardInstallment.deleteMany({});
  console.log(`- Parcelas de cartão removidas: ${deletedInstallments.count}`);

  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`- Despesas removidas: ${deletedExpenses.count}`);

  const deletedCards = await prisma.creditCard.deleteMany({});
  console.log(`- Cartões de crédito removidos: ${deletedCards.count}`);

  const deletedBenefitCards = await prisma.benefitCard.deleteMany({});
  console.log(`- Cartões de benefício removidos: ${deletedBenefitCards.count}`);

  const deletedAmortizations = await prisma.loanAmortization.deleteMany({});
  console.log(`- Amortizações removidas: ${deletedAmortizations.count}`);

  const deletedDeposits = await prisma.emergencyDeposit.deleteMany({});
  console.log(`- Aportes de reserva removidos: ${deletedDeposits.count}`);

  const deletedIncomes = await prisma.income.deleteMany({});
  console.log(`- Receitas removidas: ${deletedIncomes.count}`);

  const deletedLoans = await prisma.loan.deleteMany({});
  console.log(`- Empréstimos removidos: ${deletedLoans.count}`);

  // 2. Zerar a reserva de emergência
  await prisma.emergencyFund.deleteMany({});
  const newFund = await prisma.emergencyFund.create({
    data: {
      currentAmount: 0,
      targetMonths: 6,
      monthlyLivingCostCalculated: 0,
      notes: "Reserva de emergência pronta para aportes reais",
    },
  });
  console.log(`- Reserva de emergência zerada (ID: ${newFund.id})`);

  // 3. Verificar usuários mantidos
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });
  console.log(`- Usuários preservados (${users.length}):`, users.map((u) => u.name).join(", "));

  console.log("Limpeza de dados concluída com sucesso!");
}

cleanData()
  .catch((e) => {
    console.error("Erro durante a limpeza de dados:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
