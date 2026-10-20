"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatPercent, estimateInterestSavings } from "@/lib/utils";
import { AbatementType, Loan } from "@/types";
import { X, Zap, Sparkles, TrendingDown, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface AmortizationModalProps {
  isOpen: boolean;
  loanId?: string;
  onClose: () => void;
}

export const AmortizationModal: React.FC<AmortizationModalProps> = ({
  isOpen,
  loanId,
  onClose,
}) => {
  const { loans, amortizeLoan, freeWallet } = useFinance();

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");

  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    loanId || (activeLoans[0]?.id ?? "")
  );

  useEffect(() => {
    if (loanId) {
      setSelectedLoanId(loanId);
    } else if (activeLoans[0]) {
      setSelectedLoanId(activeLoans[0].id);
    }
  }, [loanId, activeLoans]);

  const targetLoan = loans.find((l) => l.id === selectedLoanId);

  const [amountPaid, setAmountPaid] = useState<string>("");
  const [interestDiscount, setInterestDiscount] = useState<string>("");
  const [abatementType, setAbatementType] = useState<AbatementType>("REDUCE_TERM");
  const [customInstallmentsReduced, setCustomInstallmentsReduced] = useState<string>("");
  const [newInstallmentAmount, setNewInstallmentAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  if (!isOpen || !targetLoan) return null;

  const parsedAmountPaid = parseFloat(amountPaid.replace(",", ".")) || 0;
  const parsedInterestDiscount = parseFloat(interestDiscount.replace(",", ".")) || 0;
  const totalAbated = parsedAmountPaid + parsedInterestDiscount;
  const projectedBalance = Math.max(0, targetLoan.currentBalance - totalAbated);

  // Sugestão automática de parcelas abatidas no caso de redução de prazo
  const estimatedInstallmentsReduced =
    targetLoan.currentInstallmentAmount > 0
      ? Math.max(1, Math.round(totalAbated / targetLoan.currentInstallmentAmount))
      : 1;

  // Sugestão automática de desconto de juros caso ainda não preenchido
  const handleAutoSuggestDiscount = () => {
    if (parsedAmountPaid > 0) {
      const remaining = targetLoan.totalInstallments - targetLoan.paidInstallments;
      const suggested = estimateInterestSavings(
        parsedAmountPaid,
        targetLoan.monthlyInterestRate,
        remaining
      );
      setInterestDiscount(suggested.toString());
    }
  };

  const handleUseSurplus = () => {
    if (freeWallet.projectedSurplus > 0) {
      setAmountPaid(freeWallet.projectedSurplus.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmountPaid <= 0) return;

    const installmentsToReduce =
      abatementType === "REDUCE_TERM"
        ? customInstallmentsReduced
          ? parseInt(customInstallmentsReduced)
          : estimatedInstallmentsReduced
        : 0;

    const newInstallment =
      abatementType === "REDUCE_INSTALLMENT"
        ? newInstallmentAmount
          ? parseFloat(newInstallmentAmount.replace(",", "."))
          : Math.max(0, targetLoan.currentInstallmentAmount * 0.8)
        : undefined;

    amortizeLoan(targetLoan.id, {
      amountPaid: parsedAmountPaid,
      interestDiscount: parsedInterestDiscount,
      abatementType,
      installmentsReduced: installmentsToReduce,
      newInstallmentAmount: newInstallment,
      notes: notes || "Amortização extraordinária via Método Avalanche",
    });

    // Se o saldo foi zerado, celebração!
    if (projectedBalance <= 0) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Zap size={18} className="fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white">
                Adiantar Parcela / Amortizar
              </h3>
              <p className="text-[10px] text-amber-300">
                Método Avalanche • Economia acelerada de juros
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selecionar Empréstimo */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Contrato a Amortizar
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {activeLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — Taxa: {l.monthlyInterestRate}% a.m. (Saldo: {formatBRL(l.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* Destaque da taxa do contrato selecionado */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Saldo Atual: <strong>{formatBRL(targetLoan.currentBalance)}</strong></span>
              <span className="text-amber-400 font-bold">
                Taxa: {formatPercent(targetLoan.monthlyInterestRate)} a.m.
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Parcelas: {targetLoan.paidInstallments} / {targetLoan.totalInstallments}</span>
              <span>Parcela Mensal: {formatBRL(targetLoan.currentInstallmentAmount)}</span>
            </div>
          </div>

          {/* Valor a Pagar (Amortização) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">
                Valor Pago na Amortização (R$)
              </label>
              {freeWallet.projectedSurplus > 0 && (
                <button
                  type="button"
                  onClick={handleUseSurplus}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Sparkles size={11} />
                  Usar sobra do mês ({formatBRL(freeWallet.projectedSurplus)})
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="0,00"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
              autoFocus
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-2.5 text-xl font-black text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Desconto de Juros */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-slate-400">
                Desconto de Juros Obtido no Banco (R$)
              </label>
              <button
                type="button"
                onClick={handleAutoSuggestDiscount}
                className="text-[10px] text-amber-300 hover:underline font-medium"
              >
                Estimar economia
              </button>
            </div>
            <input
              type="text"
              placeholder="0,00"
              value={interestDiscount}
              onChange={(e) => setInterestDiscount(e.target.value)}
              className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Informe o desconto concedido pelo banco ao adiantar a parcela ou clique em &quot;Estimar economia&quot;.
            </p>
          </div>

          {/* Tipo de Abatimento */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Tipo de Abatimento no Banco
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAbatementType("REDUCE_TERM")}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  abatementType === "REDUCE_TERM"
                    ? "bg-amber-500/20 border-amber-500/50 text-white shadow-md"
                    : "border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Clock size={13} />
                  Reduzir Prazo
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Abate parcelas do final do contrato (Recomendado)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAbatementType("REDUCE_INSTALLMENT")}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  abatementType === "REDUCE_INSTALLMENT"
                    ? "bg-amber-500/20 border-amber-500/50 text-white shadow-md"
                    : "border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <DollarSign size={13} />
                  Reduzir Parcela
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Diminui o valor das parcelas mensais futuras
                </p>
              </button>
            </div>
          </div>

          {/* Campo específico conforme tipo */}
          {abatementType === "REDUCE_TERM" ? (
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Parcelas Abatidas do Final
              </label>
              <input
                type="number"
                placeholder={`Sugerido: ${estimatedInstallmentsReduced} parcelas`}
                value={customInstallmentsReduced}
                onChange={(e) => setCustomInstallmentsReduced(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Novo Valor da Parcela Mensal (R$)
              </label>
              <input
                type="text"
                placeholder="Ex: 590,00"
                value={newInstallmentAmount}
                onChange={(e) => setNewInstallmentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Resumo da Simulação */}
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Total Abatido da Dívida:</span>
              <span className="font-bold text-white">{formatBRL(totalAbated)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Novo Saldo Devedor:</span>
              <span className="font-black text-emerald-400">
                {formatBRL(projectedBalance)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
          >
            Confirmar Amortização Extraordinária
          </button>
        </form>
      </div>
    </div>
  );
};
