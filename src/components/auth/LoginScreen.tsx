"use client";

import React, { useState, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Lock, Delete, Heart, ShieldCheck, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

interface PublicProfile {
  id: string;
  name: string;
  avatar?: string;
}

export const LoginScreen: React.FC = () => {
  const { users, login } = useFinance();

  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null);
  const [pin, setPin] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Carregar perfis públicos mínimos do servidor (sem expor hashes ou dados financeiros)
  useEffect(() => {
    fetch("/api/profiles")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
        } else {
          setProfiles(users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar })));
        }
      })
      .catch(() => {
        setProfiles(users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar })));
      });
  }, [users]);

  const handleBackToUsers = () => {
    setSelectedUser(null);
    setPin("");
    setErrorMsg("");
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleClear = () => {
    setPin("");
    setErrorMsg("");
  };

  const submitPin = async (userId: string, pinToTest: string) => {
    const res = await login(userId, pinToTest, rememberMe);
    if (res.success) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#C46D53", "#7A8B68", "#D99B52"],
        });
      } catch (e) {
        // Confetti opcional
      }
    } else {
      setIsShaking(true);
      setErrorMsg(res.message || "PIN incorreto. Tente novamente.");
      setTimeout(() => {
        setPin("");
        setIsShaking(false);
      }, 600);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg("");

    // Se completou 4 dígitos, valida automaticamente
    if (newPin.length === 4 && selectedUser) {
      submitPin(selectedUser.id, newPin);
    }
  };

  const handleSelectUser = (user: PublicProfile) => {
    setSelectedUser(user);
    setPin("");
    setErrorMsg("");
  };

  // Escutar digitação física no teclado (Desktop)
  useEffect(() => {
    if (!selectedUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleDigitPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleBackToUsers();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, pin]);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#2C221E] flex flex-col justify-between p-4 sm:p-6 selection:bg-[#C46D53]/25 relative overflow-hidden">
      {/* Detalhes de iluminação suave em tons terrosos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C46D53]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-80 bg-[#7A8B68]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOPO: Identidade do Casal */}
      <div className="w-full max-w-md mx-auto text-center pt-6 sm:pt-10 z-10">
        <div className="inline-flex items-center gap-2 bg-[#FBF9F5] border border-[#E6DEC8] px-3.5 py-1.5 rounded-full shadow-xs mb-3">
          <Heart size={14} className="text-[#C46D53] fill-[#C46D53]" />
          <span className="text-xs font-bold text-[#2C221E] tracking-tight font-serif">
            Finanças a Dois &bull; Casal Avalanche
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#2C221E] tracking-tight">
          Gestão Financeira Compartilhada
        </h1>
        <p className="text-xs sm:text-sm text-[#786B5E] mt-1.5 max-w-xs mx-auto">
          Pote Único, contas transparentes e quitação acelerada de objetivos
        </p>
      </div>

      {/* 2. CENTRO: SELEÇÃO DE INTEGRANTE OU TECLADO DE PIN */}
      <div className="w-full max-w-sm mx-auto my-auto py-6 z-10">
        {!selectedUser ? (
          /* PASSO 1: Seleção de quem está acessando */
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center">
              <span className="text-xs font-bold text-[#786B5E] uppercase tracking-wider">
                Quem está acessando?
              </span>
              <p className="text-xs text-[#786B5E]/80 mt-0.5">
                Selecione o seu perfil para desbloquear
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
              {(profiles.length > 0
                ? profiles
                : users.map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }))
              ).map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="group bg-[#FBF9F5] border border-[#E6DEC8] hover:border-[#C46D53] p-4 sm:p-5 rounded-3xl flex flex-col items-center text-center shadow-[0_8px_25px_rgba(61,44,30,0.06)] hover:shadow-[0_12px_30px_rgba(196,109,83,0.15)] transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  <div className="relative mb-3">
                    <img
                      src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                      alt={user.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-[#E6DEC8] group-hover:ring-[#C46D53] transition-all shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center shadow-xs">
                      <Lock size={12} />
                    </div>
                  </div>

                  <h3 className="font-serif font-black text-sm sm:text-base text-[#2C221E] group-hover:text-[#C46D53] transition-colors">
                    {user.name}
                  </h3>
                  <span className="text-[10px] text-[#786B5E] mt-0.5 block font-medium">
                    Toque para entrar
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* PASSO 2: Digitação do PIN com teclado acolhedor */
          <div className="bg-[#FBF9F5] border border-[#E6DEC8] p-5 sm:p-6 rounded-[32px] shadow-[0_16px_50px_rgba(61,44,30,0.12)] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho do Perfil Selecionado */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DEC8]">
              <button
                onClick={handleBackToUsers}
                className="flex items-center gap-1 text-xs font-bold text-[#786B5E] hover:text-[#2C221E] transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Voltar</span>
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#786B5E] flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#7A8B68]" />
                Acesso Seguro
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-16 h-16 rounded-full object-cover ring-3 ring-[#C46D53] shadow-md mb-2"
              />
              <h2 className="text-base font-black font-serif text-[#2C221E]">
                Olá, {selectedUser.name.split(" ")[0]}!
              </h2>
              <p className="text-xs text-[#786B5E]">Digite seu PIN de 4 dígitos</p>

              {/* Bolinhas indicadoras do PIN com animação */}
              <div
                className={`flex items-center gap-3.5 my-3.5 ${
                  isShaking ? "animate-bounce" : ""
                }`}
              >
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                        isFilled
                          ? "bg-[#C46D53] border-[#C46D53] scale-110 shadow-xs shadow-[#C46D53]/40"
                          : "border-[#C46D53]/40 bg-[#F4EFE6]"
                      }`}
                    />
                  );
                })}
              </div>

              {errorMsg && (
                <p className="text-xs font-bold text-[#C46D53] animate-in fade-in duration-150">
                  {errorMsg}
                </p>
              )}
            </div>

            {/* Teclado Numérico Estilizado */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-13 sm:h-14 rounded-2xl bg-[#F4EFE6] hover:bg-[#E6DEC8] border border-[#E6DEC8] text-[#2C221E] text-xl font-bold font-serif transition-transform active:scale-95 flex items-center justify-center shadow-xs"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-13 sm:h-14 rounded-2xl bg-[#F4EFE6]/60 hover:bg-[#E6DEC8] text-xs font-bold text-[#786B5E] hover:text-[#2C221E] transition-all flex items-center justify-center"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleDigitPress("0")}
                className="h-13 sm:h-14 rounded-2xl bg-[#F4EFE6] hover:bg-[#E6DEC8] border border-[#E6DEC8] text-[#2C221E] text-xl font-bold font-serif transition-transform active:scale-95 flex items-center justify-center shadow-xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-13 sm:h-14 rounded-2xl bg-[#F4EFE6]/60 hover:bg-[#E6DEC8] text-[#786B5E] hover:text-[#C46D53] transition-all flex items-center justify-center"
                aria-label="Apagar dígito"
              >
                <Delete size={18} />
              </button>
            </div>

            {/* Opção Lembrar Neste Aparelho */}
            <div className="flex items-center justify-start pt-2 border-t border-[#E6DEC8] text-xs text-[#786B5E]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E6DEC8] text-[#C46D53] focus:ring-[#C46D53]"
                />
                <span>Lembrar neste aparelho</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 3. RODAPÉ SUTIL */}
      <div className="w-full max-w-md mx-auto text-center pb-2 z-10 text-[11px] text-[#786B5E]">
        <p>🔒 Seus dados financeiros estão protegidos e sincronizados com segurança.</p>
      </div>
    </div>
  );
};
