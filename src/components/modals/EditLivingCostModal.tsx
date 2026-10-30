"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Calculator, Sparkles, Check, RotateCcw, AlertCircle, TrendingUp } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface EditLivingCostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditLivingCostModal: React.FC<EditLivingCostModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { emergencyFund, emergencyFundMetrics, updateEmergencyFund, expenseStats } = useFinance();

  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [customValue, setCustomValue] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const autoCost = emergencyFundMetrics.autoCalculatedLivingCost || 0;

  useEffect(() => {
    if (isOpen) {
      const isCustom = emergencyFundMetrics.isCustomLivingCost;
      if (isCustom && emergencyFund.monthlyLivingCostCalculated > 0) {
        setMode("custom");
        setCustomValue(String(emergencyFund.monthlyLivingCostCalculated));
      } else {
        setMode("auto");
        setCustomValue(String(autoCost));
      }
    }
  }, [isOpen, emergencyFund, emergencyFundMetrics.isCustomLivingCost, autoCost]);

  if (!isOpen) return null;

  const parsedCustom = parseFloat(customValue.replace(",", "."));
  const currentPreviewCost = mode === "auto" ? autoCost : isNaN(parsedCustom) ? 0 : parsedCustom;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "auto") {
        // Enviar 0 faz o backend/contexto voltar ao cálculo automático
        await updateEmergencyFund({
          monthlyLivingCostCalculated: 0,
        });
      } else {
        const val = parseFloat(customValue.replace(",", "."));
        if (isNaN(val) || val <= 0) {
          alert("Por favor, informe um valor válido maior que zero.");
          setIsSubmitting(false);
          return;
        }
        await updateEmergencyFund({
          monthlyLivingCostCalculated: val,
        });
      }
      onClose();
    } catch (err) {
      console.error("Erro ao salvar custo de vida:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8DFD1] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#7A8B68] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Custo de Vida Mensal
              </h3>
              <p className="text-xs text-[#786B5E]">
                Defina o valor base para as metas da Reserva de Emergência
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

        {/* Formulário com Scroll se necessário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Opções: Automático vs Personalizado */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider">
              Como deseja definir o custo de vida?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Opção Automático */}
              <button
                type="button"
                onClick={() => {
                  setMode("auto");
                  setCustomValue(String(autoCost));
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  mode === "auto"
                    ? "border-[#7A8B68] bg-[#E9EFE4]/60 ring-2 ring-[#7A8B68]/30 shadow-xs"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/40 hover:bg-[#F4EFE6] text-[#786B5E]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#2C221E] flex items-center gap-1.5">
                    <Sparkles size={14} className={mode === "auto" ? "text-[#7A8B68]" : "text-[#786B5E]"} />
                    Cálculo Automático
                  </span>
                  {mode === "auto" && (
                    <span className="w-4 h-4 rounded-full bg-[#7A8B68] text-white flex items-center justify-center text-[10px]">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#786B5E] leading-relaxed">
                  Soma seus gastos fixos e empréstimos mais a média de essenciais.
                </p>
                <p className="font-serif font-black text-sm text-[#2C221E] mt-2">
                  {formatBRL(autoCost)}/mês
                </p>
              </button>

              {/* Opção Personalizado */}
              <button
                type="button"
                onClick={() => {
                  setMode("custom");
                  if (!customValue || customValue === "0") {
                    setCustomValue(String(emergencyFundMetrics.monthlyLivingCost || autoCost));
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  mode === "custom"
                    ? "border-[#7A8B68] bg-[#E9EFE4]/60 ring-2 ring-[#7A8B68]/30 shadow-xs"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/40 hover:bg-[#F4EFE6] text-[#786B5E]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#2C221E] flex items-center gap-1.5">
                    <Calculator size={14} className={mode === "custom" ? "text-[#7A8B68]" : "text-[#786B5E]"} />
                    Personalizado
                  </span>
                  {mode === "custom" && (
                    <span className="w-4 h-4 rounded-full bg-[#7A8B68] text-white flex items-center justify-center text-[10px]">
                      <Check size={10} className="stroke-[3]" />
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#786B5E] leading-relaxed">
                  Defina um valor fixo mensal que o casal estima como necessário.
                </p>
                <p className="font-serif font-black text-sm text-[#7A8B68] mt-2">
                  Definir valor
                </p>
              </button>
            </div>
          </div>

          {/* Campo de Input se Modo Personalizado */}
          {mode === "custom" && (
            <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#E8DFD1] space-y-2 animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider">
                Valor do Custo de Vida Mensal (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#786B5E]">
                  R$
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="Ex: 2500,00"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-white text-[#2C221E] font-black text-lg focus:outline-hidden focus:border-[#7A8B68]"
                />
              </div>
              <p className="text-[11px] text-[#786B5E]">
                Exemplo: se o casal precisa de R$ 2.500,00 para moradia, contas básicas e alimentação, informe esse valor acima.
              </p>
            </div>
          )}

          {/* Detalhamento do Cálculo Automático (se modo automático) */}
          {mode === "auto" && (
            <div className="p-4 rounded-2xl bg-[#F4EFE6]/70 border border-[#E8DFD1] space-y-2 text-xs">
              <span className="font-bold text-[#2C221E] block text-[11px] uppercase tracking-wider">
                Composição do Cálculo Automático:
              </span>
              <div className="space-y-1.5 text-[#786B5E]">
                <div className="flex justify-between">
                  <span>Gastos Fixos + Parcelas de Empréstimo:</span>
                  <strong className="text-[#2C221E]">{formatBRL(expenseStats.totalFixedAndLoans)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Estimativa Variáveis Essenciais:</span>
                  <strong className="text-[#2C221E]">
                    {formatBRL(Math.max(1500, expenseStats.totalVariable * 0.85))}
                  </strong>
                </div>
                <div className="pt-1.5 border-t border-[#E8DFD1] flex justify-between font-bold text-[#2C221E]">
                  <span>Total Automático Sugerido:</span>
                  <span className="text-[#7A8B68] text-sm font-serif font-black">{formatBRL(autoCost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Simulação dos Marcos da Reserva com o Valor Escolhido */}
          <div className="p-4 rounded-2xl bg-[#E9EFE4]/40 border border-[#7A8B68]/30 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#556943]">
              <TrendingUp size={15} />
              <span>Como ficarão as metas com este Custo de Vida:</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/80 p-2.5 rounded-xl border border-[#7A8B68]/20">
                <span className="text-[10px] text-[#786B5E] block font-medium">Marco 1 (3 meses)</span>
                <p className="font-serif font-black text-xs sm:text-sm text-[#2C221E] mt-0.5">
                  {formatBRL(currentPreviewCost * 3)}
                </p>
                <span className="text-[9px] text-[#786B5E] block">Reserva Mínima</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-[#7A8B68]/40 ring-1 ring-[#7A8B68]/20">
                <span className="text-[10px] text-[#556943] block font-bold">Meta Ideal (6 meses)</span>
                <p className="font-serif font-black text-xs sm:text-sm text-[#7A8B68] mt-0.5">
                  {formatBRL(currentPreviewCost * 6)}
                </p>
                <span className="text-[9px] text-[#556943] block font-bold">Recomendada ⭐</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-[#7A8B68]/20">
                <span className="text-[10px] text-[#786B5E] block font-medium">Marco 3 (12 meses)</span>
                <p className="font-serif font-black text-xs sm:text-sm text-[#2C221E] mt-0.5">
                  {formatBRL(currentPreviewCost * 12)}
                </p>
                <span className="text-[9px] text-[#786B5E] block">Independência 🚀</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {emergencyFundMetrics.isCustomLivingCost && (
              <button
                type="button"
                onClick={() => {
                  setMode("auto");
                  setCustomValue(String(autoCost));
                }}
                className="text-xs font-bold text-[#786B5E] hover:text-[#2C221E] flex items-center gap-1 transition-colors"
                title="Voltar ao cálculo dinâmico automático"
              >
                <RotateCcw size={13} />
                Restaurar automático
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6] text-[#786B5E] hover:text-[#2C221E] font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#7A8B68] hover:bg-[#687756] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check size={16} />
                {isSubmitting ? "Salvando..." : "Salvar Custo de Vida"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
