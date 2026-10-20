"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatPercent, formatDateBR, estimateInterestSavings } from "@/lib/utils";
import { Loan } from "@/types";
import {
  Zap,
  Flame,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Info,
  History,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

interface LoansAvalancheViewProps {
  onOpenAmortize: (loanId?: string) => void;
}

export const LoansAvalancheView: React.FC<LoansAvalancheViewProps> = ({
  onOpenAmortize,
}) => {
  const {
    avalanche,
    freeWallet,
    amortizations,
    payMonthlyInstallment,
  } = useFinance();

  const {
    sortedLoans,
    targetLoan,
    totalDebtBalance,
    totalMonthlyInstallments,
    suggestedAmortizationAmount,
    estimatedSavingsOnTarget,
  } = avalanche;

  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);

  const handlePayInstallment = (loan: Loan) => {
    setPayingLoanId(loan.id);
    setTimeout(() => {
      payMonthlyInstallment(loan.id);
      setPayingLoanId(null);

      // Se for a última parcela, comemorar!
      if (loan.paidInstallments + 1 >= loan.totalInstallments) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 300);
  };

  return (
    <div className="space-y-5">
      {/* Explicador Estratégico do Método Avalanche */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 border-amber-500/20 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Zap size={22} className="fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                Painel do Método Avalanche
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Foco na Maior Taxa
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Ordene suas dívidas da taxa mais cara para a mais barata. Destrua o juro mais alto primeiro!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/60 border border-white/10 px-3.5 py-2 rounded-xl text-xs">
            <div>
              <p className="text-[10px] text-slate-400">Dívida Total Ativa</p>
              <p className="font-bold text-rose-400 text-sm">
                {formatBRL(totalDebtBalance)}
              </p>
            </div>
            <div className="w-px h-7 bg-white/10" />
            <div>
              <p className="text-[10px] text-slate-400">Parcelas / Mês</p>
              <p className="font-bold text-amber-400 text-sm">
                {formatBRL(totalMonthlyInstallments)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sugestão de Ataque com Sobra do Mês */}
      {targetLoan && (
        <div className="glass-panel rounded-2xl p-4 border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/30 to-slate-900 avalanche-glow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  🎯 Alvo Prioritário de Ataque
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {targetLoan.name} • Taxa {formatPercent(targetLoan.monthlyInterestRate)} a.m.
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sobra projetada do Pote Único:{" "}
                <span className="font-bold text-emerald-400">
                  {formatBRL(freeWallet.projectedSurplus)}
                </span>
                . Ao destinar para amortizar este contrato, o casal economiza cerca de{" "}
                <span className="font-bold text-white underline">
                  {formatBRL(estimatedSavingsOnTarget)} em juros futuros
                </span>
                !
              </p>
            </div>

            <button
              onClick={() => onOpenAmortize(targetLoan.id)}
              className="w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shrink-0"
            >
              <Sparkles size={14} />
              Amortizar Alvo nº 1
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Lista de Empréstimos Ordenados */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 px-1">
          <Flame size={16} className="text-amber-400" />
          Fila de Quitação (Ordenada por Taxa Decrescente)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sortedLoans.map((loan, idx) => {
            const isTarget = targetLoan?.id === loan.id;
            const isPaidOff = loan.status === "PAID_OFF" || loan.currentBalance <= 0;
            const progress = loan.totalInstallments > 0
              ? Math.min(100, (loan.paidInstallments / loan.totalInstallments) * 100)
              : 100;
            const remainingInstallments = Math.max(0, loan.totalInstallments - loan.paidInstallments);

            return (
              <div
                key={loan.id}
                className={`glass-panel rounded-2xl p-4 relative overflow-hidden transition-all flex flex-col justify-between ${
                  isPaidOff
                    ? "border-emerald-500/40 bg-emerald-950/10 opacity-80"
                    : isTarget
                    ? "border-amber-500/60 bg-gradient-to-b from-amber-950/20 to-slate-900 shadow-xl"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isTarget && (
                          <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                            #1 ALVO
                          </span>
                        )}
                        {isPaidOff ? (
                          <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                            QUITADO 🎉
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
                            Posição #{idx + 1}
                          </span>
                        )}
                        <span className="text-xs font-bold text-amber-400">
                          {formatPercent(loan.monthlyInterestRate)} a.m.
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-white mt-1 leading-snug">
                        {loan.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">{loan.bank}</p>
                    </div>
                  </div>

                  {/* Saldo Devedor */}
                  <div className="my-3 p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-slate-400">Saldo Devedor:</span>
                      <span className="text-lg font-black text-white">
                        {formatBRL(loan.currentBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                      <span>Valor Original: {formatBRL(loan.originalAmount)}</span>
                      <span>Vencimento: dia {loan.dueDay}</span>
                    </div>
                  </div>

                  {/* Barra de Progresso de Parcelas */}
                  <div className="space-y-1 my-2">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>
                        Parcelas: <strong>{loan.paidInstallments}</strong> de{" "}
                        <strong>{loan.totalInstallments}</strong>
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {progress.toFixed(0)}% pago
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{remainingInstallments} parcelas restantes</span>
                      <span>Parcela: {formatBRL(loan.currentInstallmentAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                {!isPaidOff && (
                  <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-white/10">
                    <button
                      onClick={() => handlePayInstallment(loan)}
                      disabled={payingLoanId === loan.id}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                      title="Registrar pagamento da parcela do mês"
                    >
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      Pagar Parcela
                    </button>

                    <button
                      onClick={() => onOpenAmortize(loan.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        isTarget
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40"
                      }`}
                      title="Adiantar parcelas com abatimento de juros"
                    >
                      <Zap size={13} />
                      Amortizar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico de Amortizações Realizadas */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History size={16} className="text-emerald-400" />
          Histórico de Amortizações & Descontos de Juros Conquistados
        </h3>

        {amortizations.length > 0 ? (
          <div className="space-y-2">
            {amortizations.map((amort) => {
              const loan = sortedLoans.find((l) => l.id === amort.loanId);
              return (
                <div
                  key={amort.id}
                  className="bg-slate-950/60 border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {loan?.name || "Empréstimo"}
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        {amort.abatementType === "REDUCE_TERM"
                          ? `Prazo reduzido em ${amort.installmentsReduced} parcelas`
                          : "Parcela mensal reduzida"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Realizado em {formatDateBR(amort.date)} • {amort.notes || "Amortização extraordinária"}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Valor Pago</p>
                      <p className="font-bold text-white">{formatBRL(amort.amountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-400 font-semibold">
                        Juros Economizados
                      </p>
                      <p className="font-bold text-emerald-400">
                        +{formatBRL(amort.interestDiscount)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            Nenhuma amortização realizada ainda. Use a sobra do mês para abater a primeira!
          </p>
        )}
      </div>
    </div>
  );
};
