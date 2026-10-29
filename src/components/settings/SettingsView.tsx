"use client";

import React, { useState, useRef, useEffect } from "react";
import { useFinance } from "@/context/FinanceContext";
import { User, CoupleSettings } from "@/types";
import { formatBRL } from "@/lib/utils";
import {
  User as UserIcon,
  Heart,
  Upload,
  Camera,
  Check,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Lock,
  Save,
  Trash2,
  Image as ImageIcon,
  KeyRound,
  Percent,
  Wallet,
  Coins,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";

// Avatares rápidos estilizados com tons acolhedores e elegantes
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

interface UserEditFormProps {
  user: User;
  onSave: (updated: Partial<User>) => Promise<void>;
  partnerName: string;
  cardNumber?: number;
}

const UserEditCard: React.FC<UserEditFormProps> = ({ user, onSave, partnerName, cardNumber = 1 }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [salaryNet, setSalaryNet] = useState(user.salaryNet.toString());
  const [salaryGross, setSalaryGross] = useState(user.salaryGross.toString());
  const [vrAmount, setVrAmount] = useState(user.vrAmount.toString());
  const [vaAmount, setVaAmount] = useState(user.vaAmount.toString());
  const [showAvatarPresets, setShowAvatarPresets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setAvatar(user.avatar || "");
    setSalaryNet(user.salaryNet.toString());
    setSalaryGross(user.salaryGross.toString());
    setVrAmount(user.vrAmount.toString());
    setVaAmount(user.vaAmount.toString());
  }, [user]);

  // Manipular upload local de imagem (converte para Base64 comprimida)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecione um arquivo de imagem válido (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert("A imagem selecionada é muito grande. Escolha uma foto de até 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updateData: Partial<User> = {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim() || undefined,
        salaryNet: parseFloat(salaryNet) || 0,
        salaryGross: parseFloat(salaryGross) || 0,
        vrAmount: parseFloat(vrAmount) || 0,
        vaAmount: parseFloat(vaAmount) || 0,
      };

      await onSave(updateData);
      setSaveSuccess(true);

      try {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.8 },
          colors: ["#C46D53", "#7A8B68"],
        });
      } catch {}

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      alert("Ocorreu um erro ao salvar o perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[32px] p-5 sm:p-6 shadow-sm space-y-5 transition-all">
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E6DEC8]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center font-bold text-xs">
            {cardNumber}
          </div>
          <div>
            <h3 className="text-base font-serif font-black text-[#2C221E] leading-tight">
              {user.name}
            </h3>
            <span className="text-[11px] font-semibold text-[#786B5E]">
              Integrante do Casal
            </span>
          </div>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#7A8B68] bg-[#7A8B68]/10 px-2.5 py-1 rounded-full animate-in fade-in">
            <Check size={14} /> Salvo!
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Foto do Usuário / Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-[#F4EFE6] rounded-2xl border border-[#E6DEC8]/60">
          <div className="relative group shrink-0">
            <img
              src={avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-[#FBF9F5] shadow-md border border-[#E6DEC8]"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-[#C46D53] text-[#FBF9F5] rounded-full shadow hover:bg-[#B05B42] transition-colors"
              title="Carregar foto do computador/celular"
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Upload size={13} />
                <span>Escolher Foto</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAvatarPresets(!showAvatarPresets)}
                className="px-3 py-1.5 rounded-xl bg-[#FBF9F5] hover:bg-[#E6DEC8] text-[#786B5E] border border-[#E6DEC8] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ImageIcon size={13} />
                <span>Avatares Prontos</span>
              </button>
            </div>

            <p className="text-[11px] text-[#786B5E]">
              Formatos recomendados: JPG, PNG ou WebP.
            </p>
          </div>
        </div>

        {/* Galeria de Avatares Rápidos */}
        {showAvatarPresets && (
          <div className="p-3 bg-[#F4EFE6] rounded-2xl border border-[#E6DEC8] space-y-2 animate-in fade-in duration-150">
            <span className="text-[11px] font-bold text-[#786B5E] block">
              Selecione um avatar estilizado:
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatar(url);
                    setShowAvatarPresets(false);
                  }}
                  className={`relative rounded-full overflow-hidden p-0.5 border-2 transition-all ${
                    avatar === url
                      ? "border-[#C46D53] scale-105 shadow-sm"
                      : "border-transparent hover:border-[#C46D53]/50"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Avatar ${idx + 1}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Campos Principais: Nome e E-mail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#786B5E] mb-1">
              Nome Completo / Como quer ser chamado
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: William, Lucas, etc."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C46D53]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#786B5E] mb-1">
              E-mail de Acesso
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exemplo@email.com"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C46D53]/40"
            />
          </div>
        </div>

        {/* Renda & Benefícios */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#786B5E] block">
            Renda & Benefícios Mensais
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-medium text-[#786B5E] mb-1">
                Salário Líquido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salaryNet}
                onChange={(e) => setSalaryNet(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C46D53]/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#786B5E] mb-1">
                Salário Bruto (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salaryGross}
                onChange={(e) => setSalaryGross(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-medium text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#C46D53]/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#786B5E] mb-1">
                Vale Refeição (VR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vrAmount}
                onChange={(e) => setVrAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-bold text-[#C46D53] focus:outline-none focus:ring-2 focus:ring-[#C46D53]/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#786B5E] mb-1">
                Vale Alimentação (VA)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={vaAmount}
                onChange={(e) => setVaAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-bold text-[#7A8B68] focus:outline-none focus:ring-2 focus:ring-[#C46D53]/40"
              />
            </div>
          </div>
        </div>

        {/* Segurança: Proteção de PIN */}
        <div className="p-3 bg-[#F4EFE6] rounded-2xl border border-[#E6DEC8]/60 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C221E]">
            <KeyRound size={14} className="text-[#C46D53]" />
            <span>Segurança do PIN</span>
          </div>
          <p className="text-[11px] text-[#786B5E]">
            Para alterar seu PIN de 4 dígitos, utilize o menu do seu perfil no topo da página (requer confirmação do PIN atual).
          </p>
        </div>

        {/* Botão Salvar Integrante */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 px-4 rounded-2xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] font-bold text-xs shadow-md shadow-[#C46D53]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Save size={15} />
              <span>Salvar Alterações de {name.split(" ")[0] || "Integrante"}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const {
    users,
    coupleSettings,
    updateUserProfile,
    updateCoupleSettings,
    clearAllTransactionalData,
  } = useFinance();

  const [coupleName, setCoupleName] = useState(coupleSettings.coupleName);
  const [monthsTarget, setMonthsTarget] = useState(
    coupleSettings.emergencyFundMonthsTarget.toString()
  );
  const [isSavingCouple, setIsSavingCouple] = useState(false);
  const [coupleSaved, setCoupleSaved] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setCoupleName(coupleSettings.coupleName);
    setMonthsTarget(coupleSettings.emergencyFundMonthsTarget.toString());
  }, [coupleSettings]);

  const handleSaveCoupleSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCouple(true);
    setCoupleSaved(false);

    try {
      await updateCoupleSettings({
        coupleName: coupleName.trim() || "Finanças do Casal",
        emergencyFundMonthsTarget: parseInt(monthsTarget, 10) || 6,
      });
      setCoupleSaved(true);
      setTimeout(() => setCoupleSaved(false), 3000);
    } catch (err) {
      console.error("Erro ao salvar configurações do casal:", err);
      alert("Ocorreu um erro ao atualizar as configurações do casal.");
    } finally {
      setIsSavingCouple(false);
    }
  };

  const handleConfirmClearData = async () => {
    setIsClearing(true);
    try {
      await clearAllTransactionalData();
      setShowClearConfirmModal(false);
      alert(
        "Sucesso! Todos os lançamentos de teste foram removidos. O aplicativo está pronto para receber suas finanças reais!"
      );
    } catch (err) {
      console.error("Erro ao limpar dados:", err);
      alert("Erro ao limpar dados. Tente novamente.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. TOPO: TÍTULO DA ÁREA DE CONFIGURAÇÃO */}
      <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[32px] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C46D53] text-[#FBF9F5] flex items-center justify-center shadow-md shadow-[#C46D53]/25">
              <Heart size={22} className="fill-[#FBF9F5]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#2C221E] tracking-tight">
                Configurações do Perfil & Casal
              </h2>
              <p className="text-xs text-[#786B5E] mt-0.5">
                Personalize os nomes, adicione fotos reais e configure as finanças compartilhadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#F4EFE6] px-3.5 py-1.5 rounded-2xl border border-[#E6DEC8]/60 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-[#7A8B68]" />
            <span className="text-xs font-bold text-[#2C221E]">
              {coupleSettings.coupleName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CONFIGURAÇÕES DOS INTEGRANTES (PESSOA 1 E PESSOA 2) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <UserIcon size={16} className="text-[#C46D53]" />
          <h3 className="text-sm font-serif font-bold text-[#2C221E]">
            Integrantes do Casal (Nome, Foto e Renda)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {users.map((user, idx) => (
            <UserEditCard
              key={user.id}
              user={user}
              cardNumber={idx + 1}
              partnerName={users[idx === 0 ? 1 : 0]?.name || "Parceiro"}
              onSave={(updatedData) => updateUserProfile(user.id, updatedData)}
            />
          ))}
        </div>
      </div>

      {/* 3. CONFIGURAÇÕES GERAIS DO CASAL */}
      <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[32px] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DEC8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7A8B68]/15 text-[#7A8B68] flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-serif font-black text-[#2C221E]">
                Identidade & Parâmetros do Casal
              </h3>
              <span className="text-[11px] font-semibold text-[#786B5E]">
                Configurações globais de convivência financeira
              </span>
            </div>
          </div>

          {coupleSaved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#7A8B68] bg-[#7A8B68]/10 px-2.5 py-1 rounded-full animate-in fade-in">
              <Check size={14} /> Atualizado!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveCoupleSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#786B5E] mb-1">
                Nome do Casal / Título do App
              </label>
              <input
                type="text"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Ex: William & Mariana, Casal Avalanche"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#7A8B68]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#786B5E] mb-1">
                Meta de Meses para Reserva de Emergência
              </label>
              <select
                value={monthsTarget}
                onChange={(e) => setMonthsTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4EFE6] border border-[#E6DEC8] text-xs font-bold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#7A8B68]/40"
              >
                <option value="3">3 Meses (Perfil Dinâmico)</option>
                <option value="6">6 Meses (Recomendado para Casal)</option>
                <option value="12">12 Meses (Máxima Segurança / Autônomos)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingCouple}
            className="py-2.5 px-5 rounded-2xl bg-[#7A8B68] hover:bg-[#687857] text-[#FBF9F5] font-bold text-xs shadow-md shadow-[#7A8B68]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSavingCouple ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save size={14} />
                <span>Salvar Configurações Gerais</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. GERENCIAMENTO DE DADOS & LIMPEZA DE TESTES */}
      <div className="bg-[#FBF9F5] border border-[#C46D53]/30 rounded-[32px] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center">
            <Trash2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-serif font-black text-[#2C221E]">
              Limpeza de Dados Demonstrativos (Começar do Zero)
            </h3>
            <span className="text-[11px] font-semibold text-[#786B5E]">
              Prepare o sistema para inclusão das suas finanças reais
            </span>
          </div>
        </div>

        <p className="text-xs text-[#786B5E] leading-relaxed">
          Esta opção limpa todas as despesas, receitas, cartões de crédito, parcelas e empréstimos fictícios do banco de dados e do navegador. As 2 contas de usuário com os nomes e fotos configurados acima serão <strong>preservadas</strong>.
        </p>

        <button
          type="button"
          onClick={() => setShowClearConfirmModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#C46D53]/15 text-[#C46D53] hover:bg-[#C46D53] hover:text-[#FBF9F5] text-xs font-bold border border-[#C46D53]/30 flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
        >
          <RotateCcw size={14} />
          <span>Limpar Lançamentos e Iniciar com Dados Reais</span>
        </button>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA DE DADOS */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[28px] max-w-md w-full p-6 space-y-4 shadow-2xl text-[#2C221E] animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-[#C46D53]/15 text-[#C46D53] flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#2C221E]">
                Limpar todos os lançamentos demonstrativos?
              </h3>
              <p className="text-xs text-[#786B5E] mt-1 leading-relaxed">
                Essa ação irá remover todas as despesas, receitas, cartões e empréstimos de demonstração para que você possa começar a registrar as informações reais do casal. Os perfis com nomes e fotos serão mantidos.
              </p>
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirmModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-[#F4EFE6] text-[#786B5E] hover:bg-[#E6DEC8] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleConfirmClearData}
                className="px-4 py-2 rounded-full text-xs font-bold bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] shadow-md transition-all flex items-center gap-2"
              >
                {isClearing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirmar e Limpar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
