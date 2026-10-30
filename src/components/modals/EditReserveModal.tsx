"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Sprout, ShieldCheck, DollarSign, Calendar, Landmark } from "lucide-react";

interface EditReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditReserveModal: React.FC<EditReserveModalProps> = ({ isOpen, onClose }) => {
  const { emergencyFund, emergencyFundMetrics, updateEmergencyFund } = useFinance();

  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [targetMonths, setTargetMonths] = useState<number>(6);
  const [livingCost, setLivingCost] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (emergencyFund) {
      setCurrentAmount(String(emergencyFund.currentAmount || 0));
      setTargetMonths(emergencyFund.targetMonths || 6);
      setLivingCost(
        emergencyFund.monthlyLivingCostCalculated > 0
          ? String(emergencyFund.monthlyLivingCostCalculated)
          : ""
      );
      setNotes(emergencyFund.notes || "");
    }
  }, [emergencyFund, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(currentAmount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount < 0) return;

    const parsedLivingCost = livingCost.trim() ? parseFloat(livingCost.replace(",", ".")) : 0;

    await updateEmergencyFund({
      currentAmount: parsedAmount,
      targetMonths: targetMonths || 6,
      monthlyLivingCostCalculated: !isNaN(parsedLivingCost) && parsedLivingCost > 0 ? parsedLivingCost : 0,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-md shadow-2xl border border-[#E8DFD1] overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7A8B68] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Editar Reserva de Emergência
              </h3>
              <p className="text-xs text-[#786B5E]">
                Ajuste o saldo guardado atual e a meta do casal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#786B5E] hover:text-[#2C221E] hover:bg-[#E8DFD1] rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Saldo Guardado Atual */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Saldo Guardado Atual (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#786B5E]">
                R$
              </span>
              <input
                type="text"
                required
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-black text-lg focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>
            <p className="text-[10px] text-[#786B5E] mt-1">
              Informe o valor que o casal já possui guardado em contas com liquidez diária (CDB, Nubank Caixinhas, Tesouro Selic, etc.).
            </p>
          </div>

          {/* Custo de Vida Mensal Base */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#786B5E] uppercase tracking-wider">
                Custo de Vida Mensal (R$)
              </label>
              {livingCost && (
                <button
                  type="button"
                  onClick={() => setLivingCost("")}
                  className="text-[10px] font-bold text-[#7A8B68] hover:underline"
                >
                  Usar Automático ({emergencyFundMetrics.autoCalculatedLivingCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#786B5E]">
                R$
              </span>
              <input
                type="text"
                value={livingCost}
                onChange={(e) => setLivingCost(e.target.value)}
                placeholder={`Automático (${emergencyFundMetrics.autoCalculatedLivingCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>
            <p className="text-[10px] text-[#786B5E] mt-1">
              Deixe em branco para usar o cálculo automático dinâmico ou informe um valor personalizado.
            </p>
          </div>

          {/* Meta Ideal em Meses */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Meta da Reserva (Meses de Custo de Vida)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { months: 3, label: "3 Meses", desc: "Mínima" },
                { months: 6, label: "6 Meses", desc: "Recomendada" },
                { months: 12, label: "12 Meses", desc: "Independência" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.months}
                  onClick={() => setTargetMonths(item.months)}
                  className={`py-2 px-2.5 rounded-xl border text-xs text-center transition-all ${
                    targetMonths === item.months
                      ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#2C221E] font-black ring-1 ring-[#7A8B68]"
                      : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                  }`}
                >
                  <p className="font-bold">{item.label}</p>
                  <span className="text-[10px] text-[#786B5E] block">{item.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#786B5E] mt-1">
              Meta estimada atual com {targetMonths} meses:{" "}
              <strong>
                {(emergencyFundMetrics.monthlyLivingCost * targetMonths).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </p>
          </div>

          {/* Onde está guardada / Observações */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Onde está guardada / Instituição
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Nubank Caixinhas 100% CDI, Tesouro Selic..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-xs focus:outline-hidden focus:border-[#7A8B68]"
            />
          </div>

          {/* Botões */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6] text-[#786B5E] hover:text-[#2C221E] font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#7A8B68] hover:bg-[#687756] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <ShieldCheck size={16} />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
