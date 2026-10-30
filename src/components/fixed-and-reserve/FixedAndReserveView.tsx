"use client";

import React, { useState, useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatDateBR, CATEGORY_DETAILS } from "@/lib/utils";
import { Expense } from "@/types";
import {
  Sprout,
  CheckCircle2,
  Circle,
  Plus,
  ShieldCheck,
  Sparkles,
  Calendar,
  Pencil,
  Trash2,
  ArrowDownRight,
  Sliders,
  Check,
  CreditCard,
  Building,
  CheckCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { EditReserveModal } from "@/components/modals/EditReserveModal";
import { WithdrawReserveModal } from "@/components/modals/WithdrawReserveModal";
import { NewFixedExpenseModal } from "@/components/modals/NewFixedExpenseModal";
import { EditFixedExpenseModal } from "@/components/modals/EditFixedExpenseModal";
import { EditLivingCostModal } from "@/components/modals/EditLivingCostModal";

export const FixedAndReserveView: React.FC = () => {
  const {
    expenses,
    emergencyFund,
    emergencyFundMetrics,
    toggleFixedExpensePaid,
    addEmergencyDeposit,
    updateEmergencyFund,
    deleteExpense,
    users,
  } = useFinance();

  // Estados de Modais
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showEditReserveModal, setShowEditReserveModal] = useState<boolean>(false);
  const [showEditLivingCostModal, setShowEditLivingCostModal] = useState<boolean>(false);
  const [showNewExpenseModal, setShowNewExpenseModal] = useState<boolean>(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Estados de Formulário de Aporte Rápido
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositNotes, setDepositNotes] = useState<string>("");

  // Filtros da Checklist
  const [checklistFilter, setChecklistFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");

  // Filtrar apenas despesas fixas ou parcelas de empréstimos
  const fixedList = useMemo(() => {
    return expenses.filter(
      (exp) => exp.expenseType === "FIXED" || exp.expenseType === "LOAN"
    );
  }, [expenses]);

  const filteredFixedList = useMemo(() => {
    if (checklistFilter === "PENDING") return fixedList.filter((e) => !e.isPaid);
    if (checklistFilter === "PAID") return fixedList.filter((e) => e.isPaid);
    return fixedList;
  }, [fixedList, checklistFilter]);

  const totalFixedAmount = useMemo(() => {
    return fixedList.reduce((sum, e) => sum + e.amount, 0);
  }, [fixedList]);

  const paidFixedAmount = useMemo(() => {
    return fixedList.filter((e) => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
  }, [fixedList]);

  const pendingFixedAmount = Math.max(0, totalFixedAmount - paidFixedAmount);

  // Ações da Checklist
  const handleTogglePaid = (exp: Expense) => {
    toggleFixedExpensePaid(exp.id);
    if (!exp.isPaid && pendingFixedAmount - exp.amount <= 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleMarkAllPaid = () => {
    fixedList.forEach((e) => {
      if (!e.isPaid) toggleFixedExpensePaid(e.id);
    });
  };

  const handleMarkAllPending = () => {
    fixedList.forEach((e) => {
      if (e.isPaid) toggleFixedExpensePaid(e.id);
    });
  };

  const handleOpenEditExpense = (e: React.MouseEvent, exp: Expense) => {
    e.stopPropagation();
    setEditingExpense(exp);
    setShowEditExpenseModal(true);
  };

  const handleDeleteExpense = (e: React.MouseEvent, exp: Expense) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir "${exp.description}"?`)) {
      deleteExpense(exp.id);
    }
  };

  // Submissão do Aporte Rápido na Reserva
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount.replace(",", "."));
    if (val > 0) {
      addEmergencyDeposit(val, depositNotes || "Aporte programado");
      setDepositAmount("");
      setDepositNotes("");
      setShowDepositModal(false);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    }
  };

  // Mudança rápida de meta de meses clicando nos marcos
  const handleSelectTargetMonths = async (months: number) => {
    await updateEmergencyFund({ targetMonths: months });
  };

  return (
    <div className="space-y-6">
      {/* 1. MÓDULO: RESERVA DE EMERGÊNCIA (CULTIVO DA PLANTINHA) */}
      <div className="organic-card p-5 md:p-6 space-y-5 border-[#E8DFD1] bg-[#FBF9F5] shadow-xs">
        {/* Cabeçalho da Reserva com Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E9EFE4] text-[#7A8B68] flex items-center justify-center border border-[#7A8B68]/30 shrink-0 shadow-xs">
              <Sprout size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif text-lg md:text-xl font-black text-[#2C221E] leading-tight">
                  Reserva de Emergência do Casal
                </h2>
                <span className="text-[10px] font-bold bg-[#E9EFE4] text-[#556943] border border-[#7A8B68]/30 px-2.5 py-0.5 rounded-full">
                  Colchão de Paz
                </span>
              </div>
              <p className="text-xs text-[#786B5E] mt-0.5">
                Segurança financeira para imprevistos calculada sobre o custo de vida real do casal
              </p>
            </div>
          </div>

          {/* Botões do Topo da Reserva */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Editar Saldo / Meta */}
            <button
              onClick={() => setShowEditReserveModal(true)}
              className="px-3.5 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6] hover:bg-[#E8DFD1] text-[#2C221E] font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Ajustar saldo guardado ou meta de meses"
            >
              <Pencil size={14} className="text-[#786B5E]" />
              Ajustar Saldo / Meta
            </button>

            {/* Resgatar */}
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3.5 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6] hover:bg-[#E8DFD1] text-[#786B5E] hover:text-[#2C221E] font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Retirar valor em caso de emergência"
            >
              <ArrowDownRight size={14} />
              Resgatar
            </button>

            {/* Guardar / Aporte */}
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-4 py-2 rounded-xl bg-[#7A8B68] hover:bg-[#687756] text-white font-bold text-xs shadow-md shadow-[#7A8B68]/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={16} className="stroke-[3]" />
              Guardar na Reserva
            </button>
          </div>
        </div>

        {/* Resumo de Custo de Vida, Saldo Guardado e Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Custo de Vida */}
          <div className="bg-[#F4EFE6] border border-[#E8DFD1] p-4 rounded-2xl relative group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#786B5E] font-medium block">
                Custo de Vida Mensal:
              </span>
              <button
                onClick={() => setShowEditLivingCostModal(true)}
                className="text-[10px] text-[#7A8B68] hover:underline flex items-center gap-1 font-bold"
                title="Ajustar ou personalizar o custo de vida mensal do casal"
              >
                <Pencil size={11} />
                Editar
              </button>
            </div>
            <p className="font-serif text-xl font-black text-[#2C221E] mt-0.5">
              {formatBRL(emergencyFundMetrics.monthlyLivingCost)}
            </p>
            {emergencyFundMetrics.isCustomLivingCost ? (
              <p className="text-[10px] text-[#556943] font-semibold mt-0.5 flex items-center gap-1">
                <span>Personalizado pelo casal</span>
                <span className="text-[#A89F91] font-normal">
                  (Auto: {formatBRL(emergencyFundMetrics.autoCalculatedLivingCost)})
                </span>
              </p>
            ) : (
              <p className="text-[10px] text-[#786B5E] mt-0.5">
                Fixos ({formatBRL(totalFixedAmount)}) + variáveis essenciais
              </p>
            )}
          </div>

          {/* Saldo Guardado Atual */}
          <div className="bg-[#E9EFE4]/60 border border-[#7A8B68]/30 p-4 rounded-2xl relative group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#556943] font-bold block">
                Saldo Guardado Atual:
              </span>
              <button
                onClick={() => setShowEditReserveModal(true)}
                className="text-[10px] text-[#556943] hover:underline flex items-center gap-1 font-bold"
              >
                <Pencil size={11} />
                Editar
              </button>
            </div>
            <p className="font-serif text-xl font-black text-[#7A8B68] mt-0.5">
              {formatBRL(emergencyFundMetrics.currentAmount)}
            </p>
            <p className="text-[10px] text-[#786B5E] mt-0.5">
              {emergencyFundMetrics.progressPercent}% da meta ideal ({emergencyFund.targetMonths || 6} meses)
            </p>
            {emergencyFund.notes && (
              <span className="inline-block text-[10px] font-bold text-[#556943] bg-white/70 px-2 py-0.5 rounded-md mt-1 border border-[#7A8B68]/20 truncate max-w-full">
                📍 {emergencyFund.notes}
              </span>
            )}
          </div>

          {/* Meta Ideal */}
          <div className="bg-[#F4EFE6] border border-[#E8DFD1] p-4 rounded-2xl relative">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#786B5E] font-medium block">
                Meta Ideal ({emergencyFund.targetMonths || 6} meses):
              </span>
              <button
                onClick={() => setShowEditReserveModal(true)}
                className="text-[10px] text-[#C46D53] hover:underline font-bold"
              >
                Alterar
              </button>
            </div>
            <p className="font-serif text-xl font-black text-[#2C221E] mt-0.5">
              {formatBRL(emergencyFundMetrics.monthlyLivingCost * (emergencyFund.targetMonths || 6))}
            </p>
            <p className="text-[10px] text-[#786B5E] mt-0.5">Tranquilidade e blindagem total</p>
          </div>
        </div>

        {/* Barra de Progresso da Plantinha e Marcos */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs text-[#786B5E]">
            <span className="font-bold text-[#2C221E] flex items-center gap-1.5">
              <Sprout size={14} className="text-[#7A8B68]" />
              Progresso do Colchão de Segurança:
            </span>
            <span className="font-black text-[#7A8B68]">
              {emergencyFundMetrics.progressPercent}% Concluído
            </span>
          </div>

          <div className="w-full bg-[#E8DFD1] rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-[#D99B52] to-[#7A8B68] h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, emergencyFundMetrics.progressPercent)}%` }}
            />
          </div>

          {/* Marcos de Metas em Cards Clicáveis */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
            {/* Marco 1: 3 Meses */}
            <div
              onClick={() => handleSelectTargetMonths(3)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                emergencyFund.targetMonths === 3
                  ? "bg-[#E9EFE4] border-[#7A8B68] ring-1 ring-[#7A8B68] shadow-xs"
                  : "bg-[#F4EFE6] border-[#E8DFD1] hover:border-[#7A8B68]"
              }`}
              title="Clique para definir esta como sua meta"
            >
              <span className="text-[10px] text-[#786B5E] block font-semibold">Marco 1 (3 meses)</span>
              <span className="text-xs font-bold text-[#2C221E] font-serif block mt-0.5">
                {formatBRL(emergencyFundMetrics.targets.threeMonths)}
              </span>
              <span className="text-[9px] block text-[#786B5E] mt-0.5">Reserva Mínima</span>
            </div>

            {/* Marco 2: 6 Meses */}
            <div
              onClick={() => handleSelectTargetMonths(6)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                emergencyFund.targetMonths === 6
                  ? "bg-[#E9EFE4] border-[#7A8B68] ring-1 ring-[#7A8B68] shadow-xs"
                  : "bg-[#F4EFE6] border-[#E8DFD1] hover:border-[#7A8B68]"
              }`}
              title="Clique para definir esta como sua meta"
            >
              <span className="text-[10px] text-[#556943] block font-bold">Meta Ideal (6 meses)</span>
              <span className="text-xs font-bold text-[#2C221E] font-serif block mt-0.5">
                {formatBRL(emergencyFundMetrics.targets.sixMonths)}
              </span>
              <span className="text-[9px] block text-[#7A8B68] mt-0.5 font-bold">Recomendada ⭐</span>
            </div>

            {/* Marco 3: 12 Meses */}
            <div
              onClick={() => handleSelectTargetMonths(12)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                emergencyFund.targetMonths === 12
                  ? "bg-[#E9EFE4] border-[#7A8B68] ring-1 ring-[#7A8B68] shadow-xs"
                  : "bg-[#F4EFE6] border-[#E8DFD1] hover:border-[#7A8B68]"
              }`}
              title="Clique para definir esta como sua meta"
            >
              <span className="text-[10px] text-[#786B5E] block font-semibold">Marco 3 (12 meses)</span>
              <span className="text-xs font-bold text-[#2C221E] font-serif block mt-0.5">
                {formatBRL(emergencyFundMetrics.targets.twelveMonths)}
              </span>
              <span className="text-[9px] block text-[#786B5E] mt-0.5">Independência 🚀</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MÓDULO: CHECKLIST DE CONTAS FIXAS & PARCELAS */}
      <div className="organic-card p-5 md:p-6 space-y-4 border-[#E8DFD1] bg-[#FBF9F5] shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base font-bold text-[#2C221E] flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#7A8B68]" />
              Checklist de Contas Fixas & Parcelas
            </h3>
            <p className="text-xs text-[#786B5E]">
              Marque as contas conforme forem sendo debitadas da Carteira Livre
            </p>
          </div>

          {/* Botão + Nova Conta Fixa */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setShowNewExpenseModal(true)}
              className="px-4 py-2 rounded-xl bg-[#7A8B68] hover:bg-[#687756] text-white font-bold text-xs shadow-md shadow-[#7A8B68]/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={16} className="stroke-[3]" />
              Nova Conta Fixa
            </button>
          </div>
        </div>

        {/* Barra de Totais e Filtros da Checklist */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#E8DFD1]/60">
          {/* Filtros: Todas, Pendentes, Pagas */}
          <div className="inline-flex rounded-xl border border-[#E8DFD1] bg-[#F4EFE6] p-1 text-xs font-bold text-[#786B5E]">
            <button
              onClick={() => setChecklistFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                checklistFilter === "ALL"
                  ? "bg-[#7A8B68] text-white shadow-xs"
                  : "hover:text-[#2C221E]"
              }`}
            >
              Todas ({fixedList.length})
            </button>
            <button
              onClick={() => setChecklistFilter("PENDING")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                checklistFilter === "PENDING"
                  ? "bg-[#C46D53] text-white shadow-xs"
                  : "hover:text-[#2C221E]"
              }`}
            >
              Pendentes ({fixedList.filter((e) => !e.isPaid).length})
            </button>
            <button
              onClick={() => setChecklistFilter("PAID")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                checklistFilter === "PAID"
                  ? "bg-[#7A8B68] text-white shadow-xs"
                  : "hover:text-[#2C221E]"
              }`}
            >
              Pagas ({fixedList.filter((e) => e.isPaid).length})
            </button>
          </div>

          {/* Totais de Pagos e Pendentes */}
          <div className="flex items-center gap-3 bg-[#F4EFE6] border border-[#E8DFD1] px-3.5 py-1.5 rounded-xl text-xs">
            <span className="text-[#7A8B68] font-bold">
              Pago: {formatBRL(paidFixedAmount)}
            </span>
            <span className="text-[#786B5E]/40">&bull;</span>
            <span className="text-[#C46D53] font-bold">
              Pendente: {formatBRL(pendingFixedAmount)}
            </span>
            {fixedList.length > 0 && (
              <>
                <span className="text-[#786B5E]/40">&bull;</span>
                <button
                  onClick={pendingFixedAmount > 0 ? handleMarkAllPaid : handleMarkAllPending}
                  className="text-[10px] text-[#786B5E] hover:text-[#2C221E] underline font-bold"
                >
                  {pendingFixedAmount > 0 ? "Quitar todas" : "Desmarcar todas"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lista de Contas com Interação e Botões de Edição */}
        <div className="space-y-2.5">
          {filteredFixedList.length > 0 ? (
            filteredFixedList.map((exp) => {
              const cat = CATEGORY_DETAILS[exp.category as keyof typeof CATEGORY_DETAILS];
              const partner = users.find((u) => u.id === exp.userId);

              return (
                <div
                  key={exp.id}
                  onClick={() => handleTogglePaid(exp)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    exp.isPaid
                      ? "bg-[#E9EFE4]/35 border-[#7A8B68]/30 opacity-80"
                      : "bg-[#FBF9F5] border-[#E8DFD1] hover:border-[#7A8B68]/60 shadow-xs"
                  }`}
                >
                  {/* Lado Esquerdo: Checkbox + Título + Metadados */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePaid(exp);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        exp.isPaid
                          ? "bg-[#7A8B68] text-white"
                          : "border-2 border-[#786B5E]/40 text-transparent hover:border-[#7A8B68]"
                      }`}
                      title={exp.isPaid ? "Marcar como pendente" : "Marcar como paga"}
                    >
                      <Check size={14} className={exp.isPaid ? "block" : "hidden stroke-[3]"} />
                    </button>

                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold leading-snug truncate ${
                          exp.isPaid ? "text-[#786B5E] line-through" : "text-[#2C221E]"
                        }`}
                      >
                        {exp.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#786B5E] mt-0.5 flex-wrap">
                        <span className="font-medium">{cat?.label || "Conta Fixa"}</span>
                        <span>&bull;</span>
                        <span>
                          {exp.paymentMethod === "CREDIT_CARD" ? "Cartão de Crédito" : "Débito / Pix"}
                        </span>
                        {exp.dueDate && <span>&bull; Venc: {formatDateBR(exp.dueDate)}</span>}
                        {partner && (
                          <>
                            <span>&bull;</span>
                            <span className="font-bold text-[#2C221E]">{partner.name.split(" ")[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Valor + Badges + Botões de Ação (Editar e Excluir) */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm font-serif font-black block ${
                          exp.isPaid ? "text-[#786B5E]" : "text-[#C46D53]"
                        }`}
                      >
                        {formatBRL(exp.amount)}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block ${
                          exp.isPaid
                            ? "bg-[#E9EFE4] text-[#556943]"
                            : "bg-[#FCECE8] text-[#B05B42]"
                        }`}
                      >
                        {exp.isPaid ? "Pago" : "Pendente"}
                      </span>
                    </div>

                    {/* Botões de Ação Rápida */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditExpense(e, exp)}
                        className="p-1.5 rounded-lg text-[#786B5E] hover:text-[#2C221E] hover:bg-[#E8DFD1] transition-colors"
                        title="Editar conta fixa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteExpense(e, exp)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        title="Excluir conta fixa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center rounded-2xl bg-[#F4EFE6]/50 border border-dashed border-[#E8DFD1] space-y-2">
              <CheckCircle2 size={32} className="text-[#786B5E]/50 mx-auto" />
              <p className="text-xs text-[#786B5E] font-medium">
                {checklistFilter === "PENDING"
                  ? "Tudo em dia! Nenhuma conta fixa pendente no momento."
                  : checklistFilter === "PAID"
                  ? "Nenhuma conta marcada como paga ainda."
                  : "Nenhuma conta fixa cadastrada neste mês."}
              </p>
              <button
                onClick={() => setShowNewExpenseModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#7A8B68] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus size={14} />
                Cadastrar Conta Fixa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Aporte Rápido na Reserva */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#FBF9F5] border border-[#E8DFD1] rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl text-[#2C221E] animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E9EFE4] text-[#7A8B68] flex items-center justify-center">
                <Sprout size={22} />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#2C221E]">
                  Guardar na Reserva
                </h3>
                <p className="text-[11px] text-[#786B5E]">Cultivando a segurança do casal</p>
              </div>
            </div>

            <p className="text-xs text-[#786B5E] leading-relaxed">
              Este valor sairá da Carteira Livre (Pote Único) e aumentará o colchão de emergência do casal.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#786B5E] block mb-1">
                  Valor a Guardar (R$) *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 500,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-[#F4EFE6] border border-[#E8DFD1] rounded-2xl px-4 py-2.5 text-base font-serif font-bold text-[#2C221E] focus:outline-none focus:border-[#7A8B68]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#786B5E] block mb-1">
                  Observação / Origem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sobra do mês ou Renda extra"
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  className="w-full bg-[#F4EFE6] border border-[#E8DFD1] rounded-2xl px-3.5 py-2 text-xs text-[#2C221E] focus:outline-none focus:border-[#7A8B68]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#F4EFE6] text-[#786B5E] hover:bg-[#E8DFD1]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#7A8B68] hover:bg-[#687756] text-[#FBF9F5] shadow-md transition-all"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Editar Reserva / Saldo Atual e Meta */}
      <EditReserveModal
        isOpen={showEditReserveModal}
        onClose={() => setShowEditReserveModal(false)}
      />

      {/* MODAL 3: Resgatar da Reserva */}
      <WithdrawReserveModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />

      {/* MODAL 4: Nova Conta Fixa */}
      <NewFixedExpenseModal
        isOpen={showNewExpenseModal}
        onClose={() => setShowNewExpenseModal(false)}
      />

      {/* MODAL 5: Editar Conta Fixa */}
      <EditFixedExpenseModal
        isOpen={showEditExpenseModal}
        onClose={() => {
          setShowEditExpenseModal(false);
          setEditingExpense(null);
        }}
        expense={editingExpense}
      />

      {/* MODAL 6: Editar Custo de Vida Mensal */}
      <EditLivingCostModal
        isOpen={showEditLivingCostModal}
        onClose={() => setShowEditLivingCostModal(false)}
      />
    </div>
  );
};
