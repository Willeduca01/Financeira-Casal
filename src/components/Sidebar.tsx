"use client";

import React from "react";
import { useFinance } from "@/context/FinanceContext";
import { TabType } from "@/components/BottomNav";
import {
  LayoutDashboard,
  ReceiptText,
  Zap,
  ShieldCheck,
  Plus,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Mountain,
  CreditCard,
  Settings,
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

interface SidebarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenNewTransaction: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  onOpenNewTransaction,
  isOpenMobile,
  onCloseMobile,
}) => {
  const {
    currentUser,
    switchUser,
    users,
    coupleSettings,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  } = useFinance();

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

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: "dashboard",
      label: "Visão Geral",
      icon: <LayoutDashboard size={20} className="shrink-0" />,
    },
    {
      id: "cards",
      label: "Cartões & Benefícios",
      icon: <CreditCard size={20} className="shrink-0" />,
      badge: "Crédito & VR/VA",
    },
    {
      id: "transactions",
      label: "Extrato & Carteiras",
      icon: <ReceiptText size={20} className="shrink-0" />,
    },
    {
      id: "loans",
      label: "Método Avalanche",
      icon: <Mountain size={20} className="shrink-0" />,
      badge: "Alvo nº 1",
    },
    {
      id: "fixed-reserve",
      label: "Gastos Fixos & Reserva",
      icon: <ShieldCheck size={20} className="shrink-0" />,
    },
    {
      id: "settings",
      label: "Configurações",
      icon: <Settings size={20} className="shrink-0" />,
      badge: "Perfil",
    },
  ];

  const handleSelectTab = (tab: TabType) => {
    onChangeTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-5 space-y-6">
      {/* Topo: Logo & Identidade do Casal */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center shadow-md shadow-[#C46D53]/25">
              <Heart size={20} className="fill-[#FBF9F5]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-black text-[#2C221E] leading-tight tracking-tight">
                {coupleSettings.coupleName || "Casal Avalanche"}
              </h2>
              <span className="text-[11px] font-semibold text-[#786B5E] block">
                Pote Único &bull; Finanças
              </span>
            </div>
          </div>

          {/* Botão fechar apenas no mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 text-[#786B5E] hover:text-[#2C221E] rounded-xl hover:bg-[#F4EFE6] transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botão de Destaque: + Novo Lançamento */}
        <button
          onClick={() => {
            onOpenNewTransaction();
            onCloseMobile();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] font-bold text-sm shadow-md shadow-[#C46D53]/30 flex items-center justify-center gap-2.5 transition-transform hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Plus size={16} className="transition-transform group-hover:rotate-90 duration-300 stroke-[3]" />
          </div>
          <span>Novo Lançamento</span>
        </button>

        {/* Itens de Navegação (Menu Lateral) */}
        <nav className="space-y-1.5" aria-label="Menu Principal">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#7A8B68] text-[#FBF9F5] shadow-sm shadow-[#7A8B68]/30"
                    : "text-[#786B5E] hover:text-[#2C221E] hover:bg-[#F4EFE6]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-[#FBF9F5]" : "text-[#786B5E]"}>
                    {item.icon}
                  </span>
                  <span className="text-left">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-extrabold tracking-wider ${
                      isActive
                        ? "bg-white/20 text-[#FBF9F5]"
                        : "bg-[#C46D53]/15 text-[#C46D53]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Base da Sidebar: Mês Ativo & Perfil do Casal */}
      <div className="space-y-4 pt-4 border-t border-[#E6DEC8]">
        {/* Seletor de Mês Integrado */}
        <div className="bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl p-2.5">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-[#786B5E] hover:text-[#2C221E] hover:bg-[#E6DEC8]/50 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <span className="text-xs font-serif font-black text-[#2C221E] block">
                {MONTH_NAMES[selectedMonth]}
              </span>
              <span className="text-[10px] font-semibold text-[#786B5E]">
                {selectedYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-[#786B5E] hover:text-[#2C221E] hover:bg-[#E6DEC8]/50 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Quem está usando? (Alternador de Perfil) */}
        <div className="bg-[#F4EFE6] border border-[#E6DEC8] rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#786B5E] uppercase tracking-wider">
              Usuário Ativo
            </span>
            <span className="w-2 h-2 rounded-full bg-[#7A8B68]" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {users.map((u) => {
              const isActive = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-[#FBF9F5] border border-[#E6DEC8] shadow-sm"
                      : "opacity-60 hover:opacity-100 hover:bg-[#E6DEC8]/30"
                  }`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#E6DEC8]"
                  />
                  <span className="text-xs font-bold text-[#2C221E] truncate">
                    {u.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. SIDEBAR DESKTOP FIXA À ESQUERDA (md:flex) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 shrink-0 bg-[#FBF9F5] border-r border-[#E6DEC8] z-30 shadow-[4px_0_24px_rgba(61,44,30,0.03)]">
        {sidebarContent}
      </aside>

      {/* 2. SIDEBAR MOBILE (OFF-CANVAS DRAWER COM BACKDROP) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Escuro Suave */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer da Sidebar deslizando da esquerda */}
          <aside className="relative w-4/5 max-w-xs h-full bg-[#FBF9F5] border-r border-[#E6DEC8] z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
