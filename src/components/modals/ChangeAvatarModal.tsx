"use client";

import React, { useState, useRef } from "react";
import { useFinance } from "@/context/FinanceContext";
import { compressAvatarToWebP } from "@/lib/image-compress";
import { X, Camera, Upload, Link as LinkIcon, Check, Sparkles, Image as ImageIcon } from "lucide-react";
import confetti from "canvas-confetti";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
];

interface ChangeAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
}

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
}) => {
  const { users, currentUser, updateUserProfile } = useFinance();
  const [selectedUserId, setSelectedUserId] = useState<string>(
    targetUserId || currentUser.id
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeUser = users.find((u) => u.id === selectedUserId) || currentUser;

  const handleApplyAvatar = async (newAvatar: string) => {
    setIsProcessing(true);
    setFeedback(null);

    try {
      await updateUserProfile(activeUser.id, { avatar: newAvatar });
      setFeedback({ type: "success", message: "Foto de perfil atualizada com sucesso!" });

      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.7 },
          colors: ["#C46D53", "#7A8B68"],
        });
      } catch {}

      setTimeout(() => {
        setFeedback(null);
      }, 3500);
    } catch (err) {
      console.error("[AVATAR_UPDATE_ERROR]", err);
      setFeedback({ type: "error", message: "Não foi possível salvar a foto. Tente novamente." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", message: "Selecione um arquivo de imagem válido (JPG, PNG ou WebP)." });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFeedback({ type: "error", message: "A foto é muito pesada (máx 25MB)." });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      // Comprime no cliente para WebP quadrado de 280x280 (~15KB a 25KB)
      const compressedWebP = await compressAvatarToWebP(file, 280, 0.82);
      await handleApplyAvatar(compressedWebP);
    } catch (err) {
      console.error("[AVATAR_COMPRESSION_ERROR]", err);
      setFeedback({ type: "error", message: "Erro ao processar a imagem. Escolha outro arquivo." });
      setIsProcessing(false);
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:image/")) {
      setFeedback({ type: "error", message: "Insira uma URL de imagem válida (começando com http:// ou https://)." });
      return;
    }

    await handleApplyAvatar(trimmed);
    setUrlInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[28px] w-full max-w-md p-5 sm:p-6 shadow-[0_20px_60px_rgba(61,44,30,0.22)] space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#C46D53]/15 text-[#C46D53]">
              <Camera size={18} />
            </span>
            <div>
              <h3 className="font-serif font-black text-sm sm:text-base text-[#2C221E] leading-tight">
                Alterar Foto de Perfil
              </h3>
              <p className="text-[11px] text-[#786B5E]">
                Personalize sua foto para celular e computador
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

        {/* Seletor de Integrante (William ou Laura) */}
        {users.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E] block">
              Escolha quem deseja alterar:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = u.id === activeUser.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u.id);
                      setFeedback(null);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-2xl border transition-all text-left ${
                      isSelected
                        ? "bg-[#C46D53]/10 border-[#C46D53] text-[#C46D53] font-bold shadow-sm"
                        : "bg-[#F4EFE6] border-[#E6DEC8] text-[#2C221E] hover:border-[#C46D53]/40"
                    }`}
                  >
                    <img
                      src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-[#E6DEC8]"
                    />
                    <span className="text-xs truncate">{u.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Visualização Central do Avatar Atual */}
        <div className="flex flex-col items-center justify-center py-2 space-y-2">
          <div className="relative">
            <img
              src={activeUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"}
              alt={activeUser.name}
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-[#C46D53]/25 shadow-lg border-2 border-[#E6DEC8] transition-all ${
                isProcessing ? "opacity-40 scale-95" : "opacity-100 scale-100"
              }`}
            />
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-full">
                <div className="w-7 h-7 border-3 border-[#C46D53] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-[#2C221E]">{activeUser.name}</span>
        </div>

        {/* Mensagem de Feedback */}
        {feedback && (
          <div
            className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
              feedback.type === "success"
                ? "bg-[#7A8B68]/15 text-[#7A8B68] border border-[#7A8B68]/30"
                : "bg-red-500/15 text-red-700 border border-red-500/30"
            }`}
          >
            {feedback.type === "success" ? <Check size={15} /> : <X size={15} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Opção 1: Upload de Foto Própria do Dispositivo */}
        <div className="p-3.5 bg-[#F4EFE6] rounded-2xl border border-[#E6DEC8] space-y-2">
          <span className="text-xs font-bold text-[#2C221E] block">
            1. Subir foto do computador ou celular
          </span>
          <p className="text-[11px] text-[#786B5E] leading-relaxed">
            Selecione qualquer foto pessoal. Ela será convertida e comprimida automaticamente para WebP ultra-leve.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] text-xs font-bold shadow-md shadow-[#C46D53]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Upload size={14} />
            <span>{isProcessing ? "Otimizando e Salvando..." : "Escolher Arquivo do Dispositivo"}</span>
          </button>
        </div>

        {/* Opção 2: Colar Link Direto de Imagem (URL da Internet) */}
        <div className="p-3.5 bg-[#F4EFE6] rounded-2xl border border-[#E6DEC8] space-y-2">
          <span className="text-xs font-bold text-[#2C221E] block">
            2. Ou colar link de uma foto na internet (URL)
          </span>
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input
              type="url"
              placeholder="https://exemplo.com/sua-foto.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#FBF9F5] border border-[#E6DEC8] text-xs text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C46D53]/40"
            />
            <button
              type="submit"
              disabled={isProcessing || !urlInput.trim()}
              className="px-3 py-2 rounded-xl bg-[#7A8B68] hover:bg-[#657554] text-[#FBF9F5] text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              <LinkIcon size={12} />
              <span>Aplicar</span>
            </button>
          </form>
        </div>

        {/* Opção 3: Avatares Estilizados Prontos */}
        <div className="p-3.5 bg-[#F4EFE6] rounded-2xl border border-[#E6DEC8] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#786B5E]">
            <Sparkles size={13} className="text-[#C46D53]" />
            <span>3. Ou escolher um avatar pronto estilizado</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isProcessing}
                onClick={() => handleApplyAvatar(url)}
                className={`relative rounded-full overflow-hidden p-0.5 border-2 transition-all hover:scale-105 active:scale-95 ${
                  activeUser.avatar === url
                    ? "border-[#C46D53] ring-2 ring-[#C46D53]/40 scale-105 shadow-sm"
                    : "border-transparent hover:border-[#C46D53]/50"
                }`}
                title={`Avatar pronto ${idx + 1}`}
              >
                <img
                  src={url}
                  alt={`Opção ${idx + 1}`}
                  className="w-9 h-9 rounded-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#F4EFE6] text-[#786B5E] hover:bg-[#E6DEC8] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
