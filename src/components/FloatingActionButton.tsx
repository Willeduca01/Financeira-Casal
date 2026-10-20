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
      className="flex md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] items-center justify-center shadow-[0_10px_25px_rgba(196,109,83,0.35)] hover:scale-105 active:scale-95 transition-all duration-200 border-4 border-[#F4EFE6] group"
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
