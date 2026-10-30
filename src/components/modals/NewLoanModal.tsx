"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Landmark, Calculator, AlertCircle, Users } from "lucide-react";

interface NewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, addLoan } = useFinance();

  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [profileId, setProfileId] = useState(currentUser?.id || users[0]?.id || "");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("36");
  const [paidInstallments, setPaidInstallments] = useState("0");
  const [dueDay, setDueDay] = useState("10");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !institution.trim()) return;

    const parsedPrincipal = parseFloat(principalAmount.replace(",", ".")) || 0;
    const parsedInstallment = parseFloat(installmentAmount.replace(",", ".")) || 0;
    const parsedRate = parseFloat(interestRate.replace(",", ".")) || 0;
    const parsedTotal = parseInt(totalInstallments) || 1;
    const parsedPaid = parseInt(paidInstallments) || 0;
    const parsedDueDay = parseInt(dueDay) || 10;

    const remaining = Math.max(0, parsedTotal - parsedPaid);
    const initialBalance = remaining * parsedInstallment;

    addLoan({
      title: title.trim(),
      name: title.trim(),
      institution: institution.trim(),
      bank: institution.trim(),
      profileId: profileId || undefined,
      principalAmount: parsedPrincipal > 0 ? parsedPrincipal : initialBalance,
      originalAmount: parsedPrincipal > 0 ? parsedPrincipal : initialBalance,
      installmentAmount: parsedInstallment,
      currentInstallmentAmount: parsedInstallment,
      interestRate: parsedRate,
      monthlyInterestRate: parsedRate,
      totalInstallments: parsedTotal,
      paidInstallments: parsedPaid,
      dueDay: parsedDueDay,
      startDate: new Date(startDate).toISOString(),
      status: parsedPaid >= parsedTotal ? "PAID_OFF" : "ACTIVE",
      totalSaved: 0,
      currentBalance: initialBalance,
      notes: notes.trim() || undefined,
      payments: [],
    });

    onClose();
    // Limpar form
    setTitle("");
    setInstitution("");
    setPrincipalAmount("");
    setInstallmentAmount("");
    setInterestRate("");
    setTotalInstallments("36");
    setPaidInstallments("0");
    setDueDay("10");
    setNotes("");
  };

  // Preview de cálculo rápido
  const parsedTotal = parseInt(totalInstallments) || 0;
  const parsedPaid = parseInt(paidInstallments) || 0;
  const parsedInstallment = parseFloat(installmentAmount.replace(",", ".")) || 0;
  const remainingInstallments = Math.max(0, parsedTotal - parsedPaid);
  const estimatedBalance = remainingInstallments * parsedInstallment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-xl shadow-2xl border border-[#E8DFD1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <Landmark size={20} />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Novo Empréstimo / Financiamento
              </h3>
              <p className="text-xs text-[#786B5E]">
                Cadastre contratos ativos do casal para gerenciar amortizações
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
          {/* Título e Instituição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Nome do Contrato *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Financiamento Carro, Crédito Nubank..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-medium text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Banco / Financeira *
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ex: Santander, Caixa, Nubank, Itaú..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-medium text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Titular do Casal */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Titular Responsável
            </label>
            <div className="grid grid-cols-3 gap-2">
              {users.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setProfileId(u.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    profileId === u.id
                      ? "border-[#C46D53] bg-[#C46D53]/15 text-[#C46D53]"
                      : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                  }`}
                >
                  <span className="truncate">{u.name.split(" ")[0]}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setProfileId("")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  profileId === ""
                    ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#5B7052]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                <Users size={14} />
                <span className="truncate">Casal / Conjunto</span>
              </button>
            </div>
          </div>

          {/* Valor Contratado e Valor da Parcela */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Valor Total Contratado (R$)
              </label>
              <input
                type="text"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
                placeholder="Ex: 35000,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Valor da Parcela Mensal (R$) *
              </label>
              <input
                type="text"
                required
                value={installmentAmount}
                onChange={(e) => setInstallmentAmount(e.target.value)}
                placeholder="Ex: 1250,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Taxa de Juros Mensal e Dia de Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Taxa de Juros (% a.m.) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="Ex: 1.89 ou 2,45"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#786B5E]">
                  % a.m.
                </span>
              </div>
              <p className="text-[10px] text-[#786B5E] mt-0.5">
                Essencial para o cálculo de valor presente das amortizações.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Dia do Vencimento (1 a 31) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="Ex: 10"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Total de Parcelas e Quantas já foram pagas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Total de Parcelas do Contrato *
              </label>
              <input
                type="number"
                min="1"
                max="420"
                required
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                placeholder="Ex: 48, 60, 120..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Parcelas Já Quitadas Antes do App
              </label>
              <input
                type="number"
                min="0"
                max={totalInstallments || "1"}
                value={paidInstallments}
                onChange={(e) => setPaidInstallments(e.target.value)}
                placeholder="Ex: 12"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Data de Início e Notas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Data de Início do Contrato
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Observações (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Débito automático na conta"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Card de Resumo Automático */}
          <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E8DFD1] flex items-center justify-between text-xs">
            <div>
              <p className="text-[#786B5E]">Parcelas Restantes:</p>
              <p className="font-bold text-[#2C221E] text-sm">
                {remainingInstallments} de {parsedTotal || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#786B5E]">Saldo Bruto Faltante:</p>
              <p className="font-black text-[#C46D53] text-sm">
                {estimatedBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6] text-[#786B5E] hover:text-[#2C221E] font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C46D53] hover:bg-[#B35D43] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Landmark size={16} />
              Cadastrar Empréstimo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
