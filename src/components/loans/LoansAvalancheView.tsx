"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatPercent, formatDateBR } from "@/lib/utils";
import { Loan } from "@/types";
import {
  Mountain,
  Flame,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  History,
  TrendingDown,
  Clock,
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
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }, 300);
  };

  return (
    <div className="space-y-5">
      {/* Explicador Estratégico do Método Avalanche */}
      <div className="organic-card p-5 border-[#E6DEC8] bg-gradient-to-r from-[#FBF9F5] via-[#F4EFE6] to-[#FBF9F5]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center border border-[#C46D53]/20 shrink-0">
              <Mountain size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[#2C221E]">
                  Método Avalanche
                </h2>
                <span className="text-[10px] font-bold bg-[#C46D53]/15 text-[#C46D53] border border-[#C46D53]/25 px-2.5 py-0.5 rounded-full">
                  Maior Juro Primeiro
                </span>
              </div>
              <p className="text-xs text-[#786B5E] mt-0.5">
                Dívidas ordenadas da maior taxa para a menor. Elimine o juro mais caro para economizar mais!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#FBF9F5] border border-[#E6DEC8] px-4 py-2.5 rounded-2xl text-xs shadow-sm">
            <div>
              <p className="text-[10px] text-[#786B5E] font-medium">Dívida Total Ativa</p>
              <p className="font-serif font-black text-[#C46D53] text-sm">
                {formatBRL(totalDebtBalance)}
              </p>
            </div>
            <div className="w-px h-7 bg-[#E6DEC8]" />
            <div>
              <p className="text-[10px] text-[#786B5E] font-medium">Parcelas / Mês</p>
              <p className="font-serif font-black text-[#2C221E] text-sm">
                {formatBRL(totalMonthlyInstallments)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Destaque Alvo nº 1 em Terracota */}
      {targetLoan && (
        <div className="rounded-[28px] p-5 bg-[#C46D53] text-[#FBF9F5] shadow-[0_12px_36px_rgba(196,109,83,0.25)] border border-[#B05B42]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-[#FBF9F5] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                  🎯 Alvo Prioritário de Ataque
                </span>
                <span className="text-xs font-semibold text-[#FBF9F5]">
                  {targetLoan.name} &bull; Taxa {formatPercent(targetLoan.monthlyInterestRate)} a.m.
                </span>
              </div>
              <p className="text-xs text-[#FBF9F5]/90 max-w-xl leading-relaxed">
                Você tem uma sobra projetada de{" "}
                <strong className="text-[#FBF9F5] underline decoration-[#FBF9F5]/40 font-extrabold">
                  {formatBRL(freeWallet.projectedSurplus)}
                </strong>
                . Destine esse valor para amortizar este contrato e economize cerca de{" "}
                <strong className="text-[#FBF9F5] font-extrabold">
                  {formatBRL(estimatedSavingsOnTarget)} em juros futuros
                </strong>
                !
              </p>
            </div>

            <button
              onClick={() => onOpenAmortize(targetLoan.id)}
              className="w-full md:w-auto px-5 py-3 bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#2C221E] font-bold text-xs rounded-full shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shrink-0"
            >
              <Sparkles size={14} className="text-[#C46D53]" />
              Amortizar Alvo nº 1
              <ArrowRight size={14} className="text-[#C46D53]" />
            </button>
          </div>
        </div>
      )}

      {/* Grid de Empréstimos */}
      <div className="space-y-3">
        <h3 className="font-serif text-sm font-bold text-[#2C221E] flex items-center gap-2 px-1">
          <Flame size={16} className="text-[#C46D53]" />
          Fila de Quitação (Taxa de Juros Decrescente)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`organic-card p-5 relative overflow-hidden transition-all flex flex-col justify-between ${
                  isPaidOff
                    ? "border-[#7A8B68]/40 bg-[#E9EFE4]/30 opacity-85"
                    : isTarget
                    ? "border-2 border-[#C46D53] shadow-[0_12px_36px_rgba(196,109,83,0.12)]"
                    : "border-[#E6DEC8]"
                }`}
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isTarget && (
                          <span className="bg-[#C46D53] text-[#FBF9F5] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            #1 ALVO
                          </span>
                        )}
                        {isPaidOff ? (
                          <span className="bg-[#7A8B68] text-[#FBF9F5] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                            QUITADO 🎉
                          </span>
                        ) : (
                          <span className="bg-[#F4EFE6] text-[#786B5E] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#E6DEC8]">
                            Posição #{idx + 1}
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#C46D53]">
                          {formatPercent(loan.monthlyInterestRate)} a.m.
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-base text-[#2C221E] mt-1.5 leading-snug">
                        {loan.name}
                      </h4>
                      <p className="text-[11px] text-[#786B5E]">{loan.bank}</p>
                    </div>
                  </div>

                  {/* Saldo Devedor */}
                  <div className="my-3 p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E6DEC8] space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[11px] text-[#786B5E] font-medium">Saldo Devedor:</span>
                      <span className="font-serif text-lg font-black text-[#2C221E]">
                        {formatBRL(loan.currentBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#786B5E] pt-1 border-t border-[#E6DEC8]/60">
                      <span>Valor Original: {formatBRL(loan.originalAmount)}</span>
                      <span>Vencimento: dia {loan.dueDay}</span>
                    </div>
                  </div>

                  {/* Barra de Progresso de Parcelas */}
                  <div className="space-y-1.5 my-2">
                    <div className="flex justify-between text-[11px] text-[#786B5E]">
                      <span>
                        Parcelas: <strong className="text-[#2C221E]">{loan.paidInstallments}</strong> de{" "}
                        <strong className="text-[#2C221E]">{loan.totalInstallments}</strong>
                      </span>
                      <span className="font-bold text-[#7A8B68]">
                        {progress.toFixed(0)}% pago
                      </span>
                    </div>
                    <div className="w-full bg-[#E6DEC8] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#D99B52] to-[#7A8B68] h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#786B5E]">
                      <span>{remainingInstallments} parcelas restantes</span>
                      <span>Parcela: {formatBRL(loan.currentInstallmentAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                {!isPaidOff && (
                  <div className="grid grid-cols-2 gap-2 pt-3 mt-2 border-t border-[#E6DEC8]">
                    <button
                      onClick={() => handlePayInstallment(loan)}
                      disabled={payingLoanId === loan.id}
                      className="px-3 py-2 rounded-full bg-[#F4EFE6] hover:bg-[#E6DEC8] text-[#2C221E] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#E6DEC8]"
                      title="Registrar pagamento da parcela do mês"
                    >
                      <CheckCircle2 size={13} className="text-[#7A8B68]" />
                      Pagar Parcela
                    </button>

                    <button
                      onClick={() => onOpenAmortize(loan.id)}
                      className={`px-3 py-2 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        isTarget
                          ? "bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5]"
                          : "bg-[#7A8B68] hover:bg-[#657554] text-[#FBF9F5]"
                      }`}
                      title="Adiantar parcelas com abatimento de juros"
                    >
                      <Sparkles size={13} />
                      Amortizar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico de Amortizações */}
      <div className="organic-card p-5 space-y-3.5">
        <h3 className="font-serif text-sm font-bold text-[#2C221E] flex items-center gap-2">
          <History size={16} className="text-[#7A8B68]" />
          Histórico de Amortizações & Descontos Conquistados
        </h3>

        {amortizations.length > 0 ? (
          <div className="space-y-2">
            {amortizations.map((amort) => {
              const loan = sortedLoans.find((l) => l.id === amort.loanId);
              return (
                <div
                  key={amort.id}
                  className="bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2C221E]">
                        {loan?.name || "Empréstimo"}
                      </span>
                      <span className="text-[10px] bg-[#E9EFE4] text-[#556943] border border-[#7A8B68]/30 px-2 py-0.5 rounded-full font-semibold">
                        {amort.abatementType === "REDUCE_TERM"
                          ? `Prazo reduzido em ${amort.installmentsReduced} parcelas`
                          : "Parcela mensal reduzida"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#786B5E]">
                      Realizado em {formatDateBR(amort.date)} &bull; {amort.notes || "Amortização extraordinária"}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 text-xs">
                    <div>
                      <p className="text-[10px] text-[#786B5E]">Valor Pago</p>
                      <p className="font-serif font-black text-[#2C221E]">{formatBRL(amort.amountPaid)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7A8B68] font-semibold">
                        Juros Economizados
                      </p>
                      <p className="font-serif font-black text-[#7A8B68]">
                        +{formatBRL(amort.interestDiscount)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[#786B5E] text-center py-4">
            Nenhuma amortização realizada ainda. Use a sobra do mês para dar o primeiro passo!
          </p>
        )}
      </div>
    </div>
  );
};
