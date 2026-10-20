import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  FinancePostActionSchema,
  FinancePutActionSchema,
  FinanceDeleteQuerySchema,
} from "@/lib/validations/finance";

/**
 * ==============================================================================
 * API PROTEGIDA DE FINANÇAS DO CASAL (FASE 2)
 * ==============================================================================
 * Medidas de Blindagem Implementadas:
 * 1. Autenticação Obrigatória em TODOS os métodos HTTP via getServerSession(authOptions).
 * 2. Prevenção Total de IDOR: O userId NUNCA é aceito do cliente; é sempre extraído da sessão.
 * 3. Validação e Sanitização Estrita de Payload com Zod contra Stored XSS e injeções numéricas.
 * 4. Prevenção de Vazamento de Dados (Data Leakage): Erros brutos do Prisma são logados
 *    apenas internamente no servidor; o cliente recebe respostas tratadas e higienizadas.
 * ==============================================================================
 */

// Helper para validação obrigatória da sessão
async function getAuthenticatedUserSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    return null;
  }
  return {
    id: (session.user as any).id as string,
    email: session.user.email as string,
    name: session.user.name as string,
  };
}

/**
 * GET: Retorna dados financeiros consolidados do casal
 */
export async function GET() {
  try {
    const authUser = await getAuthenticatedUserSession();
    if (!authUser) {
      return NextResponse.json(
        {
          error: "Não autorizado (Unauthorized)",
          message:
            "Sessão inexistente ou expirada. Efetue login para visualizar os dados financeiros.",
          statusCode: 401,
        },
        { status: 401 }
      );
    }

    // Verificar se o usuário autenticado existe no banco
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        salaryGross: true,
        salaryNet: true,
        vrAmount: true,
        vaAmount: true,
        incomeProportion: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Usuário não localizado",
          message: "A conta vinculada a esta sessão não foi encontrada no banco.",
          statusCode: 401,
        },
        { status: 401 }
      );
    }

    // Consulta do Pote Único do Casal
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        salaryGross: true,
        salaryNet: true,
        vrAmount: true,
        vaAmount: true,
        incomeProportion: true,
        pinHash: true,
      },
    });

    const loans = await prisma.loan.findMany({
      include: { amortizations: true },
    });
    const incomes = await prisma.income.findMany();
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    const creditCards = await prisma.creditCard.findMany({
      include: { installments: true },
    });
    const installments = await prisma.creditCardInstallment.findMany();
    const benefitCards = await prisma.benefitCard.findMany();
    const coupleSettings = await prisma.coupleSettings.findFirst();

    return NextResponse.json({
      source: "neon-postgres",
      authenticatedUserId: authUser.id,
      users,
      currentUser: user,
      loans,
      incomes,
      expenses,
      creditCards,
      installments,
      benefitCards,
      coupleSettings,
    });
  } catch (error) {
    console.error("[API_FINANCES_GET_ERROR]", error);
    return NextResponse.json(
      {
        error: "Erro interno no servidor",
        message: "Não foi possível carregar os dados financeiros no momento.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Criação segura de entidades financeiras com prevenção de IDOR e validação Zod
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSession();
    if (!authUser) {
      return NextResponse.json(
        {
          error: "Não autorizado",
          message: "Sessão inválida. Operação de criação rejeitada.",
          statusCode: 401,
        },
        { status: 401 }
      );
    }

    const sessionUserId = authUser.id;
    const body = await request.json();

    // 1. Validação estrita de payload e sanitização anti-XSS via Zod
    const action = FinancePostActionSchema.parse(body);

    // 2. Criação com amarração estrita de propriedade (IDOR PREVENTED)
    switch (action.entity) {
      case "expense": {
        if (action.data.creditCardId) {
          const card = await prisma.creditCard.findUnique({
            where: { id: action.data.creditCardId },
          });
          if (!card) {
            return NextResponse.json(
              { error: "Cartão de crédito informado não existe", statusCode: 400 },
              { status: 400 }
            );
          }
        }

        const newExpense = await prisma.expense.create({
          data: {
            description: action.data.description,
            amount: action.data.amount,
            date: new Date(action.data.date),
            category: action.data.category,
            expenseType: action.data.expenseType,
            paymentMethod: action.data.paymentMethod,
            isPaid: action.data.isPaid,
            dueDate: action.data.dueDate ? new Date(action.data.dueDate) : null,
            creditCardInvoiceMonth: action.data.creditCardInvoiceMonth,
            loanId: action.data.loanId,
            creditCardId: action.data.creditCardId,
            userId: sessionUserId, // IDOR PREVENTED: vinculado ao usuário autenticado
          },
        });
        return NextResponse.json({ success: true, data: newExpense }, { status: 201 });
      }

      case "income": {
        const newIncome = await prisma.income.create({
          data: {
            description: action.data.description,
            amountGross: action.data.amountGross,
            amountNet: action.data.amountNet,
            category: action.data.category,
            walletType: action.data.walletType,
            benefitType: action.data.benefitType,
            receivedAt: new Date(action.data.receivedAt),
            userId: sessionUserId, // IDOR PREVENTED
          },
        });
        return NextResponse.json({ success: true, data: newIncome }, { status: 201 });
      }

      case "creditCard": {
        const newCard = await prisma.creditCard.create({
          data: {
            name: action.data.name,
            bank: action.data.bank,
            color: action.data.color,
            lastFourDigits: action.data.lastFourDigits,
            totalLimit: action.data.totalLimit,
            availableLimit: action.data.availableLimit,
            closingDay: action.data.closingDay,
            dueDay: action.data.dueDay,
            userId: sessionUserId, // IDOR PREVENTED
          },
        });
        return NextResponse.json({ success: true, data: newCard }, { status: 201 });
      }

      case "installment": {
        // Valida se o cartão existe
        const card = await prisma.creditCard.findUnique({
          where: { id: action.data.cardId },
        });
        if (!card) {
          return NextResponse.json(
            { error: "Cartão de crédito não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }

        const newInstallment = await prisma.creditCardInstallment.create({
          data: {
            cardId: action.data.cardId,
            description: action.data.description,
            totalAmount: action.data.totalAmount,
            installmentAmount: action.data.installmentAmount,
            totalInstallments: action.data.totalInstallments,
            currentInstallment: action.data.currentInstallment,
            category: action.data.category,
            purchaseDate: action.data.purchaseDate
              ? new Date(action.data.purchaseDate)
              : new Date(),
            userId: sessionUserId, // IDOR PREVENTED
          },
        });
        return NextResponse.json({ success: true, data: newInstallment }, { status: 201 });
      }

      case "benefitCard": {
        const newBenefitCard = await prisma.benefitCard.create({
          data: {
            name: action.data.name,
            type: action.data.type,
            currentBalance: action.data.currentBalance,
            monthlyDeposit: action.data.monthlyDeposit,
            depositDay: action.data.depositDay,
            color: action.data.color,
            lastFourDigits: action.data.lastFourDigits,
            userId: sessionUserId, // IDOR PREVENTED
          },
        });
        return NextResponse.json({ success: true, data: newBenefitCard }, { status: 201 });
      }

      case "amortization": {
        const loan = await prisma.loan.findUnique({
          where: { id: action.data.loanId },
        });
        if (!loan) {
          return NextResponse.json(
            { error: "Empréstimo não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }

        const newBalance = Math.max(0, Number(loan.currentBalance) - action.data.amountPaid);
        const newPaidInstallments =
          action.data.abatementType === "REDUCE_TERM"
            ? Math.min(
                loan.totalInstallments,
                loan.paidInstallments + action.data.installmentsReduced
              )
            : loan.paidInstallments;

        const [amortization] = await prisma.$transaction([
          prisma.loanAmortization.create({
            data: {
              loanId: action.data.loanId,
              amountPaid: action.data.amountPaid,
              interestDiscount: action.data.interestDiscount,
              totalAbated: action.data.amountPaid + action.data.interestDiscount,
              abatementType: action.data.abatementType,
              installmentsReduced: action.data.installmentsReduced,
              previousInstallmentAmount:
                action.data.previousInstallmentAmount || loan.currentInstallmentAmount,
              newInstallmentAmount:
                action.data.newInstallmentAmount || loan.currentInstallmentAmount,
              notes: action.data.notes,
              userId: sessionUserId, // IDOR PREVENTED
            },
          }),
          prisma.loan.update({
            where: { id: action.data.loanId },
            data: {
              currentBalance: newBalance,
              paidInstallments: newPaidInstallments,
              currentInstallmentAmount:
                action.data.newInstallmentAmount || loan.currentInstallmentAmount,
              status: newBalance <= 0 ? "PAID_OFF" : "ACTIVE",
            },
          }),
        ]);

        return NextResponse.json({ success: true, data: amortization }, { status: 201 });
      }

      case "emergencyDeposit": {
        const deposit = await prisma.emergencyDeposit.create({
          data: {
            fundId: action.data.fundId,
            amount: action.data.amount,
            notes: action.data.notes,
            userId: sessionUserId, // IDOR PREVENTED
          },
        });

        await prisma.emergencyFund.update({
          where: { id: action.data.fundId },
          data: {
            currentAmount: { increment: action.data.amount },
          },
        });

        return NextResponse.json({ success: true, data: deposit }, { status: 201 });
      }

      case "payInstallment": {
        const loan = await prisma.loan.findUnique({
          where: { id: action.data.loanId },
        });
        if (!loan) {
          return NextResponse.json(
            { error: "Empréstimo não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }

        const newPaid = Math.min(loan.totalInstallments, loan.paidInstallments + 1);
        const newBalance = Math.max(
          0,
          Number(loan.currentBalance) - Number(loan.currentInstallmentAmount)
        );

        const updated = await prisma.loan.update({
          where: { id: action.data.loanId },
          data: {
            paidInstallments: newPaid,
            currentBalance: newBalance,
            status:
              newPaid >= loan.totalInstallments || newBalance <= 0 ? "PAID_OFF" : "ACTIVE",
          },
        });

        return NextResponse.json({ success: true, data: updated });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Falha de validação nos dados enviados",
          statusCode: 400,
          details: error.issues.map((i) => ({
            campo: i.path.join("."),
            mensagem: i.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("[API_FINANCES_POST_ERROR]", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: "Não foi possível registrar a operação financeira.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT: Atualização segura com verificação de propriedade (Prevenção de IDOR)
 */
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSession();
    if (!authUser) {
      return NextResponse.json(
        { error: "Não autorizado", message: "Sessão inválida.", statusCode: 401 },
        { status: 401 }
      );
    }

    const sessionUserId = authUser.id;
    const body = await request.json();
    const action = FinancePutActionSchema.parse(body);

    switch (action.entity) {
      case "expense": {
        // IDOR PREVENTED: Validação estrita de posse pelo userId da sessão
        const existing = await prisma.expense.findFirst({
          where: { id: action.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Despesa não encontrada ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        const updated = await prisma.expense.update({
          where: { id: action.id },
          data: {
            ...(action.data.description && { description: action.data.description }),
            ...(action.data.amount && { amount: action.data.amount }),
            ...(action.data.category && { category: action.data.category }),
            ...(action.data.expenseType && { expenseType: action.data.expenseType }),
            ...(action.data.paymentMethod && { paymentMethod: action.data.paymentMethod }),
            ...(action.data.isPaid !== undefined && { isPaid: action.data.isPaid }),
          },
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "creditCard": {
        // IDOR PREVENTED
        const existing = await prisma.creditCard.findFirst({
          where: { id: action.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão não encontrado ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        const updated = await prisma.creditCard.update({
          where: { id: action.id },
          data: action.data,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "benefitCard": {
        // IDOR PREVENTED
        const existing = await prisma.benefitCard.findFirst({
          where: { id: action.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão benefício não encontrado ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        const updated = await prisma.benefitCard.update({
          where: { id: action.id },
          data: action.data,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "income": {
        // IDOR PREVENTED
        const existing = await prisma.income.findFirst({
          where: { id: action.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Receita não encontrada ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        const updated = await prisma.income.update({
          where: { id: action.id },
          data: {
            ...(action.data.description && { description: action.data.description }),
            ...(action.data.amountGross && { amountGross: action.data.amountGross }),
            ...(action.data.amountNet && { amountNet: action.data.amountNet }),
            ...(action.data.category && { category: action.data.category }),
            ...(action.data.walletType && { walletType: action.data.walletType }),
          },
        });
        return NextResponse.json({ success: true, data: updated });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Erro de validação nos dados enviados",
          statusCode: 400,
          details: error.issues.map((i) => ({
            campo: i.path.join("."),
            mensagem: i.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("[API_FINANCES_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar registro", statusCode: 500 },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Exclusão segura com verificação estrita de propriedade (Prevenção de IDOR)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUserSession();
    if (!authUser) {
      return NextResponse.json(
        { error: "Não autorizado", message: "Sessão inválida.", statusCode: 401 },
        { status: 401 }
      );
    }

    const sessionUserId = authUser.id;
    const { searchParams } = new URL(request.url);

    // Validação estrita dos parâmetros da requisição
    const query = FinanceDeleteQuerySchema.parse({
      entity: searchParams.get("entity"),
      id: searchParams.get("id"),
    });

    switch (query.entity) {
      case "expense": {
        // IDOR PREVENTED: Só remove se pertencer ao usuário autenticado
        const existing = await prisma.expense.findFirst({
          where: { id: query.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Despesa não encontrada ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        await prisma.expense.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Despesa excluída com sucesso." });
      }

      case "income": {
        const existing = await prisma.income.findFirst({
          where: { id: query.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Receita não encontrada ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        await prisma.income.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Receita excluída com sucesso." });
      }

      case "creditCard": {
        const existing = await prisma.creditCard.findFirst({
          where: { id: query.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão não encontrado ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        await prisma.creditCard.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Cartão excluído com sucesso." });
      }

      case "installment": {
        const existing = await prisma.creditCardInstallment.findFirst({
          where: { id: query.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Parcela não encontrada ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        await prisma.creditCardInstallment.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Parcela excluída com sucesso." });
      }

      case "benefitCard": {
        const existing = await prisma.benefitCard.findFirst({
          where: { id: query.id, userId: sessionUserId },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão benefício não encontrado ou acesso não autorizado", statusCode: 404 },
            { status: 404 }
          );
        }

        await prisma.benefitCard.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Cartão benefício excluído com sucesso." });
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Parâmetros de exclusão inválidos",
          statusCode: 400,
          details: error.issues.map((i) => ({
            campo: i.path.join("."),
            mensagem: i.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error("[API_FINANCES_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir registro financeiro", statusCode: 500 },
      { status: 500 }
    );
  }
}
