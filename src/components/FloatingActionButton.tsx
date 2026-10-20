"use client";

import React from "react";
import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-5 z-40 md:bottom-8 md:right-8 w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
      aria-label="Adicionar movimentação rápida"
      title="Novo lançamento (Despesa ou Receita)"
    >
      <Plus
        size={28}
        className="transition-transform group-hover:rotate-90 duration-300 stroke-[2.5]"
      />
      <span className="sr-only">Adicionar</span>
    </button>
  );
};
