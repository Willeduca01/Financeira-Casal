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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[28px] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-[0_16px_50px_rgb(61,44,30,0.18)] animate-in zoom-in-95 duration-150">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center border border-[#C46D53]/30">
              <Zap size={18} className="fill-[#C46D53]" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black font-serif text-[#2C221E]">
                Adiantar Parcela / Amortizar
              </h3>
              <p className="text-[10px] text-[#C46D53] font-bold">
                Método Avalanche • Economia acelerada de juros
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#786B5E] hover:text-[#2C221E] rounded-xl hover:bg-[#F4EFE6] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selecionar Empréstimo */}
          <div>
            <label className="text-xs text-[#786B5E] font-medium block mb-1">
              Contrato a Amortizar
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
            >
              {activeLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — Taxa: {l.monthlyInterestRate}% a.m. (Saldo: {formatBRL(l.currentBalance)})
                </option>
              ))}
            </select>
          </div>

          {/* Destaque da taxa do contrato selecionado */}
          <div className="bg-[#F4EFE6] p-3.5 rounded-2xl border border-[#E6DEC8] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#2C221E]">
              <span>Saldo Atual: <strong>{formatBRL(targetLoan.currentBalance)}</strong></span>
              <span className="text-[#C46D53] font-bold">
                Taxa: {formatPercent(targetLoan.monthlyInterestRate)} a.m.
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#786B5E]">
              <span>Parcelas: {targetLoan.paidInstallments} / {targetLoan.totalInstallments}</span>
              <span>Parcela Mensal: {formatBRL(targetLoan.currentInstallmentAmount)}</span>
            </div>
          </div>

          {/* Valor a Pagar (Amortização) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-[#786B5E] font-medium">
                Valor Pago na Amortização (R$)
              </label>
              {freeWallet.projectedSurplus > 0 && (
                <button
                  type="button"
                  onClick={handleUseSurplus}
                  className="text-[10px] text-[#7A8B68] hover:text-[#657554] hover:underline flex items-center gap-1 font-bold transition-colors"
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
              className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-4 py-2.5 text-2xl font-black text-[#2C221E] placeholder-[#786B5E]/40 focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
            />
          </div>

          {/* Desconto de Juros */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-[#786B5E] font-medium">
                Desconto de Juros Obtido no Banco (R$)
              </label>
              <button
                type="button"
                onClick={handleAutoSuggestDiscount}
                className="text-[10px] text-[#C46D53] hover:underline font-bold"
              >
                Estimar economia
              </button>
            </div>
            <input
              type="text"
              placeholder="0,00"
              value={interestDiscount}
              onChange={(e) => setInterestDiscount(e.target.value)}
              className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2.5 text-xs text-[#2C221E] placeholder-[#786B5E]/50 focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
            />
            <p className="text-[10px] text-[#786B5E] mt-1">
              Informe o desconto concedido pelo banco ao adiantar a parcela ou clique em &quot;Estimar economia&quot;.
            </p>
          </div>

          {/* Tipo de Abatimento */}
          <div>
            <label className="text-xs text-[#786B5E] font-medium block mb-1.5">
              Tipo de Abatimento no Banco
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAbatementType("REDUCE_TERM")}
                className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                  abatementType === "REDUCE_TERM"
                    ? "bg-[#C46D53]/15 border-[#C46D53] text-[#2C221E] shadow-sm ring-1 ring-[#C46D53]"
                    : "bg-[#F4EFE6] border-[#E6DEC8] text-[#786B5E] hover:bg-[#E6DEC8]/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[#C46D53]">
                  <Clock size={13} />
                  Reduzir Prazo
                </div>
                <p className="text-[10px] text-[#786B5E] mt-0.5">
                  Abate parcelas do final do contrato (Recomendado)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAbatementType("REDUCE_INSTALLMENT")}
                className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                  abatementType === "REDUCE_INSTALLMENT"
                    ? "bg-[#C46D53]/15 border-[#C46D53] text-[#2C221E] shadow-sm ring-1 ring-[#C46D53]"
                    : "bg-[#F4EFE6] border-[#E6DEC8] text-[#786B5E] hover:bg-[#E6DEC8]/50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-[#C46D53]">
                  <DollarSign size={13} />
                  Reduzir Parcela
                </div>
                <p className="text-[10px] text-[#786B5E] mt-0.5">
                  Diminui o valor das parcelas mensais futuras
                </p>
              </button>
            </div>
          </div>

          {/* Campo específico conforme tipo */}
          {abatementType === "REDUCE_TERM" ? (
            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1">
                Parcelas Abatidas do Final
              </label>
              <input
                type="number"
                placeholder={`Sugerido: ${estimatedInstallmentsReduced} parcelas`}
                value={customInstallmentsReduced}
                onChange={(e) => setCustomInstallmentsReduced(e.target.value)}
                className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
              />
            </div>
          ) : (
            <div>
              <label className="text-xs text-[#786B5E] font-medium block mb-1">
                Novo Valor da Parcela Mensal (R$)
              </label>
              <input
                type="text"
                placeholder="Ex: 590,00"
                value={newInstallmentAmount}
                onChange={(e) => setNewInstallmentAmount(e.target.value)}
                className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl px-3.5 py-2.5 text-xs text-[#2C221E] focus:outline-none focus:border-[#C46D53] focus:ring-2 focus:ring-[#C46D53]/15 transition-all"
              />
            </div>
          )}

          {/* Resumo da Simulação */}
          <div className="p-3.5 bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between text-[#786B5E]">
              <span>Total Abatido da Dívida:</span>
              <span className="font-bold text-[#2C221E]">{formatBRL(totalAbated)}</span>
            </div>
            <div className="flex justify-between text-[#786B5E]">
              <span>Novo Saldo Devedor:</span>
              <span className="font-black text-[#7A8B68]">
                {formatBRL(projectedBalance)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-full bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] font-bold text-sm shadow-md shadow-[#C46D53]/25 transition-transform active:scale-[0.98]"
          >
            Confirmar Amortização Extraordinária
          </button>
        </form>
      </div>
    </div>
  );
};
