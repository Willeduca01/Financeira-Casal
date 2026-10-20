"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, CreditCard, ShieldCheck } from "lucide-react";

interface NewCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: "Nubank Roxo", hex: "#820AD1" },
  { name: "Santander Vermelho", hex: "#CC0000" },
  { name: "Itaú Laranja", hex: "#EC7000" },
  { name: "Banco do Brasil Azul", hex: "#003882" },
  { name: "C6 Preto Carbon", hex: "#1F1F1F" },
  { name: "Inter Laranja", hex: "#FF7A00" },
  { name: "Sálvia Nobre", hex: "#5B7052" },
  { name: "Terracota Elegante", hex: "#C46D53" },
];

export const NewCreditCardModal: React.FC<NewCreditCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, currentUser, addCreditCard } = useFinance();

  const [name, setName] = useState("");
  const [bank, setBank] = useState("Santander");
  const [userId, setUserId] = useState(currentUser.id);
  const [totalLimit, setTotalLimit] = useState("");
  const [availableLimit, setAvailableLimit] = useState("");
  const [closingDay, setClosingDay] = useState("3");
  const [dueDay, setDueDay] = useState("10");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [color, setColor] = useState("#CC0000");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalLimit) return;

    const parsedTotal = parseFloat(totalLimit.replace(",", "."));
    const parsedAvailable = availableLimit
      ? parseFloat(availableLimit.replace(",", "."))
      : parsedTotal;

    addCreditCard({
      name: name.trim(),
      bank: bank.trim() || "Banco",
      userId,
      totalLimit: parsedTotal,
      availableLimit: parsedAvailable,
      closingDay: parseInt(closingDay) || 1,
      dueDay: parseInt(dueDay) || 10,
      lastFourDigits: lastFourDigits.slice(-4) || undefined,
      color,
    });

    onClose();
    setName("");
    setTotalLimit("");
    setAvailableLimit("");
    setLastFourDigits("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8DFD1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Cadastrar Cartão de Crédito
              </h3>
              <p className="text-xs text-[#786B5E]">
                Defina o limite máximo, limite liberado e titular
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
              Titular do Cartão
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setUserId(u.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    userId === u.id
                      ? "border-[#C46D53] bg-[#C46D53]/10 text-[#C46D53]"
                      : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {/* Nome e Banco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Nome do Cartão *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Santander SX, Nubank..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Instituição / Banco
              </label>
              <input
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Ex: Santander, Nubank, Itaú"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Limite Máximo e Limite Liberado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Limite Total / Máximo (R$) *
              </label>
              <input
                type="text"
                required
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
                placeholder="Ex: 2000,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Limite Liberado Inicial (R$)
              </label>
              <input
                type="text"
                value={availableLimit}
                onChange={(e) => setAvailableLimit(e.target.value)}
                placeholder="Ex: 500,00 (ou mesmo do total)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Dias de Fechamento e Vencimento */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Fechamento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm text-center font-bold focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
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
                placeholder="8492"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm text-center font-mono focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Cor Visual do Cartão */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Cor / Tema do Cartão
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => (
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
              className="px-5 py-2.5 rounded-xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] text-xs font-bold shadow-md shadow-[#C46D53]/30 transition-transform active:scale-95"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
