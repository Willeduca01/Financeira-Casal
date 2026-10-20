"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatPercent } from "@/lib/utils";
import {
  Wallet,
  UtensilsCrossed,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  CreditCard,
  AlertCircle,
} from "lucide-react";

export const SummaryCards: React.FC = () => {
  const {
    freeWallet,
    benefitsWallet,
    creditCard,
    incomeStats,
    expenseStats,
    avalanche,
  } = useFinance();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* CARD 1: Carteira Livre (Pote Único) */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-slate-900/90 to-emerald-950/20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Wallet size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Carteira Livre
              </span>
              <p className="text-[10px] text-emerald-400 font-medium">Pote Único Casal</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Conta Corrente / Pix
          </span>
        </div>

        <div className="my-2">
          <p className="text-2xl font-black text-white tracking-tight">
            {formatBRL(freeWallet.currentBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Disponível após contas pagas
          </p>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Sobra projetada mês:</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <Sparkles size={12} />
            {formatBRL(freeWallet.projectedSurplus)}
          </span>
        </div>
      </div>

      {/* CARD 2: Carteira de Benefícios (VR & VA) */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-slate-900/90 to-amber-950/20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UtensilsCrossed size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Benefícios (VR/VA)
              </span>
              <p className="text-[10px] text-amber-400 font-medium">Uso em Alimentação</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            Cartões
          </span>
        </div>

        <div className="my-2">
          <p className="text-2xl font-black text-white tracking-tight">
            {formatBRL(benefitsWallet.remainingTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Saldo total restante em cartões
          </p>
        </div>

        {/* Barras de Consumo VR e VA */}
        <div className="space-y-1.5 pt-1 text-[10px]">
          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>VR: {formatBRL(benefitsWallet.remainingVR)} rest.</span>
              <span className="text-slate-400">{benefitsWallet.vrUsagePercent.toFixed(0)}% usado</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${benefitsWallet.vrUsagePercent}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>VA: {formatBRL(benefitsWallet.remainingVA)} rest.</span>
              <span className="text-slate-400">{benefitsWallet.vaUsagePercent.toFixed(0)}% usado</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${benefitsWallet.vaUsagePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: Total de Entradas (Líquido vs Bruto & Proporção) */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-slate-900/90 to-indigo-950/20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Entradas do Casal
              </span>
              <p className="text-[10px] text-indigo-400 font-medium">Salários + Renda Extra</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
            Líquido Real
          </span>
        </div>

        <div className="my-2">
          <p className="text-2xl font-black text-white tracking-tight">
            {formatBRL(incomeStats.totalNet)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Bruto nominal: <span className="line-through text-slate-500">{formatBRL(incomeStats.totalGross)}</span>
          </p>
        </div>

        {/* Proporção de Renda */}
        <div className="pt-2 border-t border-white/10 space-y-1">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Lucas ({incomeStats.lucasProportion}%)</span>
            <span>Mariana ({incomeStats.marianaProportion}%)</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 flex overflow-hidden">
            <div
              className="bg-indigo-500 h-full"
              style={{ width: `${incomeStats.lucasProportion}%` }}
              title={`Lucas: ${incomeStats.lucasProportion}%`}
            />
            <div
              className="bg-teal-400 h-full"
              style={{ width: `${incomeStats.marianaProportion}%` }}
              title={`Mariana: ${incomeStats.marianaProportion}%`}
            />
          </div>
        </div>
      </div>

      {/* CARD 4: Comprometimento de Saídas (Fixos + Empréstimos vs Variáveis) */}
      <div className="glass-panel rounded-2xl p-4 relative overflow-hidden border-rose-500/20 bg-gradient-to-br from-slate-900/90 to-rose-950/20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <TrendingDown size={16} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Saídas Totais
              </span>
              <p className="text-[10px] text-rose-400 font-medium">Comprometimento</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
            Mês Atual
          </span>
        </div>

        <div className="my-2">
          <p className="text-2xl font-black text-white tracking-tight">
            {formatBRL(expenseStats.totalGeneral)}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
            <span>Fixos: {formatBRL(expenseStats.totalFixedAndLoans)}</span>
            <span>•</span>
            <span>Var: {formatBRL(expenseStats.totalVariable)}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <CreditCard size={12} className="text-purple-400" />
            Fatura Crédito:
          </span>
          <span className="font-bold text-purple-400">
            {formatBRL(creditCard.totalInvoiceAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};
