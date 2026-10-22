"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Heart,
  Calendar,
  Sparkles,
  Menu,
  Lock,
  KeyRound,
  LogOut,
  Settings,
} from "lucide-react";
import dynamic from "next/dynamic";
import { TabType } from "@/components/BottomNav";

const ChangePinModal = dynamic(
  () => import("@/components/modals/ChangePinModal").then((m) => m.ChangePinModal),
  { ssr: false }
);

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onNavigateTab?: (tab: TabType) => void;
}

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

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onNavigateTab }) => {
  const {
    currentUser,
    switchUser,
    users,
    coupleSettings,
    logout,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    resetAllData,
    refreshFinances,
    isSyncing,
  } = useFinance();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);

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
    <header className="w-full bg-[#C46D53] text-[#FBF9F5] rounded-b-[36px] shadow-lg shadow-[#C46D53]/15 pt-5 pb-12 px-4 relative z-20 transition-all">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Linha Superior: Ícone Decorativo, Título Central e Avatares Sobrepostos */}
        <div className="flex items-center justify-between gap-3">
          {/* Lado Esquerdo: Menu Mobile ou Ícone Afetuoso */}
          <div className="flex items-center gap-2">
            {onOpenMobileMenu && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className="md:hidden p-2 rounded-2xl bg-white/15 hover:bg-white/25 text-[#FBF9F5] transition-all backdrop-blur-sm border border-white/20 active:scale-95"
                aria-label="Abrir menu de navegação"
                title="Menu"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-sm hidden sm:flex items-center justify-center text-[#FBF9F5] shadow-inner">
              <Heart size={18} className="fill-[#FBF9F5]/80 text-[#FBF9F5]" />
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] tracking-wider uppercase font-semibold text-[#FBF9F5]/75 block leading-none">
                Finanças a Dois
              </span>
              <span className="text-xs font-serif font-bold text-[#FBF9F5]">
                {coupleSettings.coupleName || (users[0] && users[1] ? `${users[0].name.split(" ")[0]} & ${users[1].name.split(" ")[0]}` : "Finanças do Casal")}
              </span>
            </div>
          </div>

          {/* Centro: Título com Tipografia Serifada Acolhedora */}
          <div className="text-center">
            <h1 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-[#FBF9F5]">
              {coupleSettings.coupleName || "Casal Avalanche"}
            </h1>
            <div className="inline-flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBF9F5]/60 animate-pulse" />
              <span className="text-[11px] font-medium tracking-wide text-[#FBF9F5]/90">
                Pote Único &bull; Quitação Acelerada
              </span>
            </div>
          </div>

          {/* Lado Direito: Sincronização em Nuvem, Bloqueio e Avatares */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshFinances()}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-white/15 hover:bg-white/25 text-[#FBF9F5] rounded-full text-xs font-medium transition-all backdrop-blur-sm border border-white/20 shadow-sm active:scale-95 disabled:opacity-50 ${
                isSyncing ? "animate-pulse" : ""
              }`}
              title="Sincronizar com o banco de dados Neon em tempo real"
              aria-label="Sincronizar"
            >
              <RotateCcw size={13} className={isSyncing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{isSyncing ? "Sincronizando..." : "Sincronizar"}</span>
            </button>

            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-[#FBF9F5] rounded-full text-xs font-medium transition-all backdrop-blur-sm border border-white/20 shadow-sm"
              title="Bloquear aplicativo com PIN"
            >
              <Lock size={13} />
              <span>Bloquear</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center -space-x-2.5 p-1 bg-white/15 hover:bg-white/25 rounded-full transition-all backdrop-blur-sm border border-white/20 shadow-sm group"
                title="Perfil ativo & configurações"
                aria-label="Perfil ativo e opções"
              >
                {users.map((u) => {
                  const isActive = u.id === currentUser.id;
                  return (
                    <div key={u.id} className="relative">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className={`w-8 h-8 rounded-full object-cover ring-2 transition-transform ${
                          isActive
                            ? "ring-[#FBF9F5] scale-105 z-10 shadow-md"
                            : "ring-[#C46D53] opacity-85 hover:opacity-100"
                        }`}
                      />
                      {isActive && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#7A8B68] rounded-full ring-2 ring-[#FBF9F5]" />
                      )}
                    </div>
                  );
                })}
              </button>

              {/* Dropdown de Alternância de Perfil & Segurança */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2.5 w-64 bg-[#FBF9F5] border border-[#E6DEC8] rounded-[24px] p-2.5 shadow-[0_12px_40px_rgba(61,44,30,0.15)] z-50 text-[#2C221E] animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#786B5E]">
                      Quem está usando agora?
                    </p>
                    <span className="text-[10px] font-semibold text-[#7A8B68] bg-[#7A8B68]/10 px-2 py-0.5 rounded-full">
                      Autenticado
                    </span>
                  </div>

                  <div className="space-y-1 mt-1">
                    {users.map((user) => {
                      const isSelected = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchUser(user.id);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-2xl text-left transition-all ${
                            isSelected
                              ? "bg-[#C46D53]/10 text-[#C46D53] font-bold border border-[#C46D53]/30"
                              : "hover:bg-[#F4EFE6] text-[#2C221E]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#E6DEC8]"
                            />
                            <div>
                              <p className="text-xs font-bold leading-tight">
                                {user.name}
                              </p>
                              <p className="text-[10px] text-[#786B5E]">
                                Líquido: {formatBRL(user.salaryNet)}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Segurança e Opções de Conta */}
                  <div className="border-t border-[#E6DEC8] mt-2 pt-2 space-y-1">
                    {onNavigateTab && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onNavigateTab("settings");
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-[#2C221E] hover:bg-[#F4EFE6] transition-colors font-medium text-left"
                      >
                        <Settings size={14} className="text-[#C46D53]" />
                        <span>Configurações do Perfil & Casal</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        refreshFinances();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-[#2C221E] hover:bg-[#F4EFE6] transition-colors font-medium text-left"
                    >
                      <RotateCcw size={14} className={`text-[#C46D53] ${isSyncing ? "animate-spin" : ""}`} />
                      <span>{isSyncing ? "Sincronizando com a Nuvem..." : "Atualizar Dados com a Nuvem"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setIsChangePinModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-[#2C221E] hover:bg-[#F4EFE6] transition-colors font-medium text-left"
                    >
                      <KeyRound size={14} className="text-[#C46D53]" />
                      <span>Alterar meu PIN (4 dígitos)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-[#786B5E] hover:bg-[#C46D53]/10 hover:text-[#C46D53] transition-colors font-medium text-left"
                    >
                      <LogOut size={14} />
                      <span>Bloquear / Trocar perfil</span>
                    </button>
                  </div>

                  <div className="border-t border-[#E6DEC8] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setShowConfirmReset(true);
                      }}
                      className="w-full flex items-center gap-2 p-1.5 px-2 rounded-xl text-[11px] text-[#B05B42] hover:bg-[#C46D53]/10 transition-colors font-medium"
                    >
                      <RotateCcw size={12} />
                      Limpar dados e recomeçar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linha Inferior: Seletor de Mês como Pílula Translúcida */}
        <div className="flex items-center justify-center pt-1">
          <div className="flex items-center bg-white/15 backdrop-blur-md rounded-full px-2 py-1 shadow-sm border border-white/20">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/20 rounded-full text-[#FBF9F5] transition-colors"
              title="Mês anterior"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-0.5 text-xs sm:text-sm font-semibold tracking-wide text-[#FBF9F5] min-w-[130px] justify-center">
              <Calendar size={13} className="text-[#FBF9F5]/80" />
              <span>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/20 rounded-full text-[#FBF9F5] transition-colors"
              title="Próximo mês"
              aria-label="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Reset com Tema Aconchegante */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[28px] max-w-sm w-full p-6 space-y-4 shadow-2xl text-[#2C221E] animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-2xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center">
              <RotateCcw size={20} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#2C221E]">
              Limpar dados e recomeçar?
            </h3>
            <p className="text-xs text-[#786B5E] leading-relaxed">
              Isso limpará os lançamentos demonstrativos antigos para você começar a cadastrar suas finanças reais. Seus perfis e fotos serão mantidos.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#F4EFE6] text-[#786B5E] hover:bg-[#E6DEC8] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowConfirmReset(false);
                }}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] shadow-md transition-all"
              >
                Sim, limpar dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alteração de PIN do Integrante Ativo */}
      <ChangePinModal
        isOpen={isChangePinModalOpen}
        onClose={() => setIsChangePinModalOpen(false)}
      />
    </header>
  );
};
