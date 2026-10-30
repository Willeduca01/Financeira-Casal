"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, ArrowDownRight, AlertTriangle } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface WithdrawReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawReserveModal: React.FC<WithdrawReserveModalProps> = ({ isOpen, onClose }) => {
  const { emergencyFund, withdrawEmergencyFund } = useFinance();

  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [registerInWallet, setRegisterInWallet] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentReserveAmount = emergencyFund.currentAmount || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (parsedAmount > currentReserveAmount) {
      alert("O valor de resgate não pode ser maior do que o saldo atual da reserva.");
      return;
    }

    await withdrawEmergencyFund(parsedAmount, notes.trim() || undefined, registerInWallet);
    onClose();
    setAmount("");
    setNotes("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-md shadow-2xl border border-[#E8DFD1] overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D99B52] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <ArrowDownRight size={20} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Resgatar da Reserva
              </h3>
              <p className="text-xs text-[#786B5E]">
                Retirada para despesas ou imprevistos emergenciais
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
          {/* Card com Saldo Disponível */}
          <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E8DFD1] flex items-center justify-between">
            <span className="text-xs text-[#786B5E] font-medium">Saldo Atual na Reserva:</span>
            <span className="font-serif text-base font-black text-[#7A8B68]">
              {formatBRL(currentReserveAmount)}
            </span>
          </div>

          {/* Valor a Resgatar */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Valor a Resgatar (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#786B5E]">
                R$
              </span>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-black text-lg focus:outline-hidden focus:border-[#D99B52]"
              />
            </div>
          </div>

          {/* Motivo do Resgate */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Motivo do Resgate (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Conserto mecânico do carro, Saúde..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-xs focus:outline-hidden focus:border-[#D99B52]"
            />
          </div>

          {/* Checkbox: Entrar na Carteira Livre */}
          <div className="p-3 rounded-xl bg-[#F4EFE6]/70 border border-[#E8DFD1] flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="registerInWalletCheck"
              checked={registerInWallet}
              onChange={(e) => setRegisterInWallet(e.target.checked)}
              className="w-4 h-4 rounded text-[#D99B52] focus:ring-[#D99B52] accent-[#D99B52] cursor-pointer"
            />
            <label htmlFor="registerInWalletCheck" className="text-xs text-[#2C221E] font-bold cursor-pointer select-none">
              Registrar entrada na Carteira Livre (Pote Único)
              <span className="block text-[10px] text-[#786B5E] font-normal">
                Disponibiliza o saldo resgatado na conta corrente do casal para cobrir o gasto.
              </span>
            </label>
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
              className="px-5 py-2.5 rounded-xl bg-[#D99B52] hover:bg-[#C2853F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <ArrowDownRight size={16} />
              Confirmar Resgate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
