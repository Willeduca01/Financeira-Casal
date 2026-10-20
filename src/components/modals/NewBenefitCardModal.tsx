"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Utensils, ShoppingBag, ShieldCheck } from "lucide-react";
import { BenefitType } from "@/types";

interface NewBenefitCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BENEFIT_COLORS = [
  { name: "Terracota Quente", hex: "#E06D53" },
  { name: "Verde Sálvia", hex: "#7A8B68" },
  { name: "Mostarda Suave", hex: "#D99B52" },
  { name: "Esmeralda", hex: "#5B8A72" },
  { name: "Roxo Caju/Swile", hex: "#8A4F7D" },
  { name: "Azul Petróleo", hex: "#3D6677" },
];

export const NewBenefitCardModal: React.FC<NewBenefitCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, currentUser, addBenefitCard } = useFinance();

  const [name, setName] = useState("");
  const [type, setType] = useState<BenefitType>("VR");
  const [userId, setUserId] = useState(currentUser.id);
  const [currentBalance, setCurrentBalance] = useState("");
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [depositDay, setDepositDay] = useState("1");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [color, setColor] = useState("#E06D53");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedBalance = currentBalance
      ? parseFloat(currentBalance.replace(",", "."))
      : 0;
    const parsedDeposit = monthlyDeposit
      ? parseFloat(monthlyDeposit.replace(",", "."))
      : 0;

    addBenefitCard({
      name: name.trim(),
      type,
      userId,
      currentBalance: isNaN(parsedBalance) ? 0 : parsedBalance,
      monthlyDeposit: isNaN(parsedDeposit) ? 0 : parsedDeposit,
      depositDay: parseInt(depositDay) || 1,
      lastFourDigits: lastFourDigits.slice(-4) || undefined,
      color,
    });

    onClose();
    setName("");
    setCurrentBalance("");
    setMonthlyDeposit("");
    setLastFourDigits("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8DFD1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D99B52] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              {type === "VR" ? <Utensils size={18} /> : <ShoppingBag size={18} />}
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Cadastrar Cartão de Benefício
              </h3>
              <p className="text-xs text-[#786B5E]">
                Vale Refeição (VR) ou Vale Alimentação (VA) individual
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
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setUserId(u.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    userId === u.id
                      ? "border-[#D99B52] bg-[#D99B52]/10 text-[#9E6317]"
                      : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de Benefício */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Tipo de Benefício *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("VR")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === "VR"
                    ? "border-[#C46D53] bg-[#C46D53]/15 text-[#C46D53]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                <Utensils size={15} />
                Vale Refeição (VR)
              </button>
              <button
                type="button"
                onClick={() => setType("VA")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === "VA"
                    ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#5B7052]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                <ShoppingBag size={15} />
                Vale Alimentação (VA)
              </button>
            </div>
          </div>

          {/* Nome do Cartão */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Nome do Cartão / Provedor *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Flash Benefícios, Alelo, Sodexo, Swile..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm focus:outline-hidden focus:border-[#C46D53]"
            />
          </div>

          {/* Saldo Atual e Recarga Mensal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Saldo Atual Disponível (R$)
              </label>
              <input
                type="text"
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                placeholder="Ex: 420,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Recarga Mensal da Empresa (R$)
              </label>
              <input
                type="text"
                value={monthlyDeposit}
                onChange={(e) => setMonthlyDeposit(e.target.value)}
                placeholder="Ex: 650,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Dia da Recarga e Final */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Dia do Mês da Recarga
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={depositDay}
                onChange={(e) => setDepositDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm text-center font-bold focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Final (4 dígitos)
              </label>
              <input
                type="text"
                maxLength={4}
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value)}
                placeholder="Ex: 9120"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm text-center font-mono focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Cores */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Cor Visual do Cartão
            </label>
            <div className="flex flex-wrap gap-2">
              {BENEFIT_COLORS.map((p) => (
                <button
                  type="button"
                  key={p.hex}
                  onClick={() => setColor(p.hex)}
                  title={p.name}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === p.hex ? "scale-125 ring-2 ring-offset-2 ring-[#2C221E]" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8DFD1] text-xs font-bold text-[#786B5E] hover:bg-[#F4EFE6] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#D99B52] hover:bg-[#C2853D] text-[#FBF9F5] text-xs font-bold shadow-md shadow-[#D99B52]/30 transition-transform active:scale-95"
            >
              Salvar Cartão Benefício
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
