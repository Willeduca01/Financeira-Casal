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
  const { currentUser, users, addExpense, addIncome, creditCards, benefitCards } = useFinance();

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  // Campos de Despesa
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("FOOD_MARKET");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("VA");
  const [expenseType, setExpenseType] = useState<ExpenseType>("VARIABLE");
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const [selectedCardId, setSelectedCardId] = useState<string>("");

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
        creditCardId: paymentMethod === "CREDIT_CARD" ? selectedCardId || undefined : undefined,
      });
      // Reset form
      setDescription("");
      setAmount("");
      setSelectedCardId("");
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-t-[32px] sm:rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-[0_16px_50px_rgb(61,44,30,0.18)] animate-in slide-in-from-bottom duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("expense")}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "expense"
                  ? "bg-[#C46D53] text-[#FBF9F5] shadow-sm shadow-[#C46D53]/30"
                  : "text-[#786B5E] hover:text-[#2C221E] hover:bg-[#F4EFE6]"
              }`}
            >
              <ArrowDownLeft size={14} />
              Nova Despesa
            </button>
            <button
              onClick={() => setActiveTab("income")}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "income"
                  ? "bg-[#7A8B68] text-[#FBF9F5] shadow-sm shadow-[#7A8B68]/30"
                  : "text-[#786B5E] hover:text-[#2C221E] hover:bg-[#F4EFE6]"
              }`}
            >
              <ArrowUpRight size={14} />
              Nova Receita
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#786B5E] hover:text-[#2C221E] rounded-xl hover:bg-[#F4EFE6] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quem está realizando o gasto / entrada? */}
        <div className="bg-[#F4EFE6] p-2.5 rounded-2xl border border-[#E6DEC8] flex items-center justify-between">
          <span className="text-xs text-[#786B5E] font-medium">Responsável:</span>
          <div className="flex gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUserId(u.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedUserId === u.id
                    ? "bg-[#C46D53] text-[#FBF9F5] shadow-sm ring-2 ring-[#C46D53]/30"
                    : "text-[#786B5E] hover:bg-[#E6DEC8]/50"
                }`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-4 h-4 rounded-full object-cover border border-[#FBF9F5]"
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
              <p className="text-[11px] font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
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
                  className="p-2 text-[11px] bg-[#F4EFE6] hover:bg-[#E6DEC8]/70 text-[#2C221E] rounded-xl text-left border border-[#E6DEC8] truncate font-medium transition-colors"
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
                  className="p-2 text-[11px] bg-[#F4EFE6] hover:bg-[#E6DEC8]/70 text-[#2C221E] rounded-xl text-left border border-[#E6DEC8] truncate font-medium transition-colors"
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
                  className="p-2 text-[11px] bg-[#F4EFE6] hover:bg-[#E6DEC8]/70 text-[#2C221E] rounded-xl text-left border border-[#E6DEC8] truncate font-medium transition-colors"
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
                  className="p-2 text-[11px] bg-[#F4EFE6] hover:bg-[#E6DEC8]/70 text-[#2C221E] rounded-xl text-left border border-[#E6DEC8] truncate font-medium transition-colors"
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
                  className="p-2 text-[11px] bg-[#F4EFE6] hover:bg-[#E6DEC8]/70 text-[#2C221E] rounded-xl text-left border border-[#E6DEC8] truncate font-medium transition-colors"
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
                  className="p-2 text-[11px] bg-[#F4EFE6] hover:bg-[#E6DEC8]/70 text-[#2C221E] rounded-xl text-left border border-[#E6DEC8] truncate font-medium transition-colors"
                >
                  ⛽ Combustível (Crédito)
                </button>
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1">Valor (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-4 py-2.5 text-2xl font-black text-[#2C221E] placeholder-[#786B5E]/40 focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Mercado semanal, açougue, farmácia..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2.5 text-xs text-[#2C221E] placeholder-[#786B5E]/50 focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
              />
            </div>

            {/* Meio de Pagamento & Carteira */}
            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1.5">
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
                      className={`p-2.5 rounded-2xl text-left border text-xs transition-all ${
                        isSelected
                          ? "bg-[#C46D53]/12 border-[#C46D53] text-[#2C221E] shadow-sm ring-1 ring-[#C46D53]"
                          : "bg-[#F4EFE6] border-[#E6DEC8] text-[#786B5E] hover:bg-[#E6DEC8]/50"
                      }`}
                    >
                      <p className="font-bold text-[#2C221E]">{details.label}</p>
                      <p className="text-[10px] text-[#786B5E]">{details.walletName}</p>
                    </button>
                  );
                })}
              </div>

              {/* Seletor dinâmico de Cartão de Crédito se o método for Cartão */}
              {paymentMethod === "CREDIT_CARD" && creditCards.length > 0 && (
                <div className="mt-2.5 bg-[#C46D53]/10 border border-[#C46D53]/25 p-2.5 rounded-2xl animate-in fade-in duration-150">
                  <label className="text-[11px] text-[#2C221E] font-bold block mb-1">
                    Vincular ao Cartão de Crédito:
                  </label>
                  <select
                    value={selectedCardId}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full bg-[#FBF9F5] border border-[#E6DEC8] rounded-xl px-3 py-2 text-xs font-bold text-[#2C221E] focus:outline-hidden"
                  >
                    <option value="">Selecione o cartão...</option>
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.bank}) &bull; Limite Liberado: R$ {c.availableLimit.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Tipo: Fixo ou Variável */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#786B5E] font-medium block mb-1">Tipo de Despesa</label>
                <select
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
                  className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3 py-2.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
                >
                  <option value="VARIABLE">Variável (Dia a dia)</option>
                  <option value="FIXED">Fixo (Contas mensais)</option>
                  <option value="LOAN">Empréstimo (Parcela)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#786B5E] font-medium block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3 py-2.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
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
              className="w-full py-3.5 rounded-full bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] font-bold text-sm shadow-md shadow-[#C46D53]/25 transition-transform active:scale-[0.98]"
            >
              Confirmar Despesa
            </button>
          </form>
        ) : (
          /* FORMULÁRIO 2: RECEITA */
          <form onSubmit={handleIncomeSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1">Categoria de Receita</label>
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
                    className={`p-2.5 rounded-2xl text-xs font-semibold border text-center transition-all ${
                      incomeCategory === item.id
                        ? "bg-[#7A8B68]/20 border-[#7A8B68] text-[#2C221E] ring-1 ring-[#7A8B68] font-bold"
                        : "bg-[#F4EFE6] border-[#E6DEC8] text-[#786B5E] hover:bg-[#E6DEC8]/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1">
                Valor Líquido (R$ - Cai na Carteira)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={incomeAmountNet}
                onChange={(e) => setIncomeAmountNet(e.target.value)}
                required
                autoFocus
                className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-4 py-2.5 text-2xl font-black text-[#2C221E] placeholder-[#786B5E]/40 focus:outline-none focus:border-[#7A8B68] focus:ring-2 focus:ring-[#7A8B68]/15 transition-all"
              />
            </div>

            {incomeCategory === "SALARY" && (
              <div>
                <label className="text-xs text-[#786B5E] font-medium block mb-1">
                  Valor Bruto (R$ - Apenas para Histórico/Estatística)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 7500,00"
                  value={incomeAmountGross}
                  onChange={(e) => setIncomeAmountGross(e.target.value)}
                  className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2.5 text-xs text-[#2C221E] placeholder-[#786B5E]/50 focus:outline-none focus:border-[#7A8B68] focus:ring-2 focus:ring-[#7A8B68]/15 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Salário mensal, freelance, vale refeição..."
                value={incomeDescription}
                onChange={(e) => setIncomeDescription(e.target.value)}
                required
                className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2.5 text-xs text-[#2C221E] placeholder-[#786B5E]/50 focus:outline-none focus:border-[#7A8B68] focus:ring-2 focus:ring-[#7A8B68]/15 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#7A8B68] hover:bg-[#657554] text-[#FBF9F5] font-bold text-sm shadow-md shadow-[#7A8B68]/25 transition-transform active:scale-[0.98]"
            >
              Confirmar Receita
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
