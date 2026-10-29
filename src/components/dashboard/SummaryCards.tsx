"use client";

import React, { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL } from "@/lib/utils";
import { TabType } from "@/components/BottomNav";
import {
  Wallet,
  Utensils,
  Sprout,
  Users,
  Info,
  Sparkles,
  CreditCard,
  ArrowRight,
} from "lucide-react";

interface SummaryCardsProps {
  onNavigateTab?: (tab: TabType) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = React.memo(({ onNavigateTab }) => {
  const {
    freeWallet,
    benefitsWallet,
    creditCard,
    incomeStats,
    emergencyFundMetrics,
    users,
    avalanche,
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
      totalMonthlyBenefitDeposit: formatBRL(benefitsWallet.totalMonthlyDeposit),
      emergencyCurrentAmount: formatBRL(emergencyFundMetrics.currentAmount),
      emergencyTargetSixMonths: formatBRL(emergencyFundMetrics.targets.sixMonths),
      emergencyProgressClamped: Math.min(100, emergencyFundMetrics.progressPercent),
      totalNet: formatBRL(incomeStats.totalNet),
      totalGross: formatBRL(incomeStats.totalGross),
      creditCardTotalInvoice: formatBRL(creditCard.totalInvoiceAmount),
      creditCardInstallments: formatBRL(creditCard.monthlyInstallmentsAmount),
      creditCardExpenses: formatBRL(creditCard.expenseInvoiceAmount),
      creditCardTotalLimit: formatBRL(creditCard.totalCreditLimit),
      creditCardAvailableLimit: formatBRL(creditCard.totalAvailableLimit),
      creditCardCommittedLimit: formatBRL(creditCard.totalCommittedLimit),
    }),
    [freeWallet, benefitsWallet, emergencyFundMetrics, incomeStats, creditCard]
  );

  return (
    <div className="space-y-4">
      {/* 1. GRID PRINCIPAL COM OS 4 CARDS DE RESUMO */}
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
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    avalanche.targetLoan ? "bg-[#C46D53]" : "bg-[#7A8B68]"
                  }`}
                />
                {avalanche.targetLoan ? "Foco: Quitar dívidas" : "Foco: Reserva de Emergência"}
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

        {/* CARD 2: Carteira de Benefícios (VR & VA - Sincronizado com os cartões) */}
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

              <button
                type="button"
                onClick={() => onNavigateTab?.("cards")}
                className="text-[10px] font-bold bg-[#D99B52]/15 hover:bg-[#D99B52]/25 text-[#9A6424] px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="Abrir gestão de cartões de benefício"
              >
                <span>Cartões</span>
                <ArrowRight size={10} />
              </button>
            </div>

            <div className="my-2">
              <p className="text-3xl font-extrabold text-[#2C221E] tracking-tight">
                {formatted.remainingTotal}
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#786B5E] mt-1">
                <span>Saldo em cartões</span>
                {benefitsWallet.totalMonthlyDeposit > 0 && (
                  <span
                    className="text-[#9A6424] font-semibold text-[10px] bg-[#D99B52]/10 px-2 py-0.5 rounded-full"
                    title="Soma das recargas mensais cadastradas nos cartões"
                  >
                    +{formatted.totalMonthlyBenefitDeposit}/mês
                  </span>
                )}
              </div>
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
                {incomeStats.totalGross > 0 ? (
                  <>
                    Bruto nominal:{" "}
                    <span className="line-through text-[#786B5E]/60">
                      {formatted.totalGross}
                    </span>
                  </>
                ) : (
                  <span>Nenhuma receita registrada no mês</span>
                )}
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

      {/* 2. CARD COMPLETO DE CARTÕES DE CRÉDITO & PARCELAMENTOS NA VISÃO GERAL */}
      <div className="organic-card p-5 relative overflow-hidden bg-gradient-to-r from-[#FBF9F5] via-[#F8F5EE] to-[#F4EFE6] border border-[#E8DFD1]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Lado Esquerdo: Fatura e Parcelas */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center border border-[#C46D53]/25 shrink-0 mt-0.5">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#786B5E]">
                  Cartões de Crédito & Fatura do Casal
                </span>
                <span className="text-[10px] font-semibold bg-[#E8DFD1] text-[#786B5E] px-2 py-0.5 rounded-full">
                  {creditCard.cardsCount} {creditCard.cardsCount === 1 ? "cartão" : "cartões"}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-black font-serif text-[#2C221E] tracking-tight">
                  {formatted.creditCardTotalInvoice}
                </p>
                <span className="text-[11px] text-[#786B5E] font-medium">fatura estimada no mês</span>
              </div>
              <p className="text-[11px] text-[#786B5E] mt-0.5 flex items-center gap-2">
                <span>{formatted.creditCardInstallments} em parcelas</span>
                <span>•</span>
                <span>{creditCard.installmentsCount} parcelamentos ativos</span>
              </p>
            </div>
          </div>

          {/* Centro: Limite Liberado vs Comprometido */}
          <div className="flex-1 max-w-md w-full px-0 lg:px-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#786B5E]">
                Limite Total: <strong className="text-[#2C221E]">{formatted.creditCardTotalLimit}</strong>
              </span>
              <span className="font-bold text-[#C46D53]">
                {creditCard.usedPercentage}% comprometido
              </span>
            </div>

            <div className="w-full bg-[#E8DFD1] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#C46D53] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, creditCard.usedPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-[#5B7052] font-semibold">
                Liberado: {formatted.creditCardAvailableLimit}
              </span>
              <span className="text-[#C46D53] font-semibold">
                Comprometido: {formatted.creditCardCommittedLimit}
              </span>
            </div>
          </div>

          {/* Lado Direito: Botão para navegar diretamente para a aba de cartões */}
          <div className="shrink-0 pt-2 lg:pt-0">
            <button
              type="button"
              onClick={() => onNavigateTab?.("cards")}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-[#C46D53]/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>Gerenciar Cartões & Benefícios</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
