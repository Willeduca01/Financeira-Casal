"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Layers, AlertCircle } from "lucide-react";
import { ExpenseCategory } from "@/types";

interface NewInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCardId?: string;
}

const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: "HOUSING", label: "Casa & Móveis" },
  { id: "LEISURE", label: "Viagem & Lazer" },
  { id: "HEALTH", label: "Saúde & Roupas" },
  { id: "FOOD_MARKET", label: "Mercado / Eletros" },
  { id: "TRANSPORT", label: "Transporte / Auto" },
  { id: "OTHER", label: "Outros" },
];

export const NewInstallmentModal: React.FC<NewInstallmentModalProps> = ({
  isOpen,
  onClose,
  defaultCardId,
}) => {
  const { creditCards, currentUser, addInstallment } = useFinance();

  const [cardId, setCardId] = useState(defaultCardId || creditCards[0]?.id || "");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("5");
  const [currentInstallment, setCurrentInstallment] = useState("1");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");

  // Atualizar cardId quando o modal abrir com defaultCardId
  React.useEffect(() => {
    if (defaultCardId) setCardId(defaultCardId);
    else if (creditCards.length > 0 && !cardId) setCardId(creditCards[0].id);
  }, [defaultCardId, creditCards]);

  // Recalcular valor da parcela automaticamente se o total mudar
  const handleTotalAmountChange = (val: string) => {
    setTotalAmount(val);
    const parsed = parseFloat(val.replace(",", "."));
    const count = parseInt(totalInstallments) || 1;
    if (!isNaN(parsed) && parsed > 0 && count > 0) {
      setInstallmentAmount((parsed / count).toFixed(2));
    }
  };

  const handleInstallmentCountChange = (val: string) => {
    setTotalInstallments(val);
    const count = parseInt(val) || 1;
    const parsed = parseFloat(totalAmount.replace(",", "."));
    if (!isNaN(parsed) && parsed > 0 && count > 0) {
      setInstallmentAmount((parsed / count).toFixed(2));
    }
  };

  if (!isOpen) return null;

  const selectedCard = creditCards.find((c) => c.id === cardId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId || !description.trim() || !totalAmount) return;

    const parsedTotal = parseFloat(totalAmount.replace(",", "."));
    const parsedCount = parseInt(totalInstallments) || 1;
    const parsedCurrent = parseInt(currentInstallment) || 1;
    const parsedMonthly = installmentAmount
      ? parseFloat(installmentAmount.replace(",", "."))
      : parsedTotal / parsedCount;

    addInstallment({
      cardId,
      description: description.trim(),
      totalAmount: parsedTotal,
      installmentAmount: parsedMonthly,
      totalInstallments: parsedCount,
      currentInstallment: parsedCurrent,
      category,
      purchaseDate: new Date().toISOString(),
      userId: selectedCard ? selectedCard.userId : currentUser.id,
    });

    onClose();
    setDescription("");
    setTotalAmount("");
    setInstallmentAmount("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-lg shadow-2xl border border-[#E8DFD1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7A8B68] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Nova Compra Parcelada
              </h3>
              <p className="text-xs text-[#786B5E]">
                Cadastre parcelas ativas no cartão de crédito
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
          {/* Selecionar Cartão */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Cartão de Crédito Destino *
            </label>
            <select
              required
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
            >
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.bank}) - Limite Liberado: R$ {c.availableLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Descrição da Compra *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Passagens Aéreas, Notebook, Geladeira..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm focus:outline-hidden focus:border-[#C46D53]"
            />
          </div>

          {/* Valor Total e Número de Parcelas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Valor Total da Compra (R$) *
              </label>
              <input
                type="text"
                required
                value={totalAmount}
                onChange={(e) => handleTotalAmountChange(e.target.value)}
                placeholder="Ex: 400,00 ou 1500,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Total de Parcelas *
              </label>
              <input
                type="number"
                min="1"
                max="60"
                required
                value={totalInstallments}
                onChange={(e) => handleInstallmentCountChange(e.target.value)}
                placeholder="Ex: 5, 6, 8, 10, 12..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Parcela Atual e Valor Mensal Calculado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Parcela Atual (ex: 1 de {totalInstallments})
              </label>
              <input
                type="number"
                min="1"
                max={totalInstallments || "1"}
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Valor de Cada Parcela (R$/mês)
              </label>
              <input
                type="text"
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                placeholder="Calculado automático"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
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

          {/* Aviso sobre impacto no limite liberado */}
          <div className="bg-[#D99B52]/10 border border-[#D99B52]/25 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#9E6317]">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              Ao salvar, a parcela do mês será vinculada ao cartão e o limite liberado será
              atualizado.
            </span>
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
              className="px-5 py-2.5 rounded-xl bg-[#7A8B68] hover:bg-[#687856] text-[#FBF9F5] text-xs font-bold shadow-md shadow-[#7A8B68]/30 transition-transform active:scale-95"
            >
              Adicionar Parcela
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
