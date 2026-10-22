"use client";

import React, { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL } from "@/lib/utils";
import {
  Wallet,
  Utensils,
  Sprout,
  Users,
  Info,
  Sparkles,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

export const SummaryCards: React.FC = React.memo(() => {
  const {
    freeWallet,
    benefitsWallet,
    creditCard,
    incomeStats,
    expenseStats,
    emergencyFundMetrics,
    users,
  } = useFinance();

  const partner1Name = users[0]?.name ? users[0].name.split(" ")[0] : "Parceiro 1";
  const partner2Name = users[1]?.name ? users[1].name.split(" ")[0] : "Parceiro 2";

  const formatted = useMemo(
    () => ({
      currentBalance: formatBRL(freeWallet.currentBalance),
      projectedSurplus: formatBRL(freeWallet.projectedSurplus),
      remainingTotal: formatBRL(benefitsWallet.remainingTotal),
      remainingVR: formatBRL(benefitsWallet.remainingVR),
      remainingVA: formatBRL(benefitsWallet.remainingVA),
      vrUsagePercent: benefitsWallet.vrUsagePercent.toFixed(0),
      vaUsagePercent: benefitsWallet.vaUsagePercent.toFixed(0),
      emergencyCurrentAmount: formatBRL(emergencyFundMetrics.currentAmount),
      emergencyTargetSixMonths: formatBRL(emergencyFundMetrics.targets.sixMonths),
      emergencyProgressClamped: Math.min(100, emergencyFundMetrics.progressPercent),
      totalNet: formatBRL(incomeStats.totalNet),
      totalGross: formatBRL(incomeStats.totalGross),
    }),
    [freeWallet, benefitsWallet, emergencyFundMetrics, incomeStats]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Pote Único / Saldo Livre (Destaque Papel Artesanal) */}
      <div className="organic-card p-5 relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center border border-[#C46D53]/20">
                <Wallet size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E]">
                  Pote Único
                </span>
                <p className="text-[10px] text-[#C46D53] font-semibold">Carteira Livre (Pix/Débito)</p>
              </div>
            </div>

            <div className="group relative">
              <button
                className="text-[#786B5E]/60 hover:text-[#2C221E] transition-colors p-1"
                title="Saldo disponível após pagamento de contas do mês"
                aria-label="Informações sobre o pote único"
              >
                <Info size={15} />
              </button>
            </div>
          </div>

          <div className="my-2">
            <p className="text-3xl font-extrabold text-[#2C221E] tracking-tight">
              {formatted.currentBalance}
            </p>
            <p className="text-[11px] font-medium text-[#786B5E] mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C46D53]" />
              Foco: Quitar dívidas
            </p>
          </div>
        </div>

        <div className="pt-3 mt-2 border-t border-[#E6DEC8] flex items-center justify-between text-xs">
          <span className="text-[#786B5E]">Sobra projetada mês:</span>
          <span className="font-bold text-[#C46D53] bg-[#C46D53]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles size={11} />
            {formatted.projectedSurplus}
          </span>
        </div>
      </div>

      {/* CARD 2: Carteira de Benefícios (VR & VA) */}
      <div className="organic-card p-5 relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#D99B52]/15 text-[#D99B52] flex items-center justify-center border border-[#D99B52]/20">
                <Utensils size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E]">
                  Alimentação
                </span>
                <p className="text-[10px] text-[#D99B52] font-semibold">Carteira VR & VA</p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-[#D99B52]/15 text-[#9A6424] px-2 py-0.5 rounded-full">
              Cartões
            </span>
          </div>

          <div className="my-2">
            <p className="text-3xl font-extrabold text-[#2C221E] tracking-tight">
              {formatted.remainingTotal}
            </p>
            <p className="text-[11px] text-[#786B5E] mt-1">
              Saldo total restante nos cartões
            </p>
          </div>
        </div>

        {/* Barras de Consumo de VR e VA */}
        <div className="space-y-2 pt-2 border-t border-[#E6DEC8]">
          <div>
            <div className="flex justify-between text-[10px] text-[#786B5E] font-medium mb-1">
              <span>VR: <strong className="text-[#2C221E]">{formatted.remainingVR}</strong></span>
              <span>{formatted.vrUsagePercent}% usado</span>
            </div>
            <div className="w-full bg-[#E6DEC8] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#D99B52] h-full rounded-full transition-all duration-500"
                style={{ width: `${benefitsWallet.vrUsagePercent}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#786B5E] font-medium mb-1">
              <span>VA: <strong className="text-[#2C221E]">{formatted.remainingVA}</strong></span>
              <span>{formatted.vaUsagePercent}% usado</span>
            </div>
            <div className="w-full bg-[#E6DEC8] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#C2956E] h-full rounded-full transition-all duration-500"
                style={{ width: `${benefitsWallet.vaUsagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Reserva de Emergência (com Ícone de Plantinha/Broto Sprout) */}
      <div className="organic-card p-5 relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#E9EFE4] text-[#7A8B68] flex items-center justify-center border border-[#7A8B68]/30">
                <Sprout size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E]">
                  Reserva Casal
                </span>
                <p className="text-[10px] text-[#7A8B68] font-semibold">Colchão de Paz</p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-[#E9EFE4] text-[#556943] px-2 py-0.5 rounded-full">
              Meta 6 meses
            </span>
          </div>

          <div className="my-2">
            <p className="text-3xl font-extrabold text-[#2C221E] tracking-tight">
              {formatted.emergencyCurrentAmount}
            </p>
            <p className="text-[11px] text-[#786B5E] mt-1">
              Meta ideal: {formatted.emergencyTargetSixMonths}
            </p>
          </div>
        </div>

        {/* Barra de Progresso da Plantinha */}
        <div className="pt-3 mt-2 border-t border-[#E6DEC8] space-y-1.5">
          <div className="flex justify-between text-[11px] text-[#786B5E]">
            <span className="font-medium">Progresso da plantinha / reserva:</span>
            <span className="font-bold text-[#7A8B68]">{emergencyFundMetrics.progressPercent}%</span>
          </div>
          <div className="w-full bg-[#E6DEC8] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#7A8B68] h-full rounded-full transition-all duration-700"
              style={{ width: `${formatted.emergencyProgressClamped}%` }}
            />
          </div>
        </div>
      </div>

      {/* CARD 4: Rendas do Casal & Divisão Proporcional */}
      <div className="organic-card p-5 relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#8C6D53]/15 text-[#8C6D53] flex items-center justify-center border border-[#8C6D53]/20">
                <Users size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E]">
                  Entradas Conjuntas
                </span>
                <p className="text-[10px] text-[#8C6D53] font-semibold">Salários + Extras</p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-[#8C6D53]/15 text-[#5D4734] px-2 py-0.5 rounded-full">
              Líquido Real
            </span>
          </div>

          <div className="my-2">
            <p className="text-3xl font-extrabold text-[#2C221E] tracking-tight">
              {formatted.totalNet}
            </p>
            <p className="text-[11px] text-[#786B5E] mt-1">
              Bruto nominal: <span className="line-through text-[#786B5E]/60">{formatted.totalGross}</span>
            </p>
          </div>
        </div>

        {/* Proporções Salariais */}
        <div className="pt-3 mt-2 border-t border-[#E6DEC8] space-y-1.5">
          <div className="flex justify-between text-[11px] text-[#786B5E]">
            <span>{partner1Name} ({incomeStats.lucasProportion}%)</span>
            <span>{partner2Name} ({incomeStats.marianaProportion}%)</span>
          </div>
          <div className="w-full bg-[#E6DEC8] rounded-full h-2 flex overflow-hidden">
            <div
              className="bg-[#7A8B68] h-full transition-all"
              style={{ width: `${incomeStats.lucasProportion}%` }}
              title={`${partner1Name}: ${incomeStats.lucasProportion}%`}
            />
            <div
              className="bg-[#C46D53] h-full transition-all"
              style={{ width: `${incomeStats.marianaProportion}%` }}
              title={`${partner2Name}: ${incomeStats.marianaProportion}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
