"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatDateBR, CATEGORY_DETAILS } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  Plus,
  Target,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const FixedAndReserveView: React.FC = () => {
  const {
    expenses,
    toggleFixedExpensePaid,
    emergencyFundMetrics,
    addEmergencyDeposit,
  } = useFinance();

  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositNotes, setDepositNotes] = useState<string>("");
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);

  // Filtrar apenas despesas fixas ou parcelas de empréstimos
  const fixedList = expenses.filter(
    (exp) => exp.expenseType === "FIXED" || exp.expenseType === "LOAN"
  );

  const totalFixedAmount = fixedList.reduce((sum, e) => sum + e.amount, 0);
  const paidFixedAmount = fixedList
    .filter((e) => e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0);
  const pendingFixedAmount = totalFixedAmount - paidFixedAmount;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount.replace(",", "."));
    if (val > 0) {
      addEmergencyDeposit(val, depositNotes || "Aporte programado");
      setDepositAmount("");
      setDepositNotes("");
      setShowDepositModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. MÓDULO: RESERVA DE EMERGÊNCIA */}
      <div className="glass-panel rounded-2xl p-4 md:p-6 border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                Reserva de Emergência do Casal
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Meta Pós-Dívidas
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Segurança financeira para imprevistos calculada sobre o custo de vida real
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDepositModal(true)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={15} />
            Guardar na Reserva
          </button>
        </div>

        {/* Resumo de Custo de Vida e Saldo Guardado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              Custo de Vida Mensal:
            </span>
            <p className="text-lg font-black text-white mt-0.5">
              {formatBRL(emergencyFundMetrics.monthlyLivingCost)}
            </p>
            <p className="text-[10px] text-slate-500">Fixos + Variáveis essenciais</p>
          </div>

          <div className="bg-slate-950/60 border border-emerald-500/20 p-3 rounded-xl">
            <span className="text-[11px] text-emerald-400 font-semibold">
              Saldo Guardado Atual:
            </span>
            <p className="text-lg font-black text-emerald-400 mt-0.5">
              {formatBRL(emergencyFundMetrics.currentAmount)}
            </p>
            <p className="text-[10px] text-slate-400">
              {emergencyFundMetrics.progressPercent}% da meta ideal de 6 meses
            </p>
          </div>

          <div className="bg-slate-950/60 border border-white/5 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400">Meta Padrão (6 meses):</span>
            <p className="text-lg font-black text-indigo-300 mt-0.5">
              {formatBRL(emergencyFundMetrics.targets.sixMonths)}
            </p>
            <p className="text-[10px] text-slate-500">Tranquilidade total para o casal</p>
          </div>
        </div>

        {/* Termômetro e Marcos de Meses (3, 6, 12 meses) */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="font-semibold text-white">Progresso da Reserva:</span>
            <span className="font-bold text-emerald-400">
              {emergencyFundMetrics.progressPercent}% Concluído
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-white/10 overflow-hidden relative">
            <div
              className="bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, emergencyFundMetrics.progressPercent)}%` }}
            />
          </div>

          {/* Marcos de Metas */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-medium">Marco 1 (3 meses)</span>
              <span className="text-xs font-bold text-white">
                {formatBRL(emergencyFundMetrics.targets.threeMonths)}
              </span>
              <span className="text-[9px] block text-slate-500 mt-0.5">Reserva Mínima</span>
            </div>

            <div className="p-2 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
              <span className="text-[10px] text-indigo-300 block font-bold">Meta Ideal (6 meses)</span>
              <span className="text-xs font-bold text-white">
                {formatBRL(emergencyFundMetrics.targets.sixMonths)}
              </span>
              <span className="text-[9px] block text-emerald-400 mt-0.5 font-medium">Recomendada</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-medium">Marco 3 (12 meses)</span>
              <span className="text-xs font-bold text-white">
                {formatBRL(emergencyFundMetrics.targets.twelveMonths)}
              </span>
              <span className="text-[9px] block text-slate-500 mt-0.5">Independência</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MÓDULO: CHECKLIST DE GASTOS FIXOS DO MÊS */}
      <div className="glass-panel rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              Checklist de Contas Fixas & Parcelas
            </h3>
            <p className="text-xs text-slate-400">
              Marque as contas conforme forem sendo debitadas da Carteira Livre
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-emerald-400 font-semibold">
              Pago: {formatBRL(paidFixedAmount)}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-semibold">
              Pendente: {formatBRL(pendingFixedAmount)}
            </span>
          </div>
        </div>

        {/* Lista de Contas Fixas com Toggle */}
        <div className="space-y-2">
          {fixedList.map((exp) => {
            const cat = CATEGORY_DETAILS[exp.category as keyof typeof CATEGORY_DETAILS];
            return (
              <div
                key={exp.id}
                onClick={() => toggleFixedExpensePaid(exp.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  exp.isPaid
                    ? "bg-emerald-950/15 border-emerald-500/30 opacity-80"
                    : "bg-slate-900/90 border-amber-500/30 hover:border-amber-500/60 shadow-md"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      exp.isPaid
                        ? "bg-emerald-500 text-slate-950"
                        : "border-2 border-slate-500 text-transparent"
                    }`}
                  >
                    <CheckCircle2 size={16} className={exp.isPaid ? "block" : "hidden"} />
                  </div>

                  <div>
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        exp.isPaid ? "text-slate-300 line-through" : "text-white"
                      }`}
                    >
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{cat?.label || "Conta Fixa"}</span>
                      <span>•</span>
                      <span>{exp.paymentMethod === "CREDIT_CARD" ? "Cartão de Crédito" : "Débito / Pix"}</span>
                      {exp.dueDate && <span>• Venc: {formatDateBR(exp.dueDate)}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-bold block ${
                      exp.isPaid ? "text-slate-400" : "text-amber-400"
                    }`}
                  >
                    {formatBRL(exp.amount)}
                  </span>
                  <span
                    className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded ${
                      exp.isPaid
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {exp.isPaid ? "Pago" : "Pendente"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Aporte na Reserva */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-400" />
              Guardar na Reserva de Emergência
            </h3>

            <p className="text-xs text-slate-300">
              Este valor sairá da Carteira Livre (Pote Único) e aumentará o colchão de segurança do casal.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Valor a Guardar (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 500,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Observação / Origem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sobra do mês ou Renda extra"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
