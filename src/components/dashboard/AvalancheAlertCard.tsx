"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatPercent } from "@/lib/utils";
import { Mountain, ArrowRight, Sparkles, Sprout, Flame } from "lucide-react";

interface AvalancheAlertCardProps {
  onOpenAmortize: (loanId?: string) => void;
}

export const AvalancheAlertCard: React.FC<AvalancheAlertCardProps> = ({
  onOpenAmortize,
}) => {
  const { avalanche, freeWallet, loans } = useFinance();
  const { targetLoan, estimatedSavingsOnTarget } = avalanche;

  if (!targetLoan) {
    const hadLoans = loans && loans.length > 0;
    return (
      <div className="rounded-[28px] p-6 bg-[#7A8B68] text-[#FBF9F5] shadow-[0_8px_30px_rgba(122,139,104,0.15)] text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto text-[#FBF9F5]">
          <Sprout size={26} />
        </div>
        <h3 className="font-serif text-lg font-bold text-[#FBF9F5]">
          {hadLoans
            ? "Parabéns! Todas as dívidas foram quitadas!"
            : "Nenhuma dívida ativa cadastrada"}
        </h3>
        <p className="text-xs text-[#FBF9F5]/90 max-w-md mx-auto leading-relaxed">
          {hadLoans
            ? "O casal conquistou a liberdade das dívidas. Agora 100% dos excedentes do Pote Único vão direto para cultivar a Reserva de Emergência e projetos futuros!"
            : "Sem empréstimos ou dívidas ativas registradas no banco. Os excedentes do Pote Único podem ir direto para cultivar a Reserva de Emergência e projetos futuros!"}
        </p>
      </div>
    );
  }

  const remainingInstallments = targetLoan.totalInstallments - targetLoan.paidInstallments;

  return (
    <div className="relative rounded-[28px] p-5 sm:p-6 bg-[#C46D53] text-[#FBF9F5] shadow-[0_12px_36px_rgba(196,109,83,0.25)] border border-[#B05B42] overflow-hidden transition-all">
      {/* Detalhes de Textura Orgânica ao Fundo */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#B05B42]/50 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2.5 flex-1">
          {/* Header do Card com Ícone de Montanha e Badge */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-[#FBF9F5] shadow-inner shrink-0 border border-white/20">
              <Mountain size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-[#FBF9F5] px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  Método Avalanche
                </span>
                <span className="text-[11px] font-semibold text-[#FBF9F5]/90 flex items-center gap-1">
                  <Flame size={12} className="text-[#D99B52]" />
                  Maior taxa: {formatPercent(targetLoan.interestRate ?? targetLoan.monthlyInterestRate ?? 0)} a.m.
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-black text-[#FBF9F5] mt-0.5">
                Alvo: {targetLoan.title || targetLoan.name}
              </h2>
            </div>
          </div>

          {/* Dados Rápidos do Contrato Alvo */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#FBF9F5]/90">
            <span>
              Saldo Devedor: <strong className="text-[#FBF9F5] text-sm font-extrabold">{formatBRL(targetLoan.currentBalance)}</strong>
            </span>
            <span>&bull;</span>
            <span>{remainingInstallments} parcelas de {formatBRL(targetLoan.installmentAmount ?? targetLoan.currentInstallmentAmount ?? 0)}</span>
          </div>

          {/* Dica da Sobra do Mês */}
          <p className="text-xs text-[#FBF9F5]/90 leading-relaxed max-w-xl">
            🌱 <strong className="text-[#FBF9F5] font-extrabold">Estratégia do Pote Único:</strong> Sobra projetada de{" "}
            <span className="font-bold underline decoration-[#FBF9F5]/40 text-[#FBF9F5]">
              {formatBRL(freeWallet.projectedSurplus)}
            </span>
            . Amortize este valor no Alvo nº 1 para economizar aproximadamente{" "}
            <span className="font-bold text-[#FBF9F5] bg-white/20 px-1.5 py-0.5 rounded-md">
              {formatBRL(estimatedSavingsOnTarget)} em juros futuros
            </span>
            !
          </p>
        </div>

        {/* Botão Largo em Pílula */}
        <div className="w-full md:w-auto shrink-0">
          <button
            onClick={() => onOpenAmortize(targetLoan.id)}
            className="w-full md:w-auto rounded-full bg-[#FBF9F5] hover:bg-[#F4EFE6] text-[#2C221E] font-bold py-3.5 px-6 shadow-md transition-all flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 text-xs sm:text-sm group"
          >
            <span>Pagar / Amortizar {targetLoan.institution || targetLoan.bank || targetLoan.title || targetLoan.name}</span>
            <ArrowRight size={16} className="text-[#C46D53] transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
