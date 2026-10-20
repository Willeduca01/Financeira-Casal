"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatDateBR, CATEGORY_DETAILS } from "@/lib/utils";
import {
  Sprout,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Sparkles,
  Calendar,
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
      {/* 1. MÓDULO: RESERVA DE EMERGÊNCIA (CULTIVO DA PLANTINHA) */}
      <div className="organic-card p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E9EFE4] text-[#7A8B68] flex items-center justify-center border border-[#7A8B68]/30 shrink-0">
              <Sprout size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg md:text-xl font-bold text-[#2C221E]">
                  Reserva de Emergência do Casal
                </h2>
                <span className="text-[10px] font-bold bg-[#E9EFE4] text-[#556943] border border-[#7A8B68]/30 px-2.5 py-0.5 rounded-full">
                  Colchão de Paz
                </span>
              </div>
              <p className="text-xs text-[#786B5E] mt-0.5">
                Segurança financeira para imprevistos calculada sobre o custo de vida real
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDepositModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-[#7A8B68] hover:bg-[#657554] text-[#FBF9F5] font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <Plus size={16} strokeWidth={3} />
            Guardar na Reserva
          </button>
        </div>

        {/* Resumo de Custo de Vida e Saldo Guardado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-[#F4EFE6] border border-[#E6DEC8] p-4 rounded-2xl">
            <span className="text-[11px] text-[#786B5E] font-medium block">
              Custo de Vida Mensal:
            </span>
            <p className="font-serif text-xl font-black text-[#2C221E] mt-0.5">
              {formatBRL(emergencyFundMetrics.monthlyLivingCost)}
            </p>
            <p className="text-[10px] text-[#786B5E] mt-0.5">Fixos + Variáveis essenciais</p>
          </div>

          <div className="bg-[#E9EFE4]/60 border border-[#7A8B68]/30 p-4 rounded-2xl">
            <span className="text-[11px] text-[#556943] font-bold block">
              Saldo Guardado Atual:
            </span>
            <p className="font-serif text-xl font-black text-[#7A8B68] mt-0.5">
              {formatBRL(emergencyFundMetrics.currentAmount)}
            </p>
            <p className="text-[10px] text-[#786B5E] mt-0.5">
              {emergencyFundMetrics.progressPercent}% da meta ideal de 6 meses
            </p>
          </div>

          <div className="bg-[#F4EFE6] border border-[#E6DEC8] p-4 rounded-2xl">
            <span className="text-[11px] text-[#786B5E] font-medium block">
              Meta Ideal (6 meses):
            </span>
            <p className="font-serif text-xl font-black text-[#2C221E] mt-0.5">
              {formatBRL(emergencyFundMetrics.targets.sixMonths)}
            </p>
            <p className="text-[10px] text-[#786B5E] mt-0.5">Tranquilidade e blindagem total</p>
          </div>
        </div>

        {/* Barra de Progresso da Plantinha e Marcos */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs text-[#786B5E]">
            <span className="font-semibold text-[#2C221E]">Progresso da plantinha / reserva:</span>
            <span className="font-bold text-[#7A8B68]">
              {emergencyFundMetrics.progressPercent}% Concluído
            </span>
          </div>

          <div className="w-full bg-[#E6DEC8] rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-[#D99B52] to-[#7A8B68] h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, emergencyFundMetrics.progressPercent)}%` }}
            />
          </div>

          {/* Marcos de Metas em Cards Aconchegantes */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
            <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E6DEC8]">
              <span className="text-[10px] text-[#786B5E] block font-semibold">Marco 1 (3 meses)</span>
              <span className="text-xs font-bold text-[#2C221E] font-serif block mt-0.5">
                {formatBRL(emergencyFundMetrics.targets.threeMonths)}
              </span>
              <span className="text-[9px] block text-[#786B5E] mt-0.5">Reserva Mínima</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#E9EFE4] border border-[#7A8B68]/30 shadow-sm">
              <span className="text-[10px] text-[#556943] block font-bold">Meta Ideal (6 meses)</span>
              <span className="text-xs font-bold text-[#2C221E] font-serif block mt-0.5">
                {formatBRL(emergencyFundMetrics.targets.sixMonths)}
              </span>
              <span className="text-[9px] block text-[#7A8B68] mt-0.5 font-bold">Recomendada</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#E6DEC8]">
              <span className="text-[10px] text-[#786B5E] block font-semibold">Marco 3 (12 meses)</span>
              <span className="text-xs font-bold text-[#2C221E] font-serif block mt-0.5">
                {formatBRL(emergencyFundMetrics.targets.twelveMonths)}
              </span>
              <span className="text-[9px] block text-[#786B5E] mt-0.5">Independência</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MÓDULO: CHECKLIST DE GASTOS FIXOS DO MÊS */}
      <div className="organic-card p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#2C221E] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#7A8B68]" />
              Checklist de Contas Fixas & Parcelas
            </h3>
            <p className="text-xs text-[#786B5E]">
              Marque as contas conforme forem sendo debitadas da Carteira Livre
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#F4EFE6] border border-[#E6DEC8] px-3.5 py-1.5 rounded-full text-xs">
            <span className="text-[#7A8B68] font-bold">
              Pago: {formatBRL(paidFixedAmount)}
            </span>
            <span className="text-[#786B5E]/40">&bull;</span>
            <span className="text-[#C46D53] font-bold">
              Pendente: {formatBRL(pendingFixedAmount)}
            </span>
          </div>
        </div>

        {/* Lista de Contas com Visual Papel Artesanal */}
        <div className="space-y-2.5">
          {fixedList.map((exp) => {
            const cat = CATEGORY_DETAILS[exp.category as keyof typeof CATEGORY_DETAILS];
            return (
              <div
                key={exp.id}
                onClick={() => toggleFixedExpensePaid(exp.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  exp.isPaid
                    ? "bg-[#E9EFE4]/35 border-[#7A8B68]/30 opacity-80"
                    : "bg-[#FBF9F5] border-[#E6DEC8] hover:border-[#C46D53]/60 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      exp.isPaid
                        ? "bg-[#7A8B68] text-[#FBF9F5]"
                        : "border-2 border-[#786B5E]/50 text-transparent"
                    }`}
                  >
                    <CheckCircle2 size={15} className={exp.isPaid ? "block" : "hidden"} />
                  </div>

                  <div>
                    <p
                      className={`text-sm font-bold leading-snug ${
                        exp.isPaid ? "text-[#786B5E] line-through" : "text-[#2C221E]"
                      }`}
                    >
                      {exp.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-[#786B5E] mt-0.5">
                      <span>{cat?.label || "Conta Fixa"}</span>
                      <span>&bull;</span>
                      <span>{exp.paymentMethod === "CREDIT_CARD" ? "Cartão de Crédito" : "Débito / Pix"}</span>
                      {exp.dueDate && <span>&bull; Venc: {formatDateBR(exp.dueDate)}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-serif font-black block ${
                      exp.isPaid ? "text-[#786B5E]" : "text-[#C46D53]"
                    }`}
                  >
                    {formatBRL(exp.amount)}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      exp.isPaid
                        ? "bg-[#E9EFE4] text-[#556943]"
                        : "bg-[#FCECE8] text-[#B05B42]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl text-[#2C221E] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E9EFE4] text-[#7A8B68] flex items-center justify-center">
                <Sprout size={22} />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C221E]">
                  Guardar na Reserva
                </h3>
                <p className="text-[11px] text-[#786B5E]">Cultivando a segurança do casal</p>
              </div>
            </div>

            <p className="text-xs text-[#786B5E] leading-relaxed">
              Este valor sairá da Carteira Livre (Pote Único) e aumentará a plantinha / colchão de emergência do casal.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#786B5E] block mb-1">
                  Valor a Guardar (R$)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 500,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-4 py-2.5 text-base font-serif font-bold text-[#2C221E] focus:outline-none focus:border-[#7A8B68]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#786B5E] block mb-1">
                  Observação / Origem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sobra do mês ou Renda extra"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2 text-xs text-[#2C221E] focus:outline-none focus:border-[#7A8B68]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#F4EFE6] text-[#786B5E] hover:bg-[#E6DEC8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#7A8B68] hover:bg-[#657554] text-[#FBF9F5] shadow-md transition-all"
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
