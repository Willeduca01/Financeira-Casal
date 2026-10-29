"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, CreditCard as CreditCardIcon, Trash2, Check, Sparkles } from "lucide-react";
import { CreditCard } from "@/types";

interface EditCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CreditCard | null;
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

const COMMON_BANKS = [
  "Nubank",
  "Santander",
  "Itaú",
  "Bradesco",
  "Banco do Brasil",
  "C6 Bank",
  "Inter",
  "XP",
  "BTG Pactual",
];

export const EditCreditCardModal: React.FC<EditCreditCardModalProps> = ({
  isOpen,
  onClose,
  card,
}) => {
  const { users, updateCreditCard, deleteCreditCard } = useFinance();

  const [name, setName] = useState("");
  const [bank, setBank] = useState("Santander");
  const [userId, setUserId] = useState("");
  const [totalLimit, setTotalLimit] = useState("");
  const [availableLimit, setAvailableLimit] = useState("");
  const [closingDay, setClosingDay] = useState("3");
  const [dueDay, setDueDay] = useState("10");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [color, setColor] = useState("#CC0000");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (card) {
      setName(card.name || "");
      setBank(card.bank || "Banco");
      setUserId(card.userId || "");
      setTotalLimit(card.totalLimit !== undefined ? card.totalLimit.toString() : "");
      setAvailableLimit(card.availableLimit !== undefined ? card.availableLimit.toString() : "");
      setClosingDay(card.closingDay ? card.closingDay.toString() : "3");
      setDueDay(card.dueDay ? card.dueDay.toString() : "10");
      setLastFourDigits(card.lastFourDigits || "");
      setColor(card.color || "#820AD1");
      setShowConfirmDelete(false);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalLimit) return;

    const parsedTotal = parseFloat(totalLimit.replace(",", "."));
    const parsedAvailable = availableLimit
      ? parseFloat(availableLimit.replace(",", "."))
      : parsedTotal;

    const sanitizedDigits = lastFourDigits.trim().slice(-4);

    updateCreditCard(card.id, {
      name: name.trim(),
      bank: bank.trim() || "Banco",
      userId: userId || card.userId,
      totalLimit: isNaN(parsedTotal) ? 0 : parsedTotal,
      availableLimit: isNaN(parsedAvailable) ? 0 : parsedAvailable,
      closingDay: parseInt(closingDay, 10) || 1,
      dueDay: parseInt(dueDay, 10) || 10,
      lastFourDigits: sanitizedDigits.length === 4 ? sanitizedDigits : undefined,
      color,
    });

    onClose();
  };

  const handleDelete = () => {
    deleteCreditCard(card.id);
    onClose();
  };

  const selectedUser = users.find((u) => u.id === userId);

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
              <CreditCardIcon size={18} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Editar Cartão de Crédito
              </h3>
              <p className="text-xs text-[#786B5E]">
                Atualize limites, datas de fatura, emissor e titular
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
          {/* Preview Realista do Cartão */}
          <div
            className="p-4 rounded-2xl text-white relative overflow-hidden shadow-md transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, #1A1A1A 120%)`,
            }}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-80 block">
                  {bank || "BANCO"}
                </span>
                <h4 className="text-base font-black tracking-tight">{name || "Nome do Cartão"}</h4>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold backdrop-blur-xs">
                {selectedUser?.name || "Casal"}
              </span>
            </div>

            <div className="my-3 flex items-center justify-between relative z-10">
              <div className="w-8 h-5 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-xs flex items-center justify-center">
                <div className="w-5 h-3 border border-amber-700/30 rounded-xs" />
              </div>
              <span className="font-mono text-xs tracking-widest font-semibold opacity-90">
                •••• {lastFourDigits ? lastFourDigits.slice(-4) : "••••"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs relative z-10">
              <div>
                <span className="text-[9px] opacity-75 block">Limite Total</span>
                <span className="font-bold">
                  R$ {totalLimit ? parseFloat(totalLimit.replace(",", ".") || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] opacity-75 block">Limite Liberado</span>
                <span className="font-bold text-emerald-300">
                  R$ {availableLimit ? parseFloat(availableLimit.replace(",", ".") || "0").toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
                </span>
              </div>
            </div>
          </div>

          {/* Titular do Cartão */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Titular do Cartão *
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
                        ? "bg-[#F4EFE6] border-[#C46D53] text-[#2C221E] shadow-xs"
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

          {/* Nome e Banco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Nome do Cartão *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank Roxinho, Santander SX"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#2C221E] font-medium focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Banco Emissor *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Santander, Itaú"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#2C221E] font-medium focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Sugestões de bancos */}
          <div className="flex flex-wrap gap-1.5">
            {COMMON_BANKS.map((bName) => (
              <button
                key={bName}
                type="button"
                onClick={() => setBank(bName)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F4EFE6] text-[#786B5E] hover:text-[#2C221E] hover:bg-[#E8DFD1] transition-colors"
              >
                {bName}
              </button>
            ))}
          </div>

          {/* Limite Total e Limite Liberado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Limite Total (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#786B5E]">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#2C221E] font-bold focus:outline-hidden focus:border-[#C46D53]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
                Limite Liberado Agora (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#786B5E]">
                  R$
                </span>
                <input
                  type="text"
                  required
                  placeholder="0,00"
                  value={availableLimit}
                  onChange={(e) => setAvailableLimit(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#E8DFD1] bg-white text-sm text-[#5B7052] font-black focus:outline-hidden focus:border-[#5B7052]"
                />
              </div>
            </div>
          </div>

          {/* Fechamento, Vencimento e Final */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[#786B5E] uppercase mb-1">
                Fechamento (dia)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E8DFD1] bg-white text-xs text-[#2C221E] font-medium text-center focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#786B5E] uppercase mb-1">
                Vencimento (dia)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E8DFD1] bg-white text-xs text-[#2C221E] font-medium text-center focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#786B5E] uppercase mb-1">
                Final (4 dígitos)
              </label>
              <input
                type="text"
                maxLength={4}
                placeholder="Ex: 8492"
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-2.5 py-2 rounded-xl border border-[#E8DFD1] bg-white text-xs font-mono text-[#2C221E] text-center focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Cores Pré-definidas */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Cor do Cartão
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((c) => (
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
              <p className="text-red-700">
                Todas as compras parceladas vinculadas a este cartão também serão removidas.
              </p>
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
                className="px-5 py-2.5 rounded-2xl bg-[#C46D53] text-[#FBF9F5] text-xs font-bold hover:bg-[#B05B42] shadow-xs flex items-center gap-1.5 transition-colors"
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
