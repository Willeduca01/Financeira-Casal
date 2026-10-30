"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  formatBRL,
  formatPercent,
  formatDateBR,
  sortLoansByAvalanche,
  sortLoansBySnowball,
  calculateTotalPayoffToday,
  simulateExtraMonthlyAmortization,
} from "@/lib/utils";
import { Loan, LoanPayment } from "@/types";
import {
  Mountain,
  Snowflake,
  Flame,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  History,
  TrendingDown,
  Clock,
  Plus,
  Landmark,
  Trophy,
  PieChart,
  Calendar,
  Sliders,
  AlertCircle,
  Pencil,
  Lightbulb,
  ShieldCheck,
  Users,
  Check,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { NewLoanModal } from "@/components/modals/NewLoanModal";
import { EditLoanModal } from "@/components/modals/EditLoanModal";
import { AmortizationModal } from "@/components/modals/AmortizationModal";

interface LoansAvalancheViewProps {
  onOpenAmortize?: (loanId?: string) => void;
}

export const LoansAvalancheView: React.FC<LoansAvalancheViewProps> = React.memo(({
  onOpenAmortize,
}) => {
  const {
    loans,
    users,
    freeWallet,
    incomeStats,
    emergencyFundMetrics,
    amortizations,
    payRegularLoanInstallment,
  } = useFinance();

  // Estados locais
  const [selectedProfileId, setSelectedProfileId] = useState<string>("ALL");
  const [strategy, setStrategy] = useState<"AVALANCHE" | "SNOWBALL">("AVALANCHE");
  const [simulatorExtraAmount, setSimulatorExtraAmount] = useState<number>(500);
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);

  // Estados de modais
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [isEditLoanOpen, setIsEditLoanOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isAmortizeOpen, setIsAmortizeOpen] = useState(false);
  const [selectedAmortizeLoanId, setSelectedAmortizeLoanId] = useState<string | undefined>(undefined);

  // Abertura de amortização (utiliza callback externo se fornecido ou modal interno)
  const handleOpenAmortization = useCallback((loanId?: string) => {
    if (onOpenAmortize) {
      onOpenAmortize(loanId);
    } else {
      setSelectedAmortizeLoanId(loanId);
      setIsAmortizeOpen(true);
    }
  }, [onOpenAmortize]);

  // Abertura de edição
  const handleOpenEdit = useCallback((loan: Loan) => {
    setEditingLoan(loan);
    setIsEditLoanOpen(true);
  }, []);

  // Filtragem por perfil do casal
  const filteredLoans = useMemo(() => {
    if (selectedProfileId === "ALL") return loans;
    if (selectedProfileId === "JOINT") return loans.filter((l) => !l.profileId);
    return loans.filter((l) => l.profileId === selectedProfileId);
  }, [loans, selectedProfileId]);

  const activeLoans = useMemo(() => {
    return filteredLoans.filter((l) => l.status === "ACTIVE" && l.currentBalance > 0);
  }, [filteredLoans]);

  const paidOffLoans = useMemo(() => {
    return filteredLoans.filter((l) => l.status === "PAID_OFF" || l.currentBalance <= 0);
  }, [filteredLoans]);

  // Ordenação pela estratégia ativa (Avalanche vs Bola de Neve)
  const sortedActiveLoans = useMemo(() => {
    if (strategy === "AVALANCHE") {
      return sortLoansByAvalanche(activeLoans);
    }
    return sortLoansBySnowball(activeLoans);
  }, [activeLoans, strategy]);

  const targetLoan = sortedActiveLoans.length > 0 ? sortedActiveLoans[0] : null;

  // 1. KPI 1: Saldo Devedor Total & Estimativa de Quitação à Vista
  const totalDebtBalance = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + (l.currentBalance || 0), 0);
  }, [activeLoans]);

  const totalPayoffToday = useMemo(() => {
    return calculateTotalPayoffToday(activeLoans);
  }, [activeLoans]);

  // 2. KPI 2: Comprometimento Mensal e % da Renda Conjunta
  const totalMonthlyInstallments = useMemo(() => {
    return activeLoans.reduce(
      (sum, l) => sum + (l.installmentAmount ?? l.currentInstallmentAmount ?? 0),
      0
    );
  }, [activeLoans]);

  const monthlyCommitmentPercent = useMemo(() => {
    const totalIncome = incomeStats.totalNet > 0 ? incomeStats.totalNet : freeWallet.totalIncomeNet;
    if (totalIncome <= 0) return 0;
    return Math.min(100, (totalMonthlyInstallments / totalIncome) * 100);
  }, [totalMonthlyInstallments, incomeStats.totalNet, freeWallet.totalIncomeNet]);

  // 3. KPI 3: Total Economizado com Antecipações (Troféu de Economia)
  const { totalSavedAccumulated, totalInstallmentsEliminated } = useMemo(() => {
    let saved = 0;
    let eliminated = 0;

    // Do totalSaved cadastrado nos empréstimos
    for (const l of loans) {
      saved += l.totalSaved || 0;
      if (Array.isArray(l.payments)) {
        for (const p of l.payments) {
          if (p.type === "EARLY_AMORTIZATION") {
            eliminated += p.installmentsAbated || 0;
          }
        }
      }
    }

    // Das amortizações legadas se não estiverem contabilizadas em l.payments
    for (const a of amortizations) {
      if (a.interestDiscount && !loans.some((l) => l.payments?.some((p) => p.id === a.id))) {
        saved += a.interestDiscount;
        eliminated += a.installmentsReduced || 0;
      }
    }

    return { totalSavedAccumulated: saved, totalInstallmentsEliminated: eliminated };
  }, [loans, amortizations]);

  // 4. KPI 4: Progresso Geral de Quitação
  const { overallProgressPercent, totalPaidCount, totalContractedCount, estimatedDebtFreeDate } = useMemo(() => {
    let paid = 0;
    let total = 0;
    let maxRemainingMonths = 0;

    for (const l of activeLoans) {
      paid += l.paidInstallments || 0;
      total += l.totalInstallments || 0;
      const rem = Math.max(0, l.totalInstallments - l.paidInstallments);
      if (rem > maxRemainingMonths) maxRemainingMonths = rem;
    }

    // Inclui também os quitados no progresso global
    for (const l of paidOffLoans) {
      paid += l.totalInstallments || 0;
      total += l.totalInstallments || 0;
    }

    const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 100;

    // Data estimada de liberdade
    const freeDate = new Date();
    freeDate.setMonth(freeDate.getMonth() + maxRemainingMonths);
    const dateFormatted = maxRemainingMonths > 0
      ? freeDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : "Livre de dívidas!";

    return {
      overallProgressPercent: Math.round(pct),
      totalPaidCount: paid,
      totalContractedCount: total,
      estimatedDebtFreeDate: dateFormatted,
    };
  }, [activeLoans, paidOffLoans]);

  // Simulação Interativa "E se anteciparmos todo mês?"
  const simulationResult = useMemo(() => {
    return simulateExtraMonthlyAmortization(loans, simulatorExtraAmount, strategy);
  }, [loans, simulatorExtraAmount, strategy]);

  // Insight Inteligente com a Reserva de Emergência
  const reserveInsight = useMemo(() => {
    if (activeLoans.length === 0) return null;
    const maxLoanRate = Math.max(
      ...activeLoans.map((l) => l.interestRate ?? l.monthlyInterestRate ?? 0)
    );
    // Taxa líquida estimada da reserva (CDI líquido ~0.85% a.m.)
    const estimatedReserveRate = 0.85;

    if (maxLoanRate > estimatedReserveRate) {
      const topLoan = activeLoans.find(
        (l) => (l.interestRate ?? l.monthlyInterestRate ?? 0) === maxLoanRate
      );
      return {
        hasInsight: true,
        loanTitle: topLoan?.title || topLoan?.name || "Contrato",
        maxLoanRate,
        reserveRate: estimatedReserveRate,
        spread: (maxLoanRate - estimatedReserveRate).toFixed(2),
        reserveAmount: emergencyFundMetrics.currentAmount,
      };
    }
    return null;
  }, [activeLoans, emergencyFundMetrics.currentAmount]);

  // Histórico consolidado de pagamentos e amortizações
  const combinedHistory = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      loanTitle: string;
      institution: string;
      type: "REGULAR" | "EARLY_AMORTIZATION";
      strategy?: string;
      installmentsAbated: number;
      originalValue: number;
      paidValue: number;
      savedAmount: number;
      notes?: string;
    }> = [];

    // Pagamentos dos empréstimos
    for (const l of loans) {
      if (Array.isArray(l.payments)) {
        for (const p of l.payments) {
          list.push({
            id: p.id,
            date: p.date,
            loanTitle: l.title || l.name || "Empréstimo",
            institution: l.institution || l.bank || "Banco",
            type: p.type,
            strategy: p.strategy || undefined,
            installmentsAbated: p.installmentsAbated,
            originalValue: p.originalValue,
            paidValue: p.paidValue,
            savedAmount: p.savedAmount,
            notes: p.notes,
          });
        }
      }
    }

    // Amortizações do modelo legado caso não registradas em payments
    for (const a of amortizations) {
      if (!list.some((item) => item.id === a.id)) {
        const target = loans.find((l) => l.id === a.loanId);
        list.push({
          id: a.id,
          date: a.date,
          loanTitle: target?.title || target?.name || "Empréstimo",
          institution: target?.institution || target?.bank || "Banco",
          type: "EARLY_AMORTIZATION",
          strategy: a.abatementType === "REDUCE_TERM" ? "TERM_REDUCTION" : "INSTALLMENT_REDUCTION",
          installmentsAbated: a.installmentsReduced || 1,
          originalValue: a.amountPaid + a.interestDiscount,
          paidValue: a.amountPaid,
          savedAmount: a.interestDiscount,
          notes: a.notes,
        });
      }
    }

    // Ordenar do mais recente para o mais antigo
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [loans, amortizations]);

  // Handler para pagamento regular de parcela
  const handlePayRegularInstallment = useCallback(
    (loan: Loan) => {
      setPayingLoanId(loan.id);
      setTimeout(() => {
        payRegularLoanInstallment(loan.id, true);
        setPayingLoanId(null);

        // Se for a última parcela, solta confetti
        if (loan.paidInstallments + 1 >= loan.totalInstallments) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
          });
        }
      }, 300);
    },
    [payRegularLoanInstallment]
  );

  return (
    <div className="space-y-6">
      {/* 1. HEADER COM TÍTULO, FILTRO DE PERFIL E BOTÃO NOVO EMPRÉSTIMO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8DFD1]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center shadow-md shadow-[#C46D53]/20">
              <Mountain size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-black text-[#2C221E] leading-tight">
                Gestão de Empréstimos do Casal
              </h1>
              <p className="text-xs text-[#786B5E] mt-0.5">
                Acompanhamento de contratos, quitações antecipadas com cálculo a valor presente e eliminação acelerada de juros.
              </p>
            </div>
          </div>
        </div>

        {/* Controles do Topo: Filtro por Integrante + Botão Novo Empréstimo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Perfil */}
          <div className="inline-flex rounded-2xl border border-[#E8DFD1] bg-[#FBF9F5] p-1 shadow-xs text-xs font-bold text-[#786B5E]">
            <button
              onClick={() => setSelectedProfileId("ALL")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedProfileId === "ALL"
                  ? "bg-[#C46D53] text-white shadow-xs"
                  : "hover:text-[#2C221E]"
              }`}
            >
              Todos
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedProfileId(u.id)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedProfileId === u.id
                    ? "bg-[#C46D53] text-white shadow-xs"
                    : "hover:text-[#2C221E]"
                }`}
              >
                {u.name.split(" ")[0]}
              </button>
            ))}
            <button
              onClick={() => setSelectedProfileId("JOINT")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedProfileId === "JOINT"
                  ? "bg-[#C46D53] text-white shadow-xs"
                  : "hover:text-[#2C221E]"
              }`}
            >
              Conjunto
            </button>
          </div>

          {/* Botão + Novo Empréstimo */}
          <button
            onClick={() => setIsNewLoanOpen(true)}
            className="px-4 py-2 rounded-2xl bg-[#C46D53] hover:bg-[#B35D43] text-white font-bold text-xs shadow-md shadow-[#C46D53]/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} className="stroke-[3]" />
            Novo Empréstimo
          </button>
        </div>
      </div>

      {/* 2. OS 4 CARDS DE KPIS NO TOPO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Devedor Total */}
        <div className="organic-card p-4 sm:p-5 border-[#E8DFD1] bg-[#FBF9F5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#786B5E]">
              Saldo Devedor Total
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center">
              <Landmark size={16} />
            </div>
          </div>
          <div className="my-2">
            <p className="font-serif text-2xl font-black text-[#2C221E] leading-tight">
              {formatBRL(totalDebtBalance)}
            </p>
            <p className="text-[11px] text-[#7A8B68] font-bold mt-1">
              À vista hoje: ~{formatBRL(totalPayoffToday)}
            </p>
          </div>
          <span className="text-[10px] text-[#786B5E]">
            Soma bruta das parcelas restantes vs. quitação à vista
          </span>
        </div>

        {/* KPI 2: Comprometimento Mensal */}
        <div className="organic-card p-4 sm:p-5 border-[#E8DFD1] bg-[#FBF9F5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#786B5E]">
              Comprometimento Mensal
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D99B52]/15 text-[#D99B52] flex items-center justify-center">
              <PieChart size={16} />
            </div>
          </div>
          <div className="my-2">
            <p className="font-serif text-2xl font-black text-[#2C221E] leading-tight">
              {formatBRL(totalMonthlyInstallments)}
              <span className="text-xs font-normal text-[#786B5E]">/mês</span>
            </p>
            <p className="text-[11px] font-bold mt-1 text-[#C46D53]">
              Consome {monthlyCommitmentPercent.toFixed(1)}% da renda líquida
            </p>
          </div>
          <span className="text-[10px] text-[#786B5E]">
            Soma de todas as parcelas ativas no fluxo do casal
          </span>
        </div>

        {/* KPI 3: Troféu de Economia */}
        <div className="organic-card p-4 sm:p-5 border-[#7A8B68]/30 bg-gradient-to-br from-[#FBF9F5] to-[#E9EFE4]/60 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B7052]">
              Total Economizado 🏆
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#7A8B68] text-white flex items-center justify-center shadow-xs">
              <Trophy size={16} />
            </div>
          </div>
          <div className="my-2">
            <p className="font-serif text-2xl font-black text-[#5B7052] leading-tight">
              {formatBRL(totalSavedAccumulated)}
            </p>
            <p className="text-[11px] text-[#5B7052] font-black mt-1 flex items-center gap-1">
              <Sparkles size={12} />
              {totalInstallmentsEliminated} parcelas eliminadas!
            </p>
          </div>
          <span className="text-[10px] text-[#786B5E]">
            Juros não pagos graças a quitações antecipadas
          </span>
        </div>

        {/* KPI 4: Progresso Geral */}
        <div className="organic-card p-4 sm:p-5 border-[#E8DFD1] bg-[#FBF9F5] flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#786B5E]">
              Progresso de Quitação
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#7A8B68]/15 text-[#5B7052] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="my-2 space-y-1.5">
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-2xl font-black text-[#2C221E] leading-tight">
                {overallProgressPercent}%
              </p>
              <span className="text-xs font-bold text-[#786B5E]">
                {totalPaidCount}/{totalContractedCount} parc.
              </span>
            </div>
            <div className="w-full bg-[#E8DFD1] rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#D99B52] to-[#7A8B68] h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-[#786B5E] truncate">
            Meta 100% livre: <strong>{estimatedDebtFreeDate}</strong>
          </span>
        </div>
      </div>

      {/* 3. ALTERNADOR DE ESTRATÉGIA (AVALANCHE VS. BOLA DE NEVE) */}
      <div className="organic-card p-4 sm:p-5 border-[#E8DFD1] bg-[#FBF9F5] space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-serif font-black text-base text-[#2C221E] flex items-center gap-2">
              <Sliders size={18} className="text-[#C46D53]" />
              Estratégia de Amortização do Casal
            </h2>
            <p className="text-xs text-[#786B5E]">
              Escolha como priorizar as amortizações extras com o dinheiro excedente do mês.
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="inline-flex rounded-2xl border border-[#E8DFD1] bg-[#F4EFE6] p-1 shadow-xs">
            <button
              onClick={() => setStrategy("AVALANCHE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                strategy === "AVALANCHE"
                  ? "bg-[#C46D53] text-white shadow-xs"
                  : "text-[#786B5E] hover:text-[#2C221E]"
              }`}
            >
              <Mountain size={14} />
              Método Avalanche (Maior Juro)
            </button>
            <button
              onClick={() => setStrategy("SNOWBALL")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                strategy === "SNOWBALL"
                  ? "bg-[#7A8B68] text-white shadow-xs"
                  : "text-[#786B5E] hover:text-[#2C221E]"
              }`}
            >
              <Snowflake size={14} />
              Bola de Neve (Menor Saldo)
            </button>
          </div>
        </div>

        {/* Explicação da Estratégia Ativa */}
        <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
          strategy === "AVALANCHE"
            ? "border-[#C46D53]/30 bg-[#C46D53]/10 text-[#2C221E]"
            : "border-[#7A8B68]/30 bg-[#7A8B68]/10 text-[#2C221E]"
        }`}>
          {strategy === "AVALANCHE" ? (
            <Flame size={18} className="text-[#C46D53] shrink-0 mt-0.5" />
          ) : (
            <Snowflake size={18} className="text-[#7A8B68] shrink-0 mt-0.5" />
          )}
          <div>
            <strong>
              {strategy === "AVALANCHE"
                ? "Método Avalanche Ativo (Matematicamente Mais Eficiente):"
                : "Método Bola de Neve Ativo (Vitórias Psicológicas Rápidas):"}
            </strong>{" "}
            {strategy === "AVALANCHE"
              ? "Prioriza contratos com a maior taxa de juros (% a.m.). Corta o juro mais caro primeiro, maximizando o dinheiro economizado no bolso do casal."
              : "Prioriza contratos com o menor saldo devedor restante. O objetivo é quitar uma conta o mais rápido possível para eliminar parcelas mensais e aliviar o fluxo de caixa."}
          </div>
        </div>
      </div>

      {/* 4. CARD DE DESTAQUE ALVO PRIORITÁRIO #1 */}
      {targetLoan && (
        <div className="rounded-[28px] p-5 sm:p-6 bg-gradient-to-r from-[#C46D53] to-[#B05B42] text-[#FBF9F5] shadow-xl shadow-[#C46D53]/25 border border-[#B05B42]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/20 text-[#FBF9F5] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                  🎯 Prioridade #{1} da Estratégia
                </span>
                <span className="text-xs font-bold text-[#FBF9F5]/90">
                  {targetLoan.title || targetLoan.name} ({targetLoan.institution || targetLoan.bank})
                </span>
                <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">
                  Taxa: {formatPercent(targetLoan.interestRate ?? targetLoan.monthlyInterestRate ?? 0)} a.m.
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#FBF9F5]/90 leading-relaxed max-w-2xl">
                {strategy === "AVALANCHE" ? (
                  <>
                    Este contrato possui a <strong>maior taxa de juros ({formatPercent(targetLoan.interestRate ?? targetLoan.monthlyInterestRate ?? 0)} a.m.)</strong> da família. Qualquer amortização extra nele trará a maior economia matemática de juros possíveis para o casal.
                  </>
                ) : (
                  <>
                    Este contrato possui o <strong>menor saldo devedor ({formatBRL(targetLoan.currentBalance)})</strong>. Ao quitá-lo primeiro, vocês eliminam uma parcela mensal de <strong>{formatBRL(targetLoan.installmentAmount ?? targetLoan.currentInstallmentAmount ?? 0)}/mês</strong> do orçamento!
                  </>
                )}
              </p>

              <div className="flex items-center gap-4 text-xs pt-1 text-[#FBF9F5]/85">
                <span>Saldo: <strong>{formatBRL(targetLoan.currentBalance)}</strong></span>
                <span>&bull;</span>
                <span>Faltam {Math.max(0, targetLoan.totalInstallments - targetLoan.paidInstallments)} parcelas</span>
              </div>
            </div>

            <button
              onClick={() => handleOpenAmortization(targetLoan.id)}
              className="w-full md:w-auto px-6 py-3.5 bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#2C221E] font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Zap size={16} className="text-[#C46D53] fill-[#C46D53]" />
              Amortizar Prioridade #{1}
              <ArrowRight size={16} className="text-[#C46D53]" />
            </button>
          </div>
        </div>
      )}

      {/* 5. GRID DE EMPRÉSTIMOS ATIVOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-base font-bold text-[#2C221E] flex items-center gap-2">
            <Flame size={18} className="text-[#C46D53]" />
            Contratos Ativos ({activeLoans.length})
          </h3>
          <span className="text-xs text-[#786B5E]">
            Ordenado por: <strong>{strategy === "AVALANCHE" ? "Maior Taxa" : "Menor Saldo"}</strong>
          </span>
        </div>

        {activeLoans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedActiveLoans.map((loan, idx) => {
              const isTopPriority = targetLoan?.id === loan.id;
              const remainingInstallments = Math.max(0, loan.totalInstallments - loan.paidInstallments);
              const progress = loan.totalInstallments > 0
                ? Math.min(100, (loan.paidInstallments / loan.totalInstallments) * 100)
                : 0;

              const partner = users.find((u) => u.id === loan.profileId);
              const partnerName = partner ? partner.name.split(" ")[0] : "Casal / Conjunto";
              const currentRate = loan.interestRate ?? loan.monthlyInterestRate ?? 0;
              const currentInstallment = loan.installmentAmount ?? loan.currentInstallmentAmount ?? 0;

              return (
                <div
                  key={loan.id}
                  className={`organic-card p-5 relative overflow-hidden transition-all flex flex-col justify-between ${
                    isTopPriority
                      ? "border-2 border-[#C46D53] shadow-md shadow-[#C46D53]/10"
                      : "border-[#E8DFD1]"
                  }`}
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isTopPriority && (
                            <span className="bg-[#C46D53] text-[#FBF9F5] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                              Prioridade #1
                            </span>
                          )}
                          <span className="bg-[#F4EFE6] text-[#786B5E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E8DFD1]">
                            Posição #{idx + 1}
                          </span>
                          <span className="text-xs font-black text-[#C46D53] bg-[#C46D53]/10 px-2 py-0.5 rounded-full">
                            {formatPercent(currentRate)} a.m.
                          </span>
                        </div>

                        <h4 className="font-serif font-black text-base text-[#2C221E] mt-2 leading-snug">
                          {loan.title || loan.name}
                        </h4>
                        <p className="text-xs text-[#786B5E] font-medium flex items-center gap-1.5 mt-0.5">
                          <Landmark size={13} />
                          {loan.institution || loan.bank} &bull;{" "}
                          <span className="text-[#2C221E] font-bold">{partnerName}</span>
                        </p>
                      </div>

                      {/* Botão de Edição */}
                      <button
                        onClick={() => handleOpenEdit(loan)}
                        className="p-1.5 text-[#786B5E] hover:text-[#2C221E] hover:bg-[#F4EFE6] rounded-xl transition-colors"
                        title="Editar Contrato"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>

                    {/* Bloco de Saldo Devedor */}
                    <div className="my-3 p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E8DFD1] space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-[#786B5E] font-medium">Saldo Devedor:</span>
                        <span className="font-serif text-lg font-black text-[#2C221E]">
                          {formatBRL(loan.currentBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#786B5E] pt-1 border-t border-[#E8DFD1]/60">
                        <span>Original: {formatBRL(loan.principalAmount ?? loan.originalAmount ?? 0)}</span>
                        <span>Vence todo dia {loan.dueDay}</span>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="space-y-1.5 my-2">
                      <div className="flex justify-between text-xs text-[#786B5E]">
                        <span>
                          Pagas: <strong className="text-[#2C221E]">{loan.paidInstallments}</strong> | Faltam:{" "}
                          <strong className="text-[#C46D53]">{remainingInstallments}</strong>
                        </span>
                        <span className="font-bold text-[#7A8B68]">
                          {progress.toFixed(0)}% pago
                        </span>
                      </div>
                      <div className="w-full bg-[#E8DFD1] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#D99B52] to-[#7A8B68] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-[#786B5E] pt-0.5">
                        <span>Parcela: <strong>{formatBRL(currentInstallment)}/mês</strong></span>
                        {loan.totalSaved && loan.totalSaved > 0 ? (
                          <span className="text-[#5B7052] font-black">
                            Econ. R$ {loan.totalSaved.toFixed(0)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação Rápida */}
                  <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-[#E8DFD1]">
                    <button
                      onClick={() => handlePayRegularInstallment(loan)}
                      disabled={payingLoanId === loan.id}
                      className="px-3 py-2.5 rounded-xl bg-[#F4EFE6] hover:bg-[#E8DFD1] text-[#2C221E] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#E8DFD1]"
                      title="Registrar pagamento da parcela do mês"
                    >
                      <CheckCircle2 size={14} className="text-[#7A8B68]" />
                      Pagar Parcela
                    </button>

                    <button
                      onClick={() => handleOpenAmortization(loan.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                        isTopPriority
                          ? "bg-[#C46D53] hover:bg-[#B35D43] text-white"
                          : "bg-[#7A8B68] hover:bg-[#687756] text-white"
                      }`}
                      title="Adiantar parcelas com abatimento de juros"
                    >
                      <Zap size={14} className="fill-white" />
                      Antecipar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#FBF9F5] border border-[#E8DFD1] text-center space-y-3">
            <CheckCircle2 size={36} className="text-[#7A8B68] mx-auto" />
            <h4 className="font-serif text-lg font-bold text-[#2C221E]">
              Nenhum empréstimo ativo no momento!
            </h4>
            <p className="text-xs text-[#786B5E] max-w-md mx-auto">
              Parabéns ao casal! Sem dívidas ativas para esta visualização. Cadastre novos contratos caso tenham financiamentos ou empréstimos vigentes.
            </p>
            <button
              onClick={() => setIsNewLoanOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#C46D53] text-white font-bold text-xs inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Cadastrar Empréstimo
            </button>
          </div>
        )}
      </div>

      {/* 6. CONTRATOS QUITADOS (SEÇÃO COMEMORATIVA) */}
      {paidOffLoans.length > 0 && (
        <div className="organic-card p-5 border-[#7A8B68]/30 bg-[#E9EFE4]/30 space-y-3">
          <h4 className="font-serif text-sm font-bold text-[#5B7052] flex items-center gap-2">
            <Trophy size={16} />
            Contratos Totalmente Quitados 🎉 ({paidOffLoans.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {paidOffLoans.map((l) => (
              <div
                key={l.id}
                className="p-3.5 rounded-2xl bg-[#FBF9F5] border border-[#7A8B68]/30 flex items-center justify-between"
              >
                <div>
                  <h5 className="font-bold text-xs text-[#2C221E]">{l.title || l.name}</h5>
                  <p className="text-[11px] text-[#786B5E]">
                    {l.institution || l.bank} &bull; {l.totalInstallments} parcelas pagas
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-[#7A8B68] text-white font-black px-2 py-0.5 rounded-full uppercase">
                    Quitado
                  </span>
                  {l.totalSaved && l.totalSaved > 0 ? (
                    <p className="text-[10px] text-[#5B7052] font-black mt-1">
                      Econ. {formatBRL(l.totalSaved)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SIMULADOR INTERATIVO: "E SE ANTECIPARMOS TODO MÊS?" */}
      <div className="organic-card p-5 sm:p-6 border-[#E8DFD1] bg-gradient-to-br from-[#FBF9F5] via-[#F4EFE6] to-[#FBF9F5] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-black text-base sm:text-lg text-[#2C221E] flex items-center gap-2">
              <Sparkles size={18} className="text-[#D99B52]" />
              Simulador Interativo: &quot;E se anteciparmos todo mês?&quot;
            </h3>
            <p className="text-xs text-[#786B5E]">
              Defina um valor extra mensal e veja o efeito multiplicador da antecipação contínua.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-[#786B5E]">Aporte Extra Simulado:</span>
            <p className="font-serif text-xl font-black text-[#C46D53]">
              {formatBRL(simulatorExtraAmount)}
              <span className="text-xs font-normal text-[#786B5E]">/mês</span>
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={100}
            max={3000}
            step={50}
            value={simulatorExtraAmount}
            onChange={(e) => setSimulatorExtraAmount(parseInt(e.target.value) || 100)}
            className="w-full h-2.5 bg-[#E8DFD1] rounded-lg appearance-none cursor-pointer accent-[#C46D53]"
          />
          <div className="flex justify-between text-[11px] text-[#786B5E]">
            <span>R$ 100/mês</span>
            <span>R$ 1.000/mês</span>
            <span>R$ 2.000/mês</span>
            <span>R$ 3.000/mês</span>
          </div>
        </div>

        {/* Grid de Resultados do Simulador */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#E8DFD1] text-center">
            <p className="text-[10px] text-[#786B5E] font-bold uppercase">Prazo Normal</p>
            <p className="font-serif text-lg font-black text-[#2C221E] mt-0.5">
              {simulationResult.baselineMonths} meses
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#FBF9F5] border border-[#E8DFD1] text-center">
            <p className="text-[10px] text-[#786B5E] font-bold uppercase">Novo Prazo Acelerado</p>
            <p className="font-serif text-lg font-black text-[#C46D53] mt-0.5">
              {simulationResult.acceleratedMonths} meses
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#7A8B68]/15 border border-[#7A8B68]/30 text-center">
            <p className="text-[10px] text-[#5B7052] font-black uppercase">Tempo Economizado</p>
            <p className="font-serif text-lg font-black text-[#5B7052] mt-0.5">
              -{simulationResult.monthsSaved} meses mais cedo!
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#7A8B68]/20 border border-[#7A8B68]/40 text-center">
            <p className="text-[10px] text-[#5B7052] font-black uppercase">Juros Economizados</p>
            <p className="font-serif text-lg font-black text-[#5B7052] mt-0.5">
              {formatBRL(simulationResult.projectedInterestSavings)}
            </p>
          </div>
        </div>
      </div>

      {/* 8. INSIGHT INTELIGENTE: RESERVA VS. JUROS DO EMPRÉSTIMO */}
      {reserveInsight && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FBF9F5] border-2 border-[#D99B52]/40 shadow-xs space-y-2">
          <div className="flex items-center gap-2.5 text-[#D99B52]">
            <Lightbulb size={20} className="shrink-0" />
            <h4 className="font-serif font-black text-sm text-[#2C221E]">
              Insight Inteligente: Reserva de Emergência vs. Amortização
            </h4>
          </div>
          <p className="text-xs text-[#2C221E] leading-relaxed">
            O contrato <strong>{reserveInsight.loanTitle}</strong> cobra juros de{" "}
            <strong className="text-[#C46D53]">{formatPercent(reserveInsight.maxLoanRate)} a.m.</strong>, enquanto aplicações da reserva de emergência rendem em média <strong>~0.85% a.m. líquido</strong>.
          </p>
          <div className="p-3 rounded-2xl bg-[#F4EFE6] text-xs text-[#786B5E] flex items-center justify-between">
            <span>
              Diferença (Spread) a favor da quitação:{" "}
              <strong className="text-[#5B7052]">+{reserveInsight.spread}% ao mês</strong>
            </span>
            <span className="font-bold text-[#2C221E]">
              Recomendação: Mantenha a reserva mínima de segurança e direcione excedentes para abater este juro!
            </span>
          </div>
        </div>
      )}

      {/* 9. HISTÓRICO DE ANTECIPAÇÕES E DESCONTOS CONQUISTADOS */}
      <div className="organic-card p-5 space-y-3.5 shadow-xs">
        <h3 className="font-serif text-sm font-bold text-[#2C221E] flex items-center gap-2">
          <History size={16} className="text-[#7A8B68]" />
          Histórico de Amortizações & Descontos Conquistados
        </h3>

        {combinedHistory.length > 0 ? (
          <div className="space-y-2.5">
            {combinedHistory.map((item) => (
              <div
                key={item.id}
                className="bg-[#F4EFE6] border border-[#E8DFD1] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-[#EFE7D8]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#2C221E]">
                      {item.loanTitle}
                    </span>
                    <span className="text-[10px] text-[#786B5E] font-medium">
                      ({item.institution})
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      item.type === "EARLY_AMORTIZATION"
                        ? "bg-[#7A8B68]/15 text-[#5B7052] border-[#7A8B68]/30"
                        : "bg-[#FBF9F5] text-[#786B5E] border-[#E8DFD1]"
                    }`}>
                      {item.type === "EARLY_AMORTIZATION"
                        ? `Antecipação (${item.installmentsAbated} ${item.installmentsAbated === 1 ? "parcela" : "parcelas"})`
                        : "Parcela Regular"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#786B5E]">
                    {formatDateBR(item.date)} &bull; {item.notes || "Pagamento registrado"}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div>
                    <p className="text-[10px] text-[#786B5E] font-bold uppercase">Valor Pago</p>
                    <p className="font-serif font-black text-[#2C221E]">{formatBRL(item.paidValue)}</p>
                  </div>
                  {item.savedAmount > 0 && (
                    <div className="bg-[#7A8B68]/15 px-2.5 py-1 rounded-xl border border-[#7A8B68]/30 text-right">
                      <p className="text-[10px] text-[#5B7052] font-black uppercase">Desconto / Economia</p>
                      <p className="font-serif font-black text-[#5B7052]">+{formatBRL(item.savedAmount)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#786B5E] text-center py-6">
            Nenhuma antecipação realizada ainda. Use a sobra do mês no Alvo Prioritário para inaugurar o Troféu de Economia do casal!
          </p>
        )}
      </div>

      {/* MODAIS */}
      <NewLoanModal
        isOpen={isNewLoanOpen}
        onClose={() => setIsNewLoanOpen(false)}
      />

      <EditLoanModal
        isOpen={isEditLoanOpen}
        onClose={() => {
          setIsEditLoanOpen(false);
          setEditingLoan(null);
        }}
        loan={editingLoan}
      />

      <AmortizationModal
        isOpen={isAmortizeOpen}
        loanId={selectedAmortizeLoanId}
        onClose={() => {
          setIsAmortizeOpen(false);
          setSelectedAmortizeLoanId(undefined);
        }}
      />
    </div>
  );
});

LoansAvalancheView.displayName = "LoansAvalancheView";
