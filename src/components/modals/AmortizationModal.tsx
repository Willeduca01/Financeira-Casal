"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, formatPercent, calculatePresentValueAbatement } from "@/lib/utils";
import { LoanStrategy } from "@/types";
import {
  X,
  Zap,
  Clock,
  DollarSign,
  TrendingDown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
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
  const { loans, amortizeLoanEarly, freeWallet } = useFinance();

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");

  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    loanId || (activeLoans[0]?.id ?? "")
  );

  useEffect(() => {
    if (loanId) {
      setSelectedLoanId(loanId);
    } else if (activeLoans[0] && !selectedLoanId) {
      setSelectedLoanId(activeLoans[0].id);
    }
  }, [loanId, activeLoans, selectedLoanId]);

  const targetLoan = loans.find((l) => l.id === selectedLoanId);

  // Quantidade de parcelas restantes
  const totalInstallments = targetLoan ? targetLoan.totalInstallments : 1;
  const paidInstallments = targetLoan ? targetLoan.paidInstallments : 0;
  const remainingInstallments = Math.max(1, totalInstallments - paidInstallments);

  // Estado do formulário
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [strategy, setStrategy] = useState<LoanStrategy>("TERM_REDUCTION");
  const [customPaidValue, setCustomPaidValue] = useState<string>("");
  const [isCustomPaidManuallyEdited, setIsCustomPaidManuallyEdited] = useState<boolean>(false);
  const [customNewInstallment, setCustomNewInstallment] = useState<string>("");
  const [registerTransaction, setRegisterTransaction] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");

  // Sempre que trocar de contrato, reseta para 1 parcela
  useEffect(() => {
    setInstallmentsCount(1);
    setIsCustomPaidManuallyEdited(false);
    setCustomPaidValue("");
  }, [selectedLoanId]);

  // Cálculo automático do Valor Presente e Desconto
  const installmentAmount = targetLoan ? (targetLoan.installmentAmount ?? targetLoan.currentInstallmentAmount ?? 0) : 0;
  const monthlyRate = targetLoan ? (targetLoan.interestRate ?? targetLoan.monthlyInterestRate ?? 0) : 0;

  const abatementCalc = useMemo(() => {
    if (!targetLoan || installmentAmount <= 0) {
      return { originalValue: 0, presentValue: 0, savedAmount: 0, discountPercentage: 0 };
    }
    return calculatePresentValueAbatement(
      installmentAmount,
      monthlyRate,
      installmentsCount,
      remainingInstallments
    );
  }, [targetLoan, installmentAmount, monthlyRate, installmentsCount, remainingInstallments]);

  // Se o usuário não editou manualmente, mantém sincronizado com a estimativa de valor presente
  useEffect(() => {
    if (!isCustomPaidManuallyEdited && abatementCalc.presentValue > 0) {
      setCustomPaidValue(abatementCalc.presentValue.toFixed(2));
    }
  }, [abatementCalc.presentValue, isCustomPaidManuallyEdited]);

  if (!isOpen || !targetLoan) return null;

  // Valores finais consolidados
  const effectivePaid = customPaidValue
    ? parseFloat(customPaidValue.replace(",", ".")) || abatementCalc.presentValue
    : abatementCalc.presentValue;

  const originalValue = abatementCalc.originalValue;
  const effectiveSaved = Math.max(0, originalValue - effectivePaid);
  const effectiveDiscountPercent =
    originalValue > 0 ? (effectiveSaved / originalValue) * 100 : 0;

  // Estimativa de nova parcela caso redução de parcela seja escolhida
  const remainingAfter = Math.max(1, remainingInstallments);
  const estimatedNewInstallmentAmount =
    strategy === "INSTALLMENT_REDUCTION"
      ? Math.max(1, (targetLoan.currentBalance - effectivePaid) / remainingAfter)
      : installmentAmount;

  const handleInstallmentsChange = (count: number) => {
    const clamped = Math.max(1, Math.min(remainingInstallments, count));
    setInstallmentsCount(clamped);
    setIsCustomPaidManuallyEdited(false);
  };

  const handleUseSurplus = () => {
    if (freeWallet.projectedSurplus > 0) {
      setCustomPaidValue(freeWallet.projectedSurplus.toFixed(2));
      setIsCustomPaidManuallyEdited(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectivePaid <= 0 || installmentsCount <= 0) return;

    amortizeLoanEarly({
      loanId: targetLoan.id,
      installmentsAbated: installmentsCount,
      originalValue,
      paidValue: effectivePaid,
      strategy,
      newInstallmentAmount:
        strategy === "INSTALLMENT_REDUCTION"
          ? customNewInstallment
            ? parseFloat(customNewInstallment.replace(",", "."))
            : estimatedNewInstallmentAmount
          : undefined,
      registerTransaction,
      notes: notes.trim() || undefined,
    });

    // Se quitou tudo, solta confetti
    if (
      (strategy === "TERM_REDUCTION" && installmentsCount >= remainingInstallments) ||
      effectivePaid >= targetLoan.currentBalance
    ) {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.5 },
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C221E]/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] rounded-3xl w-full max-w-xl shadow-2xl border border-[#E8DFD1] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-[#F4EFE6] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center shadow-xs">
              <Zap size={20} className="fill-[#FBF9F5]" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#2C221E] leading-tight">
                Quitação / Amortização Antecipada
              </h3>
              <p className="text-xs text-[#C46D53] font-bold">
                Cálculo a Valor Presente • Economia de Juros pelo Banco
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
          {/* Seleção do Empréstimo */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Contrato a Antecipar
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-bold text-sm focus:outline-hidden focus:border-[#C46D53]"
            >
              {activeLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title || l.name} ({l.institution || l.bank}) — {l.interestRate ?? l.monthlyInterestRate}% a.m. (Faltam {l.totalInstallments - l.paidInstallments} parcelas)
                </option>
              ))}
            </select>
          </div>

          {/* Banner com dados do contrato selecionado */}
          <div className="p-3.5 rounded-2xl bg-[#F4EFE6] border border-[#E8DFD1] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#786B5E]">Taxa Mensal:</span>{" "}
              <strong className="text-[#C46D53] font-black">{formatPercent(monthlyRate)} a.m.</strong>
            </div>
            <div>
              <span className="text-[#786B5E]">Parcela Mensal:</span>{" "}
              <strong className="text-[#2C221E]">{formatBRL(installmentAmount)}</strong>
            </div>
            <div>
              <span className="text-[#786B5E]">Restantes:</span>{" "}
              <strong className="text-[#2C221E]">{remainingInstallments} meses</strong>
            </div>
          </div>

          {/* Seletor de Quantidade de Parcelas a Antecipar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider">
                Quantas parcelas desejam antecipar?
              </label>
              <span className="text-sm font-black text-[#C46D53] bg-[#C46D53]/15 px-2.5 py-0.5 rounded-lg">
                {installmentsCount} {installmentsCount === 1 ? "parcela" : "parcelas"}
              </span>
            </div>

            {/* Slider interativo */}
            <input
              type="range"
              min={1}
              max={remainingInstallments}
              value={installmentsCount}
              onChange={(e) => handleInstallmentsChange(parseInt(e.target.value) || 1)}
              className="w-full h-2 bg-[#E8DFD1] rounded-lg appearance-none cursor-pointer accent-[#C46D53]"
            />

            {/* Atalhos rápidos de parcelas */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-[#786B5E] font-medium mr-1">Atalhos:</span>
              {[1, 2, 3, 6, 12]
                .filter((n) => n <= remainingInstallments)
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleInstallmentsChange(n)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      installmentsCount === n
                        ? "bg-[#C46D53] text-white"
                        : "bg-[#F4EFE6] text-[#786B5E] hover:bg-[#E8DFD1]"
                    }`}
                  >
                    +{n}
                  </button>
                ))}
              {remainingInstallments > 1 && (
                <button
                  type="button"
                  onClick={() => handleInstallmentsChange(remainingInstallments)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    installmentsCount === remainingInstallments
                      ? "bg-[#7A8B68] text-white"
                      : "bg-[#7A8B68]/15 text-[#5B7052] hover:bg-[#7A8B68]/25"
                  }`}
                >
                  Quitar Tudo ({remainingInstallments})
                </button>
              )}
            </div>
          </div>

          {/* Card de Destaque Visual em Tempo Real */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FBF9F5] via-[#F4EFE6] to-[#EFE7D8] border-2 border-[#7A8B68]/40 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DFD1]">
              <span className="text-xs font-bold text-[#786B5E] uppercase tracking-wider">
                Simulação da Antecipação (Últimas {installmentsCount} do contrato)
              </span>
              <span className="text-[11px] font-black text-[#5B7052] bg-[#7A8B68]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} />
                Desconto Estimado
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center sm:text-left">
              <div>
                <p className="text-[10px] text-[#786B5E] font-bold uppercase">Valor Cheio Original</p>
                <p className="text-sm font-bold text-[#786B5E] line-through">
                  {formatBRL(originalValue)}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-[#2C221E] font-bold uppercase">Valor Pago c/ Desconto</p>
                <p className="text-base font-black text-[#2C221E]">
                  {formatBRL(effectivePaid)}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-[#7A8B68]/15 p-2 rounded-xl border border-[#7A8B68]/30">
                <p className="text-[10px] text-[#5B7052] font-black uppercase">Economia Real Gerada</p>
                <p className="text-base font-black text-[#5B7052] leading-tight">
                  {formatBRL(effectiveSaved)}
                </p>
                <span className="text-[10px] font-bold text-[#5B7052]">
                  ({effectiveDiscountPercent.toFixed(1)}% de economia)
                </span>
              </div>
            </div>
          </div>

          {/* Campo editável: Valor Efetivamente Pago no Boleto */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider">
                Valor Efetivamente Pago no Boleto (R$) *
              </label>
              {freeWallet.projectedSurplus > 0 && (
                <button
                  type="button"
                  onClick={handleUseSurplus}
                  className="text-[10px] text-[#7A8B68] hover:underline font-bold flex items-center gap-1"
                >
                  <Sparkles size={11} />
                  Usar sobra do mês ({formatBRL(freeWallet.projectedSurplus)})
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={customPaidValue}
                onChange={(e) => {
                  setCustomPaidValue(e.target.value);
                  setIsCustomPaidManuallyEdited(true);
                }}
                placeholder="0,00"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] font-black text-xl focus:outline-hidden focus:border-[#C46D53]"
              />
              <button
                type="button"
                onClick={() => {
                  setIsCustomPaidManuallyEdited(false);
                  setCustomPaidValue(abatementCalc.presentValue.toFixed(2));
                }}
                className="absolute right-3 top-2.5 text-[11px] font-bold text-[#C46D53] hover:underline"
              >
                Resetar p/ estimativa
              </button>
            </div>
            <p className="text-[10px] text-[#786B5E] mt-1">
              Pré-preenchido pelo cálculo a valor presente [VP = &Sigma; Parcela / (1+i)&#x207F;]. Se o boleto do seu banco tiver centavos de diferença, basta digitar aqui o valor exato.
            </p>
          </div>

          {/* Seletor de Modalidade de Amortização */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1.5">
              Modalidade de Amortização
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setStrategy("TERM_REDUCTION")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  strategy === "TERM_REDUCTION"
                    ? "border-[#C46D53] bg-[#C46D53]/15 text-[#2C221E] ring-1 ring-[#C46D53]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-[#C46D53]">
                  <Clock size={16} />
                  <span>Abater no Prazo</span>
                </div>
                <p className="text-[11px] text-[#786B5E] mt-1 leading-relaxed">
                  Elimina as <strong>{installmentsCount} últimas parcelas</strong> do final do contrato. Maior economia total de juros!
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStrategy("INSTALLMENT_REDUCTION")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  strategy === "INSTALLMENT_REDUCTION"
                    ? "border-[#7A8B68] bg-[#7A8B68]/15 text-[#2C221E] ring-1 ring-[#7A8B68]"
                    : "border-[#E8DFD1] bg-[#F4EFE6]/50 text-[#786B5E] hover:border-[#786B5E]"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-[#5B7052]">
                  <DollarSign size={16} />
                  <span>Reduzir Parcela Mensal</span>
                </div>
                <p className="text-[11px] text-[#786B5E] mt-1 leading-relaxed">
                  Mantém o prazo e diminui a mensalidade (estimada em ~{formatBRL(estimatedNewInstallmentAmount)}/mês).
                </p>
              </button>
            </div>
          </div>

          {/* Checkbox de Registro no Fluxo de Caixa */}
          <div className="p-3 rounded-xl bg-[#F4EFE6]/70 border border-[#E8DFD1] flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="registerTransactionCheck"
              checked={registerTransaction}
              onChange={(e) => setRegisterTransaction(e.target.checked)}
              className="w-4 h-4 rounded text-[#C46D53] focus:ring-[#C46D53] accent-[#C46D53] cursor-pointer"
            />
            <label htmlFor="registerTransactionCheck" className="text-xs text-[#2C221E] font-bold cursor-pointer select-none">
              Registrar saída no fluxo de caixa deste mês
              <span className="block text-[10px] text-[#786B5E] font-normal">
                Gera um lançamento de débito na lista de transações para manter o saldo da conta alinhado.
              </span>
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-[#786B5E] uppercase tracking-wider mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Antecipação com o 13º salário / sobra do mês"
              className="w-full px-3.5 py-2 rounded-xl border border-[#E8DFD1] bg-[#F4EFE6]/40 text-[#2C221E] text-xs focus:outline-hidden focus:border-[#C46D53]"
            />
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
              <Zap size={16} className="fill-white" />
              Confirmar Quitação Antecipada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
