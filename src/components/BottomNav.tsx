"use client";

import React from "react";
import { LayoutDashboard, ReceiptText, Zap, ShieldCheck, Plus, CreditCard } from "lucide-react";

export type TabType =
  | "dashboard"
  | "transactions"
  | "cards"
  | "loans"
  | "fixed-reserve"
  | "settings";

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenNewTransaction: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenNewTransaction,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Barra Curva em Verde Sálvia */}
      <div className="bg-[#7A8B68] rounded-t-[30px] shadow-[0_-8px_30px_rgba(61,44,30,0.12)] px-4 py-2 border-t border-[#657554]/30 max-w-lg mx-auto">
        <div className="flex items-center justify-between relative px-2">
          {/* Aba 1: Visão Geral */}
          <button
            onClick={() => onChangeTab("dashboard")}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === "dashboard"
                ? "text-[#FBF9F5] font-bold scale-105"
                : "text-[#FBF9F5]/70 hover:text-[#FBF9F5]"
            }`}
          >
            <LayoutDashboard size={20} className="stroke-[2.2]" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Visão Geral</span>
            {activeTab === "dashboard" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBF9F5] mt-0.5" />
            )}
          </button>

          {/* Aba 2: Cartões & Benefícios */}
          <button
            onClick={() => onChangeTab("cards")}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === "cards"
                ? "text-[#FBF9F5] font-bold scale-105"
                : "text-[#FBF9F5]/70 hover:text-[#FBF9F5]"
            }`}
          >
            <CreditCard size={20} className="stroke-[2.2]" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Cartões</span>
            {activeTab === "cards" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBF9F5] mt-0.5" />
            )}
          </button>

          {/* BOTÃO CENTRAL ELEVADO (FAB DOCK ORGÂNICO EM TERRACOTA) */}
          <div className="relative -top-6 flex flex-col items-center">
            <button
              onClick={onOpenNewTransaction}
              className="w-14 h-14 rounded-full bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] flex items-center justify-center shadow-lg shadow-[#C46D53]/40 border-4 border-[#F4EFE6] transition-transform hover:scale-105 active:scale-95 group"
              title="Nova Transação Rápida"
              aria-label="Adicionar lançamento"
            >
              <Plus size={26} className="transition-transform group-hover:rotate-90 duration-300 stroke-[3]" />
            </button>
            <span className="text-[10px] font-bold text-[#FBF9F5] mt-1 tracking-tight">Novo</span>
          </div>

          {/* Aba 3: Avalanche */}
          <button
            onClick={() => onChangeTab("loans")}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === "loans"
                ? "text-[#FBF9F5] font-bold scale-105"
                : "text-[#FBF9F5]/70 hover:text-[#FBF9F5]"
            }`}
          >
            <div className="relative">
              <Zap size={20} className="stroke-[2.2]" />
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#D99B52] animate-ping" />
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[#D99B52]" />
            </div>
            <span className="text-[10px] mt-1 tracking-tight font-medium">Avalanche</span>
            {activeTab === "loans" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBF9F5] mt-0.5" />
            )}
          </button>

          {/* Aba 4: Fixos & Reserva */}
          <button
            onClick={() => onChangeTab("fixed-reserve")}
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === "fixed-reserve"
                ? "text-[#FBF9F5] font-bold scale-105"
                : "text-[#FBF9F5]/70 hover:text-[#FBF9F5]"
            }`}
          >
            <ShieldCheck size={20} className="stroke-[2.2]" />
            <span className="text-[10px] mt-1 tracking-tight font-medium">Reserva</span>
            {activeTab === "fixed-reserve" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBF9F5] mt-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
