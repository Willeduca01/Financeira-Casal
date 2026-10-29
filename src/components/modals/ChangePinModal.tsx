"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { X, Lock, Check, ShieldCheck, KeyRound } from "lucide-react";

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserPin } = useFinance();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPin !== confirmPin) {
      setFeedback({ type: "error", message: "A confirmação do novo PIN não confere." });
      return;
    }

    if (newPin.length < 4) {
      setFeedback({ type: "error", message: "O novo PIN deve ter pelo menos 4 dígitos." });
      return;
    }

    const res = await updateUserPin(currentUser.id, currentPin, newPin);
    if (res.success) {
      setFeedback({ type: "success", message: res.message || "PIN alterado com sucesso!" });
      setTimeout(() => {
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setFeedback(null);
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: "error", message: res.message || "Erro ao alterar PIN." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[28px] w-full max-w-sm p-5 sm:p-6 shadow-[0_16px_50px_rgba(61,44,30,0.18)] space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C46D53]/15 text-[#C46D53]">
              <KeyRound size={16} />
            </span>
            <h3 className="font-serif font-black text-sm text-[#2C221E]">
              Alterar PIN de {currentUser.name.split(" ")[0]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#786B5E] hover:text-[#2C221E] rounded-lg hover:bg-[#F4EFE6] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs text-[#786B5E] font-medium block mb-1">
              PIN Atual
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="Digite o PIN atual (padrão: 1234)"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
              autoFocus
              className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-xl px-3.5 py-2 text-sm text-[#2C221E] focus:outline-none focus:border-[#C46D53] transition-all tracking-widest text-center font-bold"
            />
          </div>

          <div>
            <label className="text-xs text-[#786B5E] font-medium block mb-1">
              Novo PIN (4 dígitos)
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="Novo PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              required
              className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-xl px-3.5 py-2 text-sm text-[#2C221E] focus:outline-none focus:border-[#C46D53] transition-all tracking-widest text-center font-bold"
            />
          </div>

          <div>
            <label className="text-xs text-[#786B5E] font-medium block mb-1">
              Confirmar Novo PIN
            </label>
            <input
              type="password"
              maxLength={6}
              placeholder="Repita o novo PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              required
              className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-xl px-3.5 py-2 text-sm text-[#2C221E] focus:outline-none focus:border-[#C46D53] transition-all tracking-widest text-center font-bold"
            />
          </div>

          {feedback && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                feedback.type === "success"
                  ? "bg-[#7A8B68]/15 text-[#5B7052] border border-[#7A8B68]/30"
                  : "bg-[#C46D53]/15 text-[#C46D53] border border-[#C46D53]/30"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-[#C46D53]/30 transition-transform active:scale-95"
            >
              <Check size={14} />
              <span>Salvar Novo PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
