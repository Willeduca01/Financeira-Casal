import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_USERS,
  INITIAL_LOANS,
  INITIAL_INCOMES,
  INITIAL_EXPENSES,
  INITIAL_CREDIT_CARDS,
  INITIAL_INSTALLMENTS,
  INITIAL_BENEFIT_CARDS,
} from "@/lib/mock-data";

export async function GET() {
  try {
    // Se DATABASE_URL estiver configurado, busca do Neon PostgreSQL
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 10) {
      const users = await prisma.user.findMany();
      const loans = await prisma.loan.findMany();
      const incomes = await prisma.income.findMany();
      const expenses = await prisma.expense.findMany();
      const creditCards = await prisma.creditCard.findMany({
        include: { installments: true },
      });
      const installments = await prisma.creditCardInstallment.findMany();
      const benefitCards = await prisma.benefitCard.findMany();

      return NextResponse.json({
        source: "neon-postgres",
        users,
        loans,
        incomes,
        expenses,
        creditCards,
        installments,
        benefitCards,
      });
    }

    // Caso contrário, retorna dados simulados de alta fidelidade
    return NextResponse.json({
      source: "mock-storage",
      users: INITIAL_USERS,
      loans: INITIAL_LOANS,
      incomes: INITIAL_INCOMES,
      expenses: INITIAL_EXPENSES,
      creditCards: INITIAL_CREDIT_CARDS,
      installments: INITIAL_INSTALLMENTS,
      benefitCards: INITIAL_BENEFIT_CARDS,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao processar dados financeiros",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
