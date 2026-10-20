"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatPercent } from "@/lib/utils";
import { Zap, ArrowRight, ShieldAlert, Sparkles, TrendingUp, DollarSign } from "lucide-react";

interface AvalancheAlertCardProps {
  onOpenAmortize: (loanId?: string) => void;
}

export const AvalancheAlertCard: React.FC<AvalancheAlertCardProps> = ({
  onOpenAmortize,
}) => {
  const { avalanche, freeWallet } = useFinance();
  const { targetLoan, suggestedAmortizationAmount, estimatedSavingsOnTarget } = avalanche;

  if (!targetLoan) {
    return (
      <div className="glass-panel rounded-2xl p-5 border-emerald-500/30 bg-emerald-950/20 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
          🎉
        </div>
        <h3 className="text-base font-bold text-white">Parabéns! Todas as dívidas foram quitadas!</h3>
        <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
          O casal completou a jornada de quitação. Agora 100% dos excedentes do Pote Único vão
          direto para acelerar a Reserva de Emergência e investimentos!
        </p>
      </div>
    );
  }

  const remainingInstallments = targetLoan.totalInstallments - targetLoan.paidInstallments;

  return (
    <div className="relative rounded-2xl p-4 md:p-5 glass-panel avalanche-glow overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-2 border-amber-500/60 shadow-xl">
      {/* Background Glow Decors */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 bg-amber-500 text-slate-950 font-black text-[10px] md:text-xs uppercase px-2.5 py-0.5 rounded-full shadow-md shadow-amber-500/30 tracking-wider">
              <Zap size={13} className="fill-slate-950" />
              Alvo de Ataque nº 1 • Método Avalanche
            </span>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Taxa Mais Alta: {formatPercent(targetLoan.monthlyInterestRate)} a.m.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 pt-1">
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
              {targetLoan.name} ({targetLoan.bank})
            </h3>
            <p className="text-xs text-slate-300">
              Saldo Restante: <span className="font-bold text-amber-400">{formatBRL(targetLoan.currentBalance)}</span> ({remainingInstallments} parcelas restantes)
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            💡 <strong className="text-white">Estratégia do Mês:</strong> Você tem uma sobra projetada no Pote Único de{" "}
            <span className="font-bold text-emerald-400">
              {formatBRL(freeWallet.projectedSurplus)}
            </span>
            . Se amortizar este excedente no Alvo nº 1, você pode economizar aproximadamente{" "}
            <span className="font-bold text-emerald-300 underline">
              {formatBRL(estimatedSavingsOnTarget)} em juros futuros
            </span>
            !
          </p>
        </div>

        {/* Botão de Ação */}
        <div className="w-full md:w-auto flex md:flex-col items-center gap-2">
          <button
            onClick={() => onOpenAmortize(targetLoan.id)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Zap size={16} className="fill-slate-950" />
            Amortizar Alvo Agora
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
