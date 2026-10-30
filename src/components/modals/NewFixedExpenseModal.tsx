"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ExpenseCategory, PaymentMethod } from "@/types";

interface NewFixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIXED_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "HOUSING", label: "Aluguel / Condomínio" },
  { id: "UTILITIES", label: "Luz / Água / Gás / Internet" },
  { id: "SUBSCRIPTION", label: "Assinaturas & Apps" },
  { id: "HEALTH", label: "Plano de Saúde / Seguro" },
  { id: "TRANSPORT", label: "Seguro Auto / Garagem" },
  { id: "OTHER", label: "Outros Fixos" },
];

export const NewFixedExpenseModal: React.FC<NewFixedExpenseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, currentUser, addExpense, selectedMonth, selectedYear } = useFinance();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("10");
  const [category, setCategory] = useState<ExpenseCategory>("UTILITIES");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("DEBIT_PIX");
  const [userId, setUserId] = useState(currentUser?.id || users[0]?.id || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const dayNumber = Math.max(1, Math.min(31, parseInt(dueDay) || 10));
    // Data de vencimento no mês selecionado
    const dueDateObj = new Date(selectedYear, selectedMonth, dayNumber, 12, 0, 0);

    addExpense({
      description: description.trim(),
      amount: parsedAmount,
      date: dueDateObj.toISOString(),
      dueDate: dueDateObj.toISOString(),
      category,
      expenseType: "FIXED",
      paymentMethod,
      isPaid: false, // Começa pendente no checklist
      userId: userId || currentUser.id,
    });

    onClose();
    setDescription("");
    setAmount("");
    setDueDay("10");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8DFD1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#7A8B68] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Nova Conta Fixa
              </h3>
              <p className="text-xs text-[#786B5E]">
                Cadastre despesas recorrentes do casal para o checklist mensal
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
          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Nome da Conta Fixa *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Condomínio, Internet Fibra, Luz Enel..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-medium text-sm focus:outline-hidden focus:border-[#7A8B68]"
            />
          </div>

          {/* Valor e Dia de Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Valor Previsto (R$) *
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 350,00 ou 1800,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Dia de Vencimento (1 a 31) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="Ex: 10"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Responsável pelo Lançamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setUserId(u.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    userId === u.id
                      ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#5B7052]"
                      : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("DEBIT_PIX")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === "DEBIT_PIX"
                    ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#5B7052]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                Débito / Pix / Boleto
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT_CARD")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  paymentMethod === "CREDIT_CARD"
                    ? "border-[#C46D53] bg-[#C46D53]/15 text-[#C46D53]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                Cartão de Crédito
              </button>
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FIXED_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-left truncate ${
                    category === c.id
                      ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#5B7052]"
                      : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
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
              <CheckCircle2 size={16} />
              Adicionar ao Checklist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
