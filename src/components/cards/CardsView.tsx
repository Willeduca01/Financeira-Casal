"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  CreditCard as CreditCardIcon,
  Utensils,
  ShoppingBag,
  Plus,
  Layers,
  Calendar,
  Sparkles,
  TrendingDown,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  User,
  Shield,
  ArrowRight,
} from "lucide-react";
import { NewCreditCardModal } from "@/components/modals/NewCreditCardModal";
import { NewInstallmentModal } from "@/components/modals/NewInstallmentModal";
import { NewBenefitCardModal } from "@/components/modals/NewBenefitCardModal";
import { CreditCard, CreditCardInstallment, BenefitCard } from "@/types";

export const CardsView: React.FC = () => {
  const {
    users,
    expenses,
    creditCards,
    installments,
    benefitCards,
    cardsMetrics,
    updateCreditCard,
    deleteCreditCard,
    deleteInstallment,
    updateBenefitCardBalance,
    deleteBenefitCard,
    addInstallment,
  } = useFinance();

  // Estados de Modais
  const [isNewCreditCardOpen, setIsNewCreditCardOpen] = useState(false);
  const [isNewInstallmentOpen, setIsNewInstallmentOpen] = useState(false);
  const [isNewBenefitCardOpen, setIsNewBenefitCardOpen] = useState(false);
  const [selectedCardForInstallment, setSelectedCardForInstallment] = useState<string | undefined>(undefined);

  // Filtros
  const [activeFilter, setActiveFilter] = useState<"all" | "credit" | "benefits">("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");

  // Estado para edição rápida de limite liberado
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editAvailableLimitValue, setEditAvailableLimitValue] = useState<string>("");

  // Estado para edição rápida de saldo de benefício
  const [editingBenefitId, setEditingBenefitId] = useState<string | null>(null);
  const [editBenefitBalanceValue, setEditBenefitBalanceValue] = useState<string>("");

  // Cartões expandidos para ver parcelas
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    "card-santander": true,
    "card-nubank": true,
  });

  const toggleExpandCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleStartEditLimit = (card: CreditCard) => {
    setEditingCardId(card.id);
    setEditAvailableLimitValue(card.availableLimit.toString());
  };

  const handleSaveEditLimit = (cardId: string) => {
    const val = parseFloat(editAvailableLimitValue.replace(",", "."));
    if (!isNaN(val) && val >= 0) {
      updateCreditCard(cardId, { availableLimit: val });
    }
    setEditingCardId(null);
  };

  const handleStartEditBenefit = (benefit: BenefitCard) => {
    setEditingBenefitId(benefit.id);
    setEditBenefitBalanceValue(benefit.currentBalance.toString());
  };

  const handleSaveEditBenefit = (benefitId: string) => {
    const val = parseFloat(editBenefitBalanceValue.replace(",", "."));
    if (!isNaN(val) && val >= 0) {
      updateBenefitCardBalance(benefitId, val);
    }
    setEditingBenefitId(null);
  };

  const handleOpenNewInstallment = (cardId?: string) => {
    setSelectedCardForInstallment(cardId);
    setIsNewInstallmentOpen(true);
  };

  // Filtragem de dados
  const filteredCreditCards = creditCards.filter((card) => {
    if (selectedUserFilter !== "all" && card.userId !== selectedUserFilter) return false;
    return true;
  });

  const filteredBenefitCards = benefitCards.filter((b) => {
    if (selectedUserFilter !== "all" && b.userId !== selectedUserFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO COM AÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FBF9F5] p-5 rounded-3xl border border-[#E8DFD1] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C46D53]/15 text-[#C46D53]">
              <CreditCardIcon size={20} />
            </span>
            <h2 className="text-xl md:text-2xl font-black font-serif text-[#2C221E] tracking-tight">
              Cartões & Benefícios
            </h2>
          </div>
          <p className="text-xs text-[#786B5E] mt-1">
            Gestão de limites de crédito, parcelamentos (Santander, Nubank) e saldos de VR/VA do casal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewCreditCardOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#C46D53]/30 transition-transform active:scale-95"
          >
            <Plus size={15} />
            <span>Novo Cartão Crédito</span>
          </button>
          <button
            onClick={() => setIsNewBenefitCardOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#7A8B68] hover:bg-[#687856] text-[#FBF9F5] text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-[#7A8B68]/30 transition-transform active:scale-95"
          >
            <Plus size={15} />
            <span>Novo Cartão VR/VA</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE RESUMO (KPIS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card KPI 1: Limite de Crédito Casal */}
        <div className="bg-[#FBF9F5] rounded-3xl p-5 border border-[#E8DFD1] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E]">
              Limite Total de Crédito
            </span>
            <span className="p-1 rounded-lg bg-[#C46D53]/10 text-[#C46D53]">
              <CreditCardIcon size={16} />
            </span>
          </div>

          <div className="text-2xl font-black font-serif text-[#2C221E] leading-none mb-1">
            R$ {cardsMetrics.totalCreditLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>

          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-[#E8DFD1]/60">
            <div>
              <span className="text-[10px] text-[#786B5E] block font-medium">Limite Liberado</span>
              <span className="font-bold text-[#5B7052]">
                R$ {cardsMetrics.totalAvailableLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#786B5E] block font-medium">Comprometido</span>
              <span className="font-bold text-[#C46D53]">
                R$ {cardsMetrics.totalCommittedLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Barra de Progresso do Limite */}
          <div className="w-full bg-[#E8DFD1] h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#C46D53] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  cardsMetrics.totalCreditLimit > 0
                    ? (cardsMetrics.totalCommittedLimit / cardsMetrics.totalCreditLimit) * 100
                    : 0
                )}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-[#786B5E] mt-1 text-right font-semibold">
            {cardsMetrics.totalCreditLimit > 0
              ? `${Math.round((cardsMetrics.totalCommittedLimit / cardsMetrics.totalCreditLimit) * 100)}% comprometido`
              : "Sem cartões cadastrados"}
          </div>
        </div>

        {/* Card KPI 2: Parcelamentos Mensais Ativos */}
        <div className="bg-[#FBF9F5] rounded-3xl p-5 border border-[#E8DFD1] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E]">
              Fatura de Parcelas / Mês
            </span>
            <span className="p-1 rounded-lg bg-[#D99B52]/15 text-[#9E6317]">
              <Layers size={16} />
            </span>
          </div>

          <div className="text-2xl font-black font-serif text-[#9E6317] leading-none mb-1">
            R$ {cardsMetrics.totalMonthlyInstallmentsAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>

          <p className="text-xs text-[#786B5E] mt-2">
            Soma das parcelas ativas debitadas mensalmente na fatura dos cartões
          </p>

          <div className="mt-3 pt-3 border-t border-[#E8DFD1]/60 flex items-center justify-between text-xs">
            <span className="text-[#786B5E]">Compras Parceladas:</span>
            <span className="font-bold text-[#2C221E] bg-[#F4EFE6] px-2 py-0.5 rounded-lg">
              {installments.length} compras cadastradas
            </span>
          </div>
        </div>

        {/* Card KPI 3: Saldos de Benefício VR/VA */}
        <div className="bg-[#FBF9F5] rounded-3xl p-5 border border-[#E8DFD1] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E]">
              Total Carteira Benefícios
            </span>
            <span className="p-1 rounded-lg bg-[#7A8B68]/15 text-[#5B7052]">
              <Utensils size={16} />
            </span>
          </div>

          <div className="text-2xl font-black font-serif text-[#5B7052] leading-none mb-1">
            R$ {cardsMetrics.totalBenefitBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>

          <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-[#E8DFD1]/60">
            <div>
              <span className="text-[10px] text-[#786B5E] block font-medium">Refeição (VR)</span>
              <span className="font-bold text-[#C46D53]">
                R$ {cardsMetrics.totalBenefitBalanceVR.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#786B5E] block font-medium">Alimentação (VA)</span>
              <span className="font-bold text-[#5B7052]">
                R$ {cardsMetrics.totalBenefitBalanceVA.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-[#786B5E] mt-2 font-medium flex items-center justify-between">
            <span>Recarga mensal prevista:</span>
            <span className="font-bold text-[#2C221E]">
              + R$ {cardsMetrics.totalMonthlyBenefitDeposit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. FILTROS POR ABA E POR TITULAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4EFE6] p-2 rounded-2xl border border-[#E8DFD1]">
        {/* Seletor de Tipo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-[#2C221E] text-[#FBF9F5] shadow-xs"
                : "text-[#786B5E] hover:text-[#2C221E]"
            }`}
          >
            Todos os Cartões
          </button>
          <button
            onClick={() => setActiveFilter("credit")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "credit"
                ? "bg-[#2C221E] text-[#FBF9F5] shadow-xs"
                : "text-[#786B5E] hover:text-[#2C221E]"
            }`}
          >
            Crédito ({creditCards.length})
          </button>
          <button
            onClick={() => setActiveFilter("benefits")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "benefits"
                ? "bg-[#2C221E] text-[#FBF9F5] shadow-xs"
                : "text-[#786B5E] hover:text-[#2C221E]"
            }`}
          >
            Benefícios VR/VA ({benefitCards.length})
          </button>
        </div>

        {/* Seletor de Titular */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-[#786B5E] pl-2">Titular:</span>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[#E8DFD1] bg-[#FBF9F5] text-xs font-bold text-[#2C221E] focus:outline-hidden"
          >
            <option value="all">Casal Completo</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. SEÇÃO: CARTÕES DE CRÉDITO & PARCELAMENTOS */}
      {(activeFilter === "all" || activeFilter === "credit") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C46D53]" />
              <h3 className="font-serif font-black text-lg text-[#2C221E]">
                Cartões de Crédito & Compras Parceladas
              </h3>
            </div>
            <button
              onClick={() => handleOpenNewInstallment()}
              className="text-xs font-bold text-[#C46D53] hover:text-[#B05B42] flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Nova Compra Parcelada</span>
            </button>
          </div>

          {filteredCreditCards.length === 0 ? (
            <div className="bg-[#FBF9F5] rounded-3xl p-8 text-center border border-dashed border-[#E8DFD1] text-[#786B5E]">
              <CreditCardIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">Nenhum cartão de crédito cadastrado.</p>
              <button
                onClick={() => setIsNewCreditCardOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-[#C46D53] text-[#FBF9F5] text-xs font-bold"
              >
                Cadastrar Primeiro Cartão
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredCreditCards.map((card) => {
                const cardUser = users.find((u) => u.id === card.userId);
                const cardInstallments = installments.filter((i) => i.cardId === card.id);
                const cardExpenses = expenses.filter(
                  (e) => e.paymentMethod === "CREDIT_CARD" && e.creditCardId === card.id
                );
                const isExpanded = !!expandedCards[card.id];
                const committedAmount = Math.max(0, card.totalLimit - card.availableLimit);
                const usedPercent = Math.min(
                  100,
                  card.totalLimit > 0 ? (committedAmount / card.totalLimit) * 100 : 0
                );

                return (
                  <div
                    key={card.id}
                    className="bg-[#FBF9F5] rounded-3xl border border-[#E8DFD1] shadow-xs overflow-hidden flex flex-col justify-between"
                  >
                    {/* VISUAL REALISTA DO CARTÃO (CARD HEADER BANCO) */}
                    <div
                      className="p-5 text-[#FBF9F5] relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${card.color} 0%, #1A1A1A 120%)`,
                      }}
                    >
                      {/* Efeito Glow / Círculo decorativo */}
                      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <span className="text-[11px] font-bold tracking-widest uppercase opacity-80 block">
                            {card.bank}
                          </span>
                          <h4 className="text-lg font-black tracking-tight">{card.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold backdrop-blur-xs">
                            {cardUser?.name || "Casal"}
                          </span>
                          <button
                            onClick={() => deleteCreditCard(card.id)}
                            title="Excluir cartão"
                            className="p-1 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Chip e Contactless simulados */}
                      <div className="my-4 flex items-center justify-between relative z-10">
                        <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 border border-amber-500/40 shadow-xs flex items-center justify-center">
                          <div className="w-6 h-4 border border-amber-700/30 rounded-xs" />
                        </div>
                        <span className="font-mono text-sm tracking-widest font-semibold opacity-80">
                          •••• {card.lastFourDigits || "••••"}
                        </span>
                      </div>

                      {/* Limites e Datas na Tarja */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/15 relative z-10">
                        <div>
                          <span className="text-[10px] opacity-75 block font-medium">Limite Total</span>
                          <span className="font-black text-sm">
                            R$ {card.totalLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] opacity-75 block font-medium">Limite Liberado</span>
                          <span className="font-black text-sm text-emerald-300">
                            R$ {card.availableLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CORPO DO CARD: CONTROLES E PARCELAMENTOS */}
                    <div className="p-5 space-y-4">
                      {/* Barra de Limite Usado */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                          <span className="text-[#786B5E]">Uso do Limite</span>
                          <span className="text-[#2C221E]">{Math.round(usedPercent)}% comprometido</span>
                        </div>
                        <div className="w-full bg-[#E8DFD1] h-2.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${usedPercent}%`,
                              backgroundColor: usedPercent > 80 ? "#C46D53" : card.color,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#786B5E] mt-1">
                          <span>Fatura fecha dia {card.closingDay}</span>
                          <span>Vence todo dia {card.dueDay}</span>
                        </div>
                      </div>

                      {/* Edição Rápida de Limite Liberado */}
                      <div className="bg-[#F4EFE6]/60 rounded-2xl p-3 border border-[#E8DFD1] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-[#786B5E] uppercase block">
                            Limite Liberado Agora
                          </span>
                          {editingCardId === card.id ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-[#2C221E]">R$</span>
                              <input
                                type="text"
                                autoFocus
                                value={editAvailableLimitValue}
                                onChange={(e) => setEditAvailableLimitValue(e.target.value)}
                                className="w-24 px-2 py-0.5 rounded-lg border border-[#C46D53] bg-white text-xs font-bold text-[#2C221E]"
                              />
                              <button
                                onClick={() => handleSaveEditLimit(card.id)}
                                className="p-1 rounded-lg bg-[#5B7052] text-white hover:bg-[#4A5D43]"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-base font-black text-[#5B7052]">
                              R$ {card.availableLimit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>

                        {editingCardId !== card.id && (
                          <button
                            onClick={() => handleStartEditLimit(card)}
                            className="text-xs font-bold text-[#C46D53] hover:text-[#B05B42] flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#C46D53]/30 hover:bg-[#C46D53]/10 transition-colors"
                          >
                            <Edit2 size={13} />
                            <span>Ajustar Limite</span>
                          </button>
                        )}
                      </div>

                      {/* Seção Expansível de Compras Parceladas */}
                      <div className="border-t border-[#E8DFD1] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => toggleExpandCard(card.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#2C221E] hover:text-[#C46D53] transition-colors"
                          >
                            <Layers size={15} />
                            <span>
                              Compras Parceladas ({cardInstallments.length})
                            </span>
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>

                          <button
                            onClick={() => handleOpenNewInstallment(card.id)}
                            className="text-[11px] font-bold text-[#5B7052] hover:text-[#4A5D43] flex items-center gap-0.5"
                          >
                            <Plus size={13} />
                            <span>Adicionar Parcela</span>
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="space-y-2 mt-2">
                            {cardInstallments.length === 0 ? (
                              <p className="text-xs text-[#786B5E] italic py-2 text-center bg-[#F4EFE6]/40 rounded-xl">
                                Nenhuma compra parcelada cadastrada neste cartão.
                              </p>
                            ) : (
                              cardInstallments.map((inst) => {
                                const remainingCount = Math.max(
                                  0,
                                  inst.totalInstallments - inst.currentInstallment + 1
                                );
                                const remainingTotal = inst.installmentAmount * remainingCount;
                                const progress = Math.min(
                                  100,
                                  (inst.currentInstallment / inst.totalInstallments) * 100
                                );

                                return (
                                  <div
                                    key={inst.id}
                                    className="p-3 rounded-2xl bg-[#F4EFE6]/70 border border-[#E8DFD1] flex flex-col gap-2"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h5 className="text-xs font-bold text-[#2C221E] leading-tight">
                                          {inst.description}
                                        </h5>
                                        <span className="text-[10px] text-[#786B5E] block mt-0.5">
                                          Parcela {inst.currentInstallment} de {inst.totalInstallments} &bull; R$ {inst.installmentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-[#9E6317] bg-[#D99B52]/15 px-2 py-0.5 rounded-lg">
                                          R$ {inst.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} total
                                        </span>
                                        <button
                                          onClick={() => deleteInstallment(inst.id)}
                                          title="Excluir parcela"
                                          className="p-1 text-[#786B5E] hover:text-[#C46D53] rounded-lg transition-colors"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Mini Barra de Progresso do Parcelamento */}
                                    <div className="w-full bg-[#E8DFD1] h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#7A8B68] rounded-full"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-[#786B5E]">
                                      <span>{remainingCount} parcelas restantes para quitar</span>
                                      <span className="font-semibold text-[#2C221E]">
                                        Restante: R$ {remainingTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* Seção de Gastos Avulsos no Cartão */}
                      <div className="border-t border-[#E8DFD1] pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-[#2C221E]">
                            <ShoppingBag size={14} className="text-[#C46D53]" />
                            <span>Gastos Recentes no Cartão ({cardExpenses.length})</span>
                          </span>
                          {cardExpenses.length > 0 && (
                            <span className="text-[11px] font-bold text-[#C46D53]">
                              Total: R$ {cardExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>

                        {cardExpenses.length === 0 ? (
                          <p className="text-[11px] text-[#786B5E] italic py-2 px-3 bg-[#F4EFE6]/40 rounded-xl text-center">
                            Nenhum gasto avulso vinculado a este cartão este mês.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {cardExpenses.map((exp) => {
                              const expUser = users.find((u) => u.id === exp.userId);
                              return (
                                <div
                                  key={exp.id}
                                  className="p-2.5 rounded-xl bg-[#F4EFE6]/80 border border-[#E8DFD1] flex items-center justify-between text-xs hover:border-[#C46D53]/30 transition-colors"
                                >
                                  <div className="truncate mr-2">
                                    <p className="font-bold text-[#2C221E] truncate">{exp.description}</p>
                                    <span className="text-[10px] text-[#786B5E]">
                                      {new Date(exp.date).toLocaleDateString("pt-BR")} &bull; {expUser?.name.split(" ")[0]} &bull; Abatido do limite
                                    </span>
                                  </div>
                                  <span className="font-black text-[#2C221E] shrink-0">
                                    - R$ {exp.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SEÇÃO: CARTÕES DE BENEFÍCIO (VR / VA DO CASAL) */}
      {(activeFilter === "all" || activeFilter === "benefits") && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7A8B68]" />
              <h3 className="font-serif font-black text-lg text-[#2C221E]">
                Cartões de Benefício do Casal (VR & VA)
              </h3>
            </div>
            <button
              onClick={() => setIsNewBenefitCardOpen(true)}
              className="text-xs font-bold text-[#7A8B68] hover:text-[#687856] flex items-center gap-1"
            >
              <Plus size={14} />
              <span>Novo Benefício</span>
            </button>
          </div>

          {filteredBenefitCards.length === 0 ? (
            <div className="bg-[#FBF9F5] rounded-3xl p-8 text-center border border-dashed border-[#E8DFD1] text-[#786B5E]">
              <Utensils size={32} className="mx-auto mb-2 opacity-50" />
              <p className="font-bold text-sm">Nenhum cartão de benefício cadastrado.</p>
              <button
                onClick={() => setIsNewBenefitCardOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-[#7A8B68] text-[#FBF9F5] text-xs font-bold"
              >
                Cadastrar Cartão VR/VA
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredBenefitCards.map((b) => {
                const bUser = users.find((u) => u.id === b.userId);
                const isVR = b.type === "VR";

                return (
                  <div
                    key={b.id}
                    className="bg-[#FBF9F5] rounded-3xl border border-[#E8DFD1] shadow-xs p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#7A8B68]/60 transition-all"
                  >
                    {/* Topo do Card de Benefício */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${
                            isVR
                              ? "bg-[#C46D53]/15 text-[#C46D53]"
                              : "bg-[#7A8B68]/15 text-[#5B7052]"
                          }`}
                        >
                          {isVR ? <Utensils size={12} /> : <ShoppingBag size={12} />}
                          {isVR ? "Vale Refeição" : "Vale Alimentação"}
                        </span>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[#786B5E] bg-[#F4EFE6] px-2 py-0.5 rounded-lg">
                            {bUser?.name.split(" ")[0] || "Casal"}
                          </span>
                          <button
                            onClick={() => deleteBenefitCard(b.id)}
                            className="p-1 text-[#786B5E] hover:text-[#C46D53] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir benefício"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-[#2C221E] leading-tight">
                        {b.name}
                      </h4>
                      {b.lastFourDigits && (
                        <span className="text-[11px] font-mono text-[#786B5E]">
                          Final {b.lastFourDigits}
                        </span>
                      )}

                      {/* Saldo Atual */}
                      <div className="mt-4 pt-3 border-t border-[#E8DFD1]/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#786B5E] block">
                          Saldo Disponível
                        </span>
                        {editingBenefitId === b.id ? (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs font-bold text-[#2C221E]">R$</span>
                            <input
                              type="text"
                              autoFocus
                              value={editBenefitBalanceValue}
                              onChange={(e) => setEditBenefitBalanceValue(e.target.value)}
                              className="w-24 px-2 py-0.5 rounded-lg border border-[#7A8B68] bg-white text-xs font-bold text-[#2C221E]"
                            />
                            <button
                              onClick={() => handleSaveEditBenefit(b.id)}
                              className="p-1 rounded-lg bg-[#5B7052] text-white hover:bg-[#4A5D43]"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-baseline justify-between mt-0.5">
                            <span className="text-xl font-black font-serif text-[#2C221E]">
                              R$ {b.currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              onClick={() => handleStartEditBenefit(b)}
                              className="text-[10px] font-bold text-[#C46D53] hover:underline flex items-center gap-0.5"
                            >
                              <Edit2 size={11} />
                              <span>Editar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rodapé: Recarga Mensal */}
                    <div className="mt-4 pt-3 border-t border-[#E8DFD1]/40 flex items-center justify-between text-[11px] text-[#786B5E]">
                      <span>Recarga mensal:</span>
                      <span className="font-bold text-[#2C221E]">
                        + R$ {b.monthlyDeposit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (dia {b.depositDay})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. MODAIS */}
      <NewCreditCardModal
        isOpen={isNewCreditCardOpen}
        onClose={() => setIsNewCreditCardOpen(false)}
      />

      <NewInstallmentModal
        isOpen={isNewInstallmentOpen}
        defaultCardId={selectedCardForInstallment}
        onClose={() => {
          setIsNewInstallmentOpen(false);
          setSelectedCardForInstallment(undefined);
        }}
      />

      <NewBenefitCardModal
        isOpen={isNewBenefitCardOpen}
        onClose={() => setIsNewBenefitCardOpen(false)}
      />
    </div>
  );
};
