"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Utensils, ShoppingBag, Trash2, Check, Sparkles } from "lucide-react";
import { BenefitCard, BenefitType } from "@/types";

interface EditBenefitCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BenefitCard | null;
}

const BENEFIT_COLORS = [
  { name: "Terracota Quente", hex: "#E06D53" },
  { name: "Verde Sálvia", hex: "#7A8B68" },
  { name: "Mostarda Suave", hex: "#D99B52" },
  { name: "Esmeralda", hex: "#5B8A72" },
  { name: "Roxo Caju/Swile", hex: "#8A4F7D" },
  { name: "Azul Petróleo", hex: "#3D6677" },
  { name: "Terracota Elegante", hex: "#C46D53" },
  { name: "Oliva Escuro", hex: "#4A5D43" },
];

const COMMON_BENEFIT_PROVIDERS = [
  "Pluxee",
  "Caju",
  "Flash",
  "Alelo",
  "Sodexo",
  "Swile",
  "Ticket",
  "VR Benefícios",
];

export const EditBenefitCardModal: React.FC<EditBenefitCardModalProps> = ({
  isOpen,
  onClose,
  card,
}) => {
  const { users, updateBenefitCard, deleteBenefitCard } = useFinance();

  const [name, setName] = useState("");
  const [type, setType] = useState<BenefitType>("VR");
  const [userId, setUserId] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [depositDay, setDepositDay] = useState("1");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [color, setColor] = useState("#E06D53");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (card) {
      setName(card.name || "");
      setType(card.type || "VR");
      setUserId(card.userId || "");
      setCurrentBalance(card.currentBalance !== undefined ? card.currentBalance.toString() : "0");
      setMonthlyDeposit(card.monthlyDeposit !== undefined ? card.monthlyDeposit.toString() : "0");
      setDepositDay(card.depositDay ? card.depositDay.toString() : "1");
      setLastFourDigits(card.lastFourDigits || "");
      setColor(card.color || "#E06D53");
      setShowConfirmDelete(false);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBalance = currentBalance
      ? parseFloat(currentBalance.replace(",", "."))
      : 0;
    const parsedDeposit = monthlyDeposit
      ? parseFloat(monthlyDeposit.replace(",", "."))
      : 0;

    const sanitizedDigits = lastFourDigits.trim().slice(-4);

    updateBenefitCard(card.id, {
      name: name.trim(),
      type,
      userId: userId || card.userId,
      currentBalance: isNaN(parsedBalance) ? 0 : parsedBalance,
      monthlyDeposit: isNaN(parsedDeposit) ? 0 : parsedDeposit,
      depositDay: parseInt(depositDay, 10) || 1,
      lastFourDigits: sanitizedDigits.length === 4 ? sanitizedDigits : undefined,
      color,
    });

    onClose();
  };

  const handleDelete = () => {
    deleteBenefitCard(card.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8DFD1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl text-[#FBF9F5] flex items-center justify-center shadow-xs transition-colors"
              style={{ backgroundColor: color }}
            >
              {type === "VR" ? <Utensils size={18} /> : <ShoppingBag size={18} />}
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Editar Cartão de Benefício
              </h3>
              <p className="text-xs text-[#786B5E]">
                Altere nome, tipo (VR/VA), saldo, titular e regras de recarga
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Titular do Cartão */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Titular do Benefício *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = userId === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUserId(u.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-[#F4EFE6] border-[#7A8B68] text-[#2C221E] shadow-xs"
                        : "bg-white/60 border-[#E8DFD1] text-[#786B5E] hover:bg-[#F4EFE6]/50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#E8DFD1] overflow-hidden flex items-center justify-center text-xs font-bold text-[#2C221E] shrink-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name[0]
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{u.name}</p>
                      <span className="text-[10px] text-[#786B5E] block">
                        {isSelected ? "Selecionado" : "Escolher"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo de Benefício (VR / VA) */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Tipo de Benefício *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("VR")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  type === "VR"
                    ? "bg-[#C46D53]/15 border-[#C46D53] text-[#C46D53]"
                    : "bg-white/60 border-[#E8DFD1] text-[#786B5E] hover:bg-[#F4EFE6]/50"
                }`}
              >
                <Utensils size={15} />
                <span>Vale Refeição (VR)</span>
              </button>
              <button
                type="button"
                onClick={() => setType("VA")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  type === "VA"
                    ? "bg-[#7A8B68]/20 border-[#7A8B68] text-[#5B7052]"
                    : "bg-white/60 border-[#E8DFD1] text-[#786B5E] hover:bg-[#F4EFE6]/50"
                }`}
              >
                <ShoppingBag size={15} />
                <span>Vale Alimentação (VA)</span>
              </button>
            </div>
          </div>

          {/* Nome do Cartão / Provedor */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Nome do Cartão / Provedor *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Pluxee, Caju, Flash, Alelo, Sodexo..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#2C221E] placeholder:text-[#786B5E]/50 focus:outline-hidden focus:border-[#7A8B68] font-medium"
            />
            {/* Sugestões rápidas */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMMON_BENEFIT_PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setName(provider)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#F4EFE6] text-[#786B5E] hover:text-[#2C221E] hover:bg-[#E8DFD1] transition-colors"
                >
                  {provider}
                </button>
              ))}
            </div>
          </div>

          {/* Saldo Atual e Recarga Mensal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Saldo Disponível (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#786B5E]">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#2C221E] font-bold focus:outline-hidden focus:border-[#7A8B68]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Recarga Mensal (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#786B5E]">
                  R$
                </span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#2C221E] font-bold focus:outline-hidden focus:border-[#7A8B68]"
                />
              </div>
            </div>
          </div>

          {/* Dia da Recarga e Final do Cartão */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Dia da Recarga
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={depositDay}
                onChange={(e) => setDepositDay(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#2C221E] font-medium focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Últimos 4 dígitos (opcional)
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="Ex: 9120"
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-3 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm font-mono text-[#2C221E] focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>
          </div>

          {/* Paleta de Cores */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {BENEFIT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.name}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color === c.hex ? "scale-115 ring-2 ring-offset-2 ring-[#2C221E]" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {color === c.hex && <Check size={12} className="text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          {/* Confirmação de Exclusão */}
          {showConfirmDelete ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs">
              <p className="font-bold text-red-800">
                Tem certeza que deseja excluir o cartão &quot;{card.name}&quot;?
              </p>
              <p className="text-red-700">Esta ação não pode ser desfeita.</p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl border border-red-300 bg-white text-red-800 font-bold hover:bg-red-50"
                >
                  Não, manter
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
                >
                  Sim, excluir
                </button>
              </div>
            </div>
          ) : null}

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-[#E8DFD1] flex items-center justify-between gap-3">
            {!showConfirmDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl border border-[#E8DFD1] text-[#786B5E] text-xs font-bold hover:bg-[#F4EFE6] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-[#7A8B68] text-[#FBF9F5] text-xs font-bold hover:bg-[#687856] shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Check size={14} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
