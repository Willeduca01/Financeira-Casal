"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Loan } from "@/types";
import { X, Landmark, Trash2, Users } from "lucide-react";

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
}

export const EditLoanModal: React.FC<EditLoanModalProps> = ({ isOpen, onClose, loan }) => {
  const { users, updateLoan, deleteLoan } = useFinance();

  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [profileId, setProfileId] = useState("");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("36");
  const [paidInstallments, setPaidInstallments] = useState("0");
  const [dueDay, setDueDay] = useState("10");
  const [status, setStatus] = useState<"ACTIVE" | "PAID_OFF">("ACTIVE");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (loan) {
      setTitle(loan.title || loan.name || "");
      setInstitution(loan.institution || loan.bank || "");
      setProfileId(loan.profileId || "");
      setPrincipalAmount(String(loan.principalAmount ?? loan.originalAmount ?? ""));
      setInstallmentAmount(String(loan.installmentAmount ?? loan.currentInstallmentAmount ?? ""));
      setInterestRate(String(loan.interestRate ?? loan.monthlyInterestRate ?? ""));
      setTotalInstallments(String(loan.totalInstallments || 36));
      setPaidInstallments(String(loan.paidInstallments || 0));
      setDueDay(String(loan.dueDay || 10));
      setStatus(loan.status || "ACTIVE");
      setNotes(loan.notes || "");
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

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
    const newBalance = remaining * parsedInstallment;

    updateLoan(loan.id, {
      title: title.trim(),
      name: title.trim(),
      institution: institution.trim(),
      bank: institution.trim(),
      profileId: profileId || undefined,
      principalAmount: parsedPrincipal,
      originalAmount: parsedPrincipal,
      installmentAmount: parsedInstallment,
      currentInstallmentAmount: parsedInstallment,
      interestRate: parsedRate,
      monthlyInterestRate: parsedRate,
      totalInstallments: parsedTotal,
      paidInstallments: parsedPaid,
      dueDay: parsedDueDay,
      status: parsedPaid >= parsedTotal ? "PAID_OFF" : status,
      currentBalance: newBalance,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir o empréstimo "${loan.title || loan.name}"?`)) {
      deleteLoan(loan.id);
      onClose();
    }
  };

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
                Editar Empréstimo
              </h3>
              <p className="text-xs text-[#786B5E]">
                Atualize as condições ou parcelas do contrato
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-medium text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Titular */}
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

          {/* Valor Contratado e Parcela */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Valor Total Contratado (R$)
              </label>
              <input
                type="text"
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(e.target.value)}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Taxa de Juros e Dia de Vencimento */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#786B5E]">
                  % a.m.
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Dia do Vencimento *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
          </div>

          {/* Parcelas e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Total de Parcelas *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Parcelas Pagas *
              </label>
              <input
                type="number"
                min="0"
                value={paidInstallments}
                onChange={(e) => setPaidInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "PAID_OFF")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
              >
                <option value="ACTIVE">Ativo</option>
                <option value="PAID_OFF">Quitado</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Observações
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Contrato renegociado em 2026"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-sm focus:outline-hidden focus:border-[#C46D53]"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={16} />
              Excluir
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6] text-[#786B5E] hover:text-[#2C221E] font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C46D53] hover:bg-[#B35D43] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
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
