"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Trash2, CheckCircle2 } from "lucide-react";
import { Expense, ExpenseCategory, PaymentMethod } from "@/types";

interface EditFixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

const FIXED_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "HOUSING", label: "Aluguel / Condomínio" },
  { id: "UTILITIES", label: "Luz / Água / Gás / Internet" },
  { id: "SUBSCRIPTION", label: "Assinaturas & Apps" },
  { id: "HEALTH", label: "Plano de Saúde / Seguro" },
  { id: "TRANSPORT", label: "Seguro Auto / Garagem" },
  { id: "OTHER", label: "Outros Fixos" },
];

export const EditFixedExpenseModal: React.FC<EditFixedExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
}) => {
  const { users, updateExpense, deleteExpense } = useFinance();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("10");
  const [category, setCategory] = useState<ExpenseCategory>("UTILITIES");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("DEBIT_PIX");
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setPaymentMethod(expense.paymentMethod);
      setIsPaid(expense.isPaid);
      setUserId(expense.userId || "");

      if (expense.dueDate) {
        const d = new Date(expense.dueDate);
        setDueDay(String(d.getDate()));
      }
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    let newDueDate = expense.dueDate;
    if (expense.dueDate) {
      const d = new Date(expense.dueDate);
      const dayNumber = Math.max(1, Math.min(31, parseInt(dueDay) || 10));
      d.setDate(dayNumber);
      newDueDate = d.toISOString();
    }

    updateExpense(expense.id, {
      description: description.trim(),
      amount: parsedAmount,
      dueDate: newDueDate,
      category,
      paymentMethod,
      isPaid,
      userId: userId || expense.userId,
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir "${expense.description}"?`)) {
      deleteExpense(expense.id);
      onClose();
    }
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
                Editar Conta Fixa
              </h3>
              <p className="text-xs text-[#786B5E]">
                Altere os valores ou condições da conta recorrente
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-medium text-sm focus:outline-hidden focus:border-[#7A8B68]"
            />
          </div>

          {/* Valor e Dia de Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Valor (R$) *
              </label>
              <input
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#7A8B68]"
              />
            </div>
          </div>

          {/* Status de Pagamento */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Status do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  !isPaid
                    ? "border-[#C46D53] bg-[#C46D53]/15 text-[#C46D53]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  isPaid
                    ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#5B7052]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                Pago
              </button>
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
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={16} />
              Excluir
            </button>
            <div className="flex items-center gap-2">
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
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
