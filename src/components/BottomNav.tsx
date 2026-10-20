"use client";

import React from "react";
import { LayoutDashboard, ReceiptText, Zap, ShieldCheck } from "lucide-react";

export type TabType = "dashboard" | "transactions" | "loans" | "fixed-reserve";

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
  const tabs = [
    {
      id: "dashboard" as TabType,
      label: "Visão Geral",
      icon: LayoutDashboard,
    },
    {
      id: "transactions" as TabType,
      label: "Extrato",
      icon: ReceiptText,
    },
    {
      id: "loans" as TabType,
      label: "Avalanche",
      icon: Zap,
      badge: "Alvo!",
    },
    {
      id: "fixed-reserve" as TabType,
      label: "Fixos & Reserva",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 px-3 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative group ${
                isActive
                  ? "text-emerald-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50" />
              )}
              <div className="relative">
                <Icon
                  size={20}
                  className={`transition-transform duration-200 ${
                    isActive ? "scale-110 text-emerald-400" : "group-hover:scale-105"
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3.5 bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1 py-0.2 rounded-full animate-pulse">
                    ⚡
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
