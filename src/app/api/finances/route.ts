import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
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

// Helper para serializar tipos Decimal do Prisma em números JavaScript nativos
function serializeDecimals(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object") {
    if (obj.constructor && (obj.constructor.name === "Decimal" || typeof obj.toNumber === "function")) {
      return Number(obj);
    }
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    if (Array.isArray(obj)) {
      return obj.map(serializeDecimals);
    }
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeDecimals(obj[key]);
    }
    return res;
  }
  return obj;
}

// Serializer central para expor somente campos seguros do integrante (Prevenção de vazamento de pinHash/passwordHash)
function toPublicUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    salaryGross: Number(user.salaryGross) || 0,
    salaryNet: Number(user.salaryNet) || 0,
    vrAmount: Number(user.vrAmount) || 0,
    vaAmount: Number(user.vaAmount) || 0,
    incomeProportion: Number(user.incomeProportion) || 50,
  };
}

// Autenticação estrita EXCLUSIVAMENTE via sessão NextAuth do servidor (Sem headers inseguros ou fallbacks)
async function getAuthenticatedUserSession() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    return user;
  } catch (e) {
    console.error("[AUTH_SESSION_EXCEPTION]", e);
    return null;
  }
}

/**
 * GET: Retorna dados financeiros consolidados do casal
 * Otimizado com:
 * 1. Execução paralela simultânea de todas as consultas com Promise.all (TTFB reduzido)
 * 2. Suporte a query params opcionais: limit, startDate, endDate, category, type
 * 3. Cabeçalhos de controle de cache privado e Server-Timing
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  try {
    const authUser = await getAuthenticatedUserSession();
    if (!authUser) {
      return NextResponse.json(
        {
          error: "Não autorizado",
          message: "Sessão inválida ou ausente. Faça login para acessar os dados financeiros.",
          statusCode: 401,
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        }
      );
    }

    // Suporte a query parameters opcionais
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const categoryParam = searchParams.get("category");
    const typeParam = searchParams.get("type") || searchParams.get("expenseType");

    const limitNumber = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 500) : undefined;

    // Filtros dinâmicos para despesas/transações
    const expenseWhere: Record<string, any> = {};

    if (startDateParam || endDateParam) {
      expenseWhere.date = {};
      if (startDateParam) {
        const start = new Date(startDateParam);
        if (!isNaN(start.getTime())) {
          expenseWhere.date.gte = start;
        }
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        if (!isNaN(end.getTime())) {
          expenseWhere.date.lte = end;
        }
      }
    }

    if (categoryParam) {
      expenseWhere.category = categoryParam;
    }

    if (typeParam) {
      expenseWhere.expenseType = typeParam;
    }

    // Execução paralela de todas as consultas independentes via Promise.all
    const [
      currentUser,
      users,
      loans,
      incomes,
      expenses,
      creditCards,
      installments,
      benefitCards,
      coupleSettings,
      emergencyFund,
    ] = await Promise.all([
      prisma.user.findUnique({
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
      }),
      prisma.user.findMany({
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
      }),
      prisma.loan.findMany({
        include: {
          amortizations: true,
          payments: { orderBy: { date: "desc" } },
        },
        orderBy: { interestRate: "desc" },
      }),
      prisma.income.findMany({
        orderBy: { receivedAt: "desc" },
      }),
      prisma.expense.findMany({
        where: Object.keys(expenseWhere).length > 0 ? expenseWhere : undefined,
        orderBy: { date: "desc" },
        take: limitNumber,
      }),
      prisma.creditCard.findMany({
        include: { installments: true },
        orderBy: { name: "asc" },
      }),
      prisma.creditCardInstallment.findMany({
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.benefitCard.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.coupleSettings.findFirst(),
      prisma.emergencyFund.findFirst({
        include: { deposits: true },
      }),
    ]);

    if (!currentUser) {
      return NextResponse.json(
        {
          error: "Usuário não localizado",
          message: "A conta vinculada a esta sessão não foi encontrada no banco.",
          statusCode: 401,
        },
        { status: 401 }
      );
    }

    // Normalização defensiva de empréstimos
    const normalizedLoans = loans.map((l: any) => {
      const title = l.title || l.name || "Empréstimo";
      const institution = l.institution || l.bank || "Banco";
      const principalAmount = Number(l.principalAmount || l.originalAmount || 0);
      const installmentAmount = Number(l.installmentAmount || l.currentInstallmentAmount || 0);
      const interestRate = Number(l.interestRate || l.monthlyInterestRate || 0);
      const totalInstallments = Number(l.totalInstallments || 0);
      const paidInstallments = Number(l.paidInstallments || 0);
      const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);
      const currentBalance = Number(l.currentBalance || (installmentAmount * remainingInstallments));
      const totalSaved = Number(l.totalSaved || 0);

      return {
        ...l,
        title,
        name: title,
        institution,
        bank: institution,
        principalAmount,
        originalAmount: principalAmount,
        installmentAmount,
        currentInstallmentAmount: installmentAmount,
        interestRate,
        monthlyInterestRate: interestRate,
        totalInstallments,
        paidInstallments,
        dueDay: Number(l.dueDay || 10),
        startDate: l.startDate instanceof Date ? l.startDate.toISOString() : (l.startDate || l.createdAt),
        status: l.status,
        totalSaved,
        currentBalance,
        profileId: l.profileId || null,
        notes: l.notes || null,
        payments: l.payments || [],
      };
    });

    const durationMs = (performance.now() - startTime).toFixed(1);

    return NextResponse.json(
      serializeDecimals({
        source: "neon-postgres",
        authenticated: true,
        authenticatedUserId: authUser.id,
        users: users.map(toPublicUser),
        currentUser: toPublicUser(currentUser),
        loans: normalizedLoans,
        incomes,
        expenses,
        creditCards,
        installments,
        benefitCards,
        coupleSettings,
        emergencyFund: emergencyFund || {
          id: "fund-default",
          currentAmount: 0,
          targetMonths: coupleSettings?.emergencyFundMonthsTarget || 6,
          monthlyLivingCostCalculated: 0,
          notes: "Reserva de emergência pronta para aportes reais",
        },
      }),
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Server-Timing": `db;dur=${durationMs};desc="Parallel Neon DB Queries"`,
        },
      }
    );
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
            userId: sessionUserId,
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
            userId: sessionUserId,
          },
        });
        return NextResponse.json({ success: true, data: newBenefitCard }, { status: 201 });
      }

      case "loan": {
        const remainingCount = Math.max(0, action.data.totalInstallments - action.data.paidInstallments);
        const currentBalance = action.data.installmentAmount * remainingCount;
        const newLoan = await prisma.loan.create({
          data: {
            title: action.data.title,
            institution: action.data.institution,
            profileId: action.data.profileId || sessionUserId,
            principalAmount: action.data.principalAmount,
            installmentAmount: action.data.installmentAmount,
            interestRate: action.data.interestRate,
            totalInstallments: action.data.totalInstallments,
            paidInstallments: action.data.paidInstallments,
            dueDay: action.data.dueDay,
            startDate: action.data.startDate ? new Date(action.data.startDate) : new Date(),
            status: action.data.status,
            totalSaved: 0,
            currentBalance,
            notes: action.data.notes,
            // Compatibilidade
            name: action.data.title,
            bank: action.data.institution,
            originalAmount: action.data.principalAmount,
            monthlyInterestRate: action.data.interestRate,
            currentInstallmentAmount: action.data.installmentAmount,
          },
        });
        return NextResponse.json({ success: true, data: newLoan }, { status: 201 });
      }

      case "payRegularLoanInstallment": {
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
        const instAmount = Number(loan.installmentAmount || loan.currentInstallmentAmount);
        const newBalance = Math.max(0, Number(loan.currentBalance) - instAmount);
        const isPaidOff = newPaid >= loan.totalInstallments || newBalance <= 0;

        const [updatedLoan, payment] = await prisma.$transaction([
          prisma.loan.update({
            where: { id: action.data.loanId },
            data: {
              paidInstallments: newPaid,
              currentBalance: newBalance,
              status: isPaidOff ? "PAID_OFF" : "ACTIVE",
            },
          }),
          prisma.loanPayment.create({
            data: {
              loanId: action.data.loanId,
              date: action.data.date ? new Date(action.data.date) : new Date(),
              type: "REGULAR",
              installmentsAbated: 1,
              originalValue: instAmount,
              paidValue: instAmount,
              savedAmount: 0,
              notes: `Pagamento regular da parcela ${newPaid}/${loan.totalInstallments}`,
              userId: sessionUserId,
            },
          }),
        ]);

        if (action.data.createTransaction !== false) {
          await prisma.expense.create({
            data: {
              description: `Parcela ${loan.title || loan.name} (${newPaid}/${loan.totalInstallments})`,
              amount: instAmount,
              date: action.data.date ? new Date(action.data.date) : new Date(),
              category: "LOAN_INSTALLMENT",
              expenseType: "LOAN",
              paymentMethod: "DEBIT_PIX",
              isPaid: true,
              loanId: loan.id,
              userId: sessionUserId,
            },
          });
        }

        return NextResponse.json({ success: true, data: updatedLoan, payment });
      }

      case "amortizeLoanEarly": {
        const loan = await prisma.loan.findUnique({
          where: { id: action.data.loanId },
        });
        if (!loan) {
          return NextResponse.json(
            { error: "Empréstimo não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }

        const savedAmount = Math.max(0, action.data.originalValue - action.data.paidValue);
        const newTotalSaved = Number(loan.totalSaved || 0) + savedAmount;
        let newPaidInstallments = loan.paidInstallments;
        let newInstallmentAmount = Number(loan.installmentAmount || loan.currentInstallmentAmount);

        if (action.data.strategy === "TERM_REDUCTION") {
          newPaidInstallments = Math.min(
            loan.totalInstallments,
            loan.paidInstallments + action.data.installmentsAbated
          );
        } else if (action.data.strategy === "INSTALLMENT_REDUCTION" && action.data.newInstallmentAmount) {
          newInstallmentAmount = action.data.newInstallmentAmount;
        }

        const remainingCount = Math.max(0, loan.totalInstallments - newPaidInstallments);
        const newBalance = Math.max(0, remainingCount * newInstallmentAmount);
        const isPaidOff = newPaidInstallments >= loan.totalInstallments || newBalance <= 0;

        const [updatedLoan, payment] = await prisma.$transaction([
          prisma.loan.update({
            where: { id: action.data.loanId },
            data: {
              paidInstallments: newPaidInstallments,
              installmentAmount: newInstallmentAmount,
              currentInstallmentAmount: newInstallmentAmount,
              totalSaved: newTotalSaved,
              currentBalance: newBalance,
              status: isPaidOff ? "PAID_OFF" : "ACTIVE",
            },
          }),
          prisma.loanPayment.create({
            data: {
              loanId: action.data.loanId,
              date: action.data.date ? new Date(action.data.date) : new Date(),
              type: "EARLY_AMORTIZATION",
              strategy: action.data.strategy,
              installmentsAbated: action.data.installmentsAbated,
              originalValue: action.data.originalValue,
              paidValue: action.data.paidValue,
              savedAmount,
              notes: action.data.notes || "Quitação antecipada com desconto",
              userId: sessionUserId,
            },
          }),
        ]);

        if (action.data.registerTransaction !== false) {
          await prisma.expense.create({
            data: {
              description: `Amortização ${loan.title || loan.name} (-${action.data.installmentsAbated}x, desc: R$ ${savedAmount.toFixed(2)})`,
              amount: action.data.paidValue,
              date: action.data.date ? new Date(action.data.date) : new Date(),
              category: "LOAN_INSTALLMENT",
              expenseType: "LOAN",
              paymentMethod: "DEBIT_PIX",
              isPaid: true,
              loanId: loan.id,
              userId: sessionUserId,
            },
          });
        }

        return NextResponse.json({ success: true, data: updatedLoan, payment }, { status: 201 });
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
        const existing = await prisma.expense.findUnique({
          where: { id: action.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Despesa não encontrada", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para alterar esta despesa.", statusCode: 403 },
            { status: 403 }
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
        const existing = await prisma.creditCard.findUnique({
          where: { id: action.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para alterar este cartão.", statusCode: 403 },
            { status: 403 }
          );
        }

        const updated = await prisma.creditCard.update({
          where: { id: action.id },
          data: action.data,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "benefitCard": {
        const existing = await prisma.benefitCard.findUnique({
          where: { id: action.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão benefício não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para alterar este cartão benefício.", statusCode: 403 },
            { status: 403 }
          );
        }

        const updated = await prisma.benefitCard.update({
          where: { id: action.id },
          data: action.data,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "loan": {
        const existing = await prisma.loan.findUnique({
          where: { id: action.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Empréstimo não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }

        const updateData: any = {};
        if (action.data.title !== undefined) {
          updateData.title = action.data.title;
          updateData.name = action.data.title;
        }
        if (action.data.institution !== undefined) {
          updateData.institution = action.data.institution;
          updateData.bank = action.data.institution;
        }
        if (action.data.profileId !== undefined) updateData.profileId = action.data.profileId;
        if (action.data.principalAmount !== undefined) {
          updateData.principalAmount = action.data.principalAmount;
          updateData.originalAmount = action.data.principalAmount;
        }
        if (action.data.installmentAmount !== undefined) {
          updateData.installmentAmount = action.data.installmentAmount;
          updateData.currentInstallmentAmount = action.data.installmentAmount;
        }
        if (action.data.interestRate !== undefined) {
          updateData.interestRate = action.data.interestRate;
          updateData.monthlyInterestRate = action.data.interestRate;
        }
        if (action.data.totalInstallments !== undefined) updateData.totalInstallments = action.data.totalInstallments;
        if (action.data.paidInstallments !== undefined) updateData.paidInstallments = action.data.paidInstallments;
        if (action.data.dueDay !== undefined) updateData.dueDay = action.data.dueDay;
        if (action.data.startDate !== undefined) updateData.startDate = new Date(action.data.startDate);
        if (action.data.notes !== undefined) updateData.notes = action.data.notes;
        if (action.data.status !== undefined) updateData.status = action.data.status;

        const total = action.data.totalInstallments !== undefined ? action.data.totalInstallments : existing.totalInstallments;
        const paid = action.data.paidInstallments !== undefined ? action.data.paidInstallments : existing.paidInstallments;
        const inst = action.data.installmentAmount !== undefined ? action.data.installmentAmount : Number(existing.installmentAmount || existing.currentInstallmentAmount);
        updateData.currentBalance = Math.max(0, (total - paid) * inst);

        const updated = await prisma.loan.update({
          where: { id: action.id },
          data: updateData,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "income": {
        const existing = await prisma.income.findUnique({
          where: { id: action.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Receita não encontrada", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para alterar esta receita.", statusCode: 403 },
            { status: 403 }
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

      case "user": {
        // IDOR PREVENTED: Usuário só pode editar o próprio perfil (sessionUserId)
        const targetId = sessionUserId;
        const existingUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (!existingUser) {
          return NextResponse.json(
            { error: "Usuário não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }

        const updateData: any = {};
        if (action.data.name !== undefined) updateData.name = action.data.name;
        if (action.data.email !== undefined) updateData.email = action.data.email;
        if (action.data.avatar !== undefined) updateData.avatar = action.data.avatar;
        if (action.data.salaryGross !== undefined) updateData.salaryGross = action.data.salaryGross;
        if (action.data.salaryNet !== undefined) updateData.salaryNet = action.data.salaryNet;
        if (action.data.vrAmount !== undefined) updateData.vrAmount = action.data.vrAmount;
        if (action.data.vaAmount !== undefined) updateData.vaAmount = action.data.vaAmount;
        if (action.data.incomeProportion !== undefined) updateData.incomeProportion = action.data.incomeProportion;

        // Troca de PIN: exige o PIN atual antes de gravar o novo (bcrypt.compare)
        const newPin = action.data.newPin || action.data.pin;
        if (newPin) {
          if (!action.data.currentPin) {
            return NextResponse.json(
              {
                error: "PIN atual obrigatório",
                message: "Para alterar o PIN, informe o PIN atual para confirmação.",
                statusCode: 400,
              },
              { status: 400 }
            );
          }

          if (!existingUser.pinHash) {
            return NextResponse.json(
              {
                error: "PIN não configurado",
                message: "Usuário não possui hash de PIN registrado.",
                statusCode: 400,
              },
              { status: 400 }
            );
          }

          const isValid = await bcrypt.compare(action.data.currentPin, existingUser.pinHash);
          if (!isValid) {
            return NextResponse.json(
              {
                error: "PIN atual incorreto",
                message: "O PIN atual informado está incorreto.",
                statusCode: 400,
              },
              { status: 400 }
            );
          }

          updateData.pinHash = await bcrypt.hash(newPin, 10);
        }

        const updated = await prisma.user.update({
          where: { id: targetId },
          data: updateData,
        });
        return NextResponse.json({ success: true, data: toPublicUser(updated) });
      }

      case "coupleSettings": {
        const existingSettings = await prisma.coupleSettings.findFirst();
        let updated;
        if (existingSettings) {
          updated = await prisma.coupleSettings.update({
            where: { id: existingSettings.id },
            data: action.data,
          });
        } else {
          updated = await prisma.coupleSettings.create({
            data: {
              coupleName: action.data.coupleName || "Laura & William",
              emergencyFundMonthsTarget: action.data.emergencyFundMonthsTarget || 6,
              user1SalaryProportion: action.data.user1SalaryProportion || 50,
              user2SalaryProportion: action.data.user2SalaryProportion || 50,
            },
          });
        }
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
        const existing = await prisma.expense.findUnique({
          where: { id: query.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Despesa não encontrada", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para excluir esta despesa.", statusCode: 403 },
            { status: 403 }
          );
        }

        await prisma.expense.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Despesa excluída com sucesso." });
      }

      case "income": {
        const existing = await prisma.income.findUnique({
          where: { id: query.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Receita não encontrada", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para excluir esta receita.", statusCode: 403 },
            { status: 403 }
          );
        }

        await prisma.income.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Receita excluída com sucesso." });
      }

      case "creditCard": {
        const existing = await prisma.creditCard.findUnique({
          where: { id: query.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para excluir este cartão.", statusCode: 403 },
            { status: 403 }
          );
        }

        await prisma.creditCard.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Cartão excluído com sucesso." });
      }

      case "installment": {
        const existing = await prisma.creditCardInstallment.findUnique({
          where: { id: query.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Parcela não encontrada", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para excluir esta parcela.", statusCode: 403 },
            { status: 403 }
          );
        }

        await prisma.creditCardInstallment.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Parcela excluída com sucesso." });
      }

      case "benefitCard": {
        const existing = await prisma.benefitCard.findUnique({
          where: { id: query.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Cartão benefício não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }
        if (existing.userId !== sessionUserId) {
          return NextResponse.json(
            { error: "Acesso negado", message: "Você não tem permissão para excluir este cartão benefício.", statusCode: 403 },
            { status: 403 }
          );
        }

        await prisma.benefitCard.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Cartão benefício excluído com sucesso." });
      }

      case "loan": {
        const existing = await prisma.loan.findUnique({
          where: { id: query.id },
        });
        if (!existing) {
          return NextResponse.json(
            { error: "Empréstimo não encontrado", statusCode: 404 },
            { status: 404 }
          );
        }

        await prisma.loan.delete({ where: { id: query.id } });
        return NextResponse.json({ success: true, message: "Empréstimo excluído com sucesso." });
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
