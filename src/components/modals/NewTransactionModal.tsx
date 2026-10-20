"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  ExpenseCategory,
  PaymentMethod,
  ExpenseType,
  IncomeCategory,
  WalletType,
  BenefitType,
} from "@/types";
import { CATEGORY_DETAILS, PAYMENT_METHOD_DETAILS, INCOME_CATEGORY_DETAILS } from "@/lib/utils";
import { X, Sparkles, Check, ArrowDownLeft, ArrowUpRight, Zap } from "lucide-react";

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, users, addExpense, addIncome } = useFinance();

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  // Campos de Despesa
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD_MARKET");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VA");
  const [expenseType, setExpenseType] = useState<ExpenseType>("VARIABLE");
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);

  // Campos de Receita
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeAmountNet, setIncomeAmountNet] = useState("");
  const [incomeAmountGross, setIncomeAmountGross] = useState("");
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>("SALARY");
  const [walletType, setWalletType] = useState<WalletType>("FREE");
  const [benefitType, setBenefitType] = useState<BenefitType | undefined>(undefined);

  if (!isOpen) return null;

  // Atalhos Rápidos para Despesas (Menos de 10 segundos!)
  const applyQuickPreset = (preset: {
    desc: string;
    cat: ExpenseCategory;
    method: PaymentMethod;
  }) => {
    setDescription(preset.desc);
    setCategory(preset.cat);
    setPaymentMethod(preset.method);
    setExpenseType("VARIABLE");
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (parsedAmount > 0 && description.trim()) {
      addExpense({
        description: description.trim(),
        amount: parsedAmount,
        date: new Date().toISOString(),
        category,
        expenseType,
        paymentMethod,
        isPaid: true,
        userId: selectedUserId,
      });
      // Reset form
      setDescription("");
      setAmount("");
      onClose();
    }
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const net = parseFloat(incomeAmountNet.replace(",", "."));
    const gross = incomeAmountGross
      ? parseFloat(incomeAmountGross.replace(",", "."))
      : net;

    if (net > 0 && incomeDescription.trim()) {
      addIncome({
        description: incomeDescription.trim(),
        amountNet: net,
        amountGross: gross,
        category: incomeCategory,
        walletType:
          incomeCategory === "VR" || incomeCategory === "VA" ? "BENEFITS" : "FREE",
        benefitType:
          incomeCategory === "VR" ? "VR" : incomeCategory === "VA" ? "VA" : undefined,
        receivedAt: new Date().toISOString(),
        userId: selectedUserId,
      });
      // Reset form
      setIncomeDescription("");
      setIncomeAmountNet("");
      setIncomeAmountGross("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-white/15 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("expense")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "expense"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ArrowDownLeft size={14} />
              Nova Despesa
            </button>
            <button
              onClick={() => setActiveTab("income")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "income"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ArrowUpRight size={14} />
              Nova Receita
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quem está realizando o gasto / entrada? */}
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Responsável:</span>
          <div className="flex gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUserId(u.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedUserId === u.id
                    ? "bg-indigo-600 text-white ring-2 ring-indigo-400/50"
                    : "text-slate-400 hover:bg-white/5"
                }`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* FORMULÁRIO 1: DESPESA */}
        {activeTab === "expense" ? (
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            {/* Atalhos Rápidos para mobile */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                ⚡ Lançamento Rápido em 1 clique
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    applyQuickPreset({
                      desc: "Mercado Atacadão",
                      cat: "FOOD_MARKET",
                      method: "VA",
                    })
                  }
                  className="p-1.5 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-left border border-white/5 truncate"
                >
                  🛒 Mercado (VA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickPreset({
                      desc: "Mistura / Açougue",
                      cat: "FOOD_PROTEIN",
                      method: "VA",
                    })
                  }
                  className="p-1.5 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-left border border-white/5 truncate"
                >
                  🥩 Mistura (VA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickPreset({
                      desc: "Padaria / Doces",
                      cat: "SWEETS_SNACKS",
                      method: "VR",
                    })
                  }
                  className="p-1.5 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-left border border-white/5 truncate"
                >
                  🥐 Padaria/Doces (VR)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickPreset({
                      desc: "Comer Fora / Restaurante",
                      cat: "EAT_OUT_DELIVERY",
                      method: "VR",
                    })
                  }
                  className="p-1.5 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-left border border-white/5 truncate"
                >
                  🍽️ Comer Fora (VR)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickPreset({
                      desc: "Farmácia",
                      cat: "HEALTH",
                      method: "DEBIT_PIX",
                    })
                  }
                  className="p-1.5 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-left border border-white/5 truncate"
                >
                  💊 Farmácia (Pix)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickPreset({
                      desc: "Combustível",
                      cat: "TRANSPORT",
                      method: "CREDIT_CARD",
                    })
                  }
                  className="p-1.5 text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-left border border-white/5 truncate"
                >
                  ⛽ Combustível (Crédito)
                </button>
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Valor (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xl font-black text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Mercado semanal, açougue, farmácia..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Meio de Pagamento & Carteira */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                Meio de Pagamento (Define a Carteira)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(PAYMENT_METHOD_DETAILS) as PaymentMethod[]).map((method) => {
                  const details = PAYMENT_METHOD_DETAILS[method];
                  const isSelected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 rounded-xl text-left border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-slate-800 border-white/30 text-white shadow-md ring-1 ring-white/20"
                          : "border-white/5 text-slate-400 hover:bg-white/5"
                      }`}
                    >
                      <p className="font-bold">{details.label}</p>
                      <p className="text-[10px] text-slate-500">{details.walletName}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipo: Fixo ou Variável */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo de Despesa</label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="VARIABLE">Variável (Dia a dia)</option>
                  <option value="FIXED">Fixo (Contas mensais)</option>
                  <option value="LOAN">Empréstimo (Parcela)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  {(Object.keys(CATEGORY_DETAILS) as ExpenseCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_DETAILS[cat].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-transform active:scale-95"
            >
              Confirmar Despesa
            </button>
          </form>
        ) : (
          /* FORMULÁRIO 2: RECEITA */
          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Categoria de Receita</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "SALARY" as IncomeCategory, label: "Salário" },
                  { id: "VR" as IncomeCategory, label: "Vale Refeição (VR)" },
                  { id: "VA" as IncomeCategory, label: "Vale Alim. (VA)" },
                  { id: "EXTRA" as IncomeCategory, label: "Renda Extra" },
                  { id: "BONUS" as IncomeCategory, label: "Bônus / PLR" },
                  { id: "OTHER" as IncomeCategory, label: "Outros" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIncomeCategory(item.id)}
                    className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                      incomeCategory === item.id
                        ? "bg-emerald-600/30 border-emerald-500/50 text-emerald-300"
                        : "border-white/5 text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Valor Líquido (R$ - Cai na Carteira)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={incomeAmountNet}
                onChange={(e) => setIncomeAmountNet(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xl font-black text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {incomeCategory === "SALARY" && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Valor Bruto (R$ - Apenas para Histórico/Estatística)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 7500,00"
                  value={incomeAmountGross}
                  onChange={(e) => setIncomeAmountGross(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Salário mensal, freelance, vale refeição..."
                value={incomeDescription}
                onChange={(e) => setIncomeDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
            >
              Confirmar Receita
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
