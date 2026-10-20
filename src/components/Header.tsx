"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL } from "@/lib/utils";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Check,
} from "lucide-react";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const Header: React.FC = () => {
  const {
    currentUser,
    switchUser,
    users,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    freeWallet,
    resetAllData,
  } = useFinance();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-base md:text-lg text-white leading-tight">
                Casal Avalanche
              </h1>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pote Único
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Lucas & Mariana • Quitação Acelerada
            </p>
          </div>
        </div>

        {/* Seletor de Mês/Ano */}
        <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl px-2 py-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 text-xs md:text-sm font-semibold text-slate-200 min-w-[100px] text-center">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Seletor de Perfil do Casal (Alternador Rápido) */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 bg-slate-900/90 border border-white/10 hover:border-indigo-500/40 rounded-xl p-1.5 pr-2.5 transition-all shadow-md group"
            title="Alternar entre Lucas e Mariana"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover ring-2 ring-indigo-500/50"
            />
            <div className="text-left hidden sm:block">
              <p className="text-[10px] text-slate-400 leading-none">Logado como</p>
              <p className="text-xs font-semibold text-white leading-tight">
                {currentUser.name.split(" ")[0]}
              </p>
            </div>
            <Users size={14} className="text-slate-400 group-hover:text-indigo-400" />
          </button>

          {/* Dropdown de Usuário */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/15 rounded-2xl p-2 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                Quem está usando agora?
              </p>
              {users.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-indigo-600/30 border border-indigo-500/40 text-white"
                        : "hover:bg-white/5 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-xs font-medium text-white">{user.name}</p>
                        <p className="text-[10px] text-slate-400">
                          Líquido: {formatBRL(user.salaryNet)}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-indigo-400" />}
                  </button>
                );
              })}

              <div className="border-t border-white/10 mt-2 pt-2">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowConfirmReset(true);
                  }}
                  className="w-full flex items-center gap-2 p-1.5 px-2 rounded-lg text-[11px] text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <RotateCcw size={12} />
                  Restaurar dados de teste
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw size={18} className="text-rose-400" />
              Restaurar dados iniciais?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Isso recarregará os dados mockados originais do casal Lucas & Mariana com todos
              os empréstimos e despesas de exemplo.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowConfirmReset(false);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white"
              >
                Sim, restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
