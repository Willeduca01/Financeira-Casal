"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, CheckCircle2, QrCode, RefreshCw, Smartphone, Sparkles, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface WhatsAppStatusResponse {
  connected: boolean;
  qr: string | null;
  qrDataUrl: string | null;
  updatedAt: string | null;
  status: "connected" | "needs_scan" | "disconnected" | "waiting_service" | "error";
}

export const WhatsAppQRCard: React.FC = () => {
  const [data, setData] = useState<WhatsAppStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const previousConnectedRef = useRef<boolean>(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
      if (res.ok) {
        const json: WhatsAppStatusResponse = await res.json();
        setData(json);

        // Se acabou de conectar, comemora com confetes!
        if (json.connected && !previousConnectedRef.current) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#7A8B68", "#C46D53", "#D9A05B"],
          });
        }
        previousConnectedRef.current = json.connected;
      }
    } catch (err) {
      console.warn("Erro ao buscar status do WhatsApp:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Atualiza a cada 4 segundos para detectar leitura do QR Code em tempo real
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  return (
    <div className="bg-[#FBF9F5] border border-[#E6DEC8] rounded-[32px] p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header do Card */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center shadow-xs">
            <MessageSquare size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-black text-[#2C221E] flex items-center gap-2">
              <span>WhatsApp do Casal (Robô Inteligente)</span>
              {data?.connected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#2C5E43] border border-[#2C5E43]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2C5E43] animate-pulse" />
                  Online 24h
                </span>
              )}
            </h3>
            <span className="text-[11px] font-semibold text-[#786B5E]">
              Envie despesas e receitas por mensagem de texto natural
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl bg-[#F4EFE6] text-[#786B5E] hover:bg-[#E6DEC8] text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="Atualizar status da conexão"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-[#C46D53]" : ""} />
          <span className="text-[11px]">Atualizar</span>
        </button>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-[#786B5E]">
          <div className="w-6 h-6 border-2 border-[#E6DEC8] border-t-[#C46D53] rounded-full animate-spin" />
          <span className="text-xs font-semibold">Verificando status do bot...</span>
        </div>
      ) : data?.connected ? (
        /* Estado 1: CONECTADO */
        <div className="bg-[#EBF3ED]/70 border border-[#2C5E43]/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2C5E43] text-white flex items-center justify-center shrink-0 shadow-md">
            <CheckCircle2 size={26} />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h4 className="text-sm font-bold text-[#2C5E43]">
              O Robô está Conectado e Operando!
            </h4>
            <p className="text-xs text-[#55695C] leading-relaxed">
              O WhatsApp do bot está vinculado com sucesso. Você e seu parceiro já podem mandar mensagens pelo celular para registrar despesas e receitas automaticamente.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-[#2C5E43] font-semibold">
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#2C5E43]/15">
                💬 Ex: &quot;Almoço 45 reais no VR&quot;
              </span>
              <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-[#2C5E43]/15">
                💳 Ex: &quot;Mercado 120 no Nubank em 2x&quot;
              </span>
            </div>
          </div>
        </div>
      ) : data?.qrDataUrl ? (
        /* Estado 2: AGUARDANDO LEITURA DO QR CODE */
        <div className="bg-white border border-[#E6DEC8] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
          {/* Imagem do QR Code */}
          <div className="flex flex-col items-center shrink-0">
            <div className="bg-[#FAF7F2] p-3 rounded-2xl border-2 border-dashed border-[#C46D53]/40 shadow-xs relative">
              <img
                src={data.qrDataUrl}
                alt="QR Code WhatsApp"
                className="w-56 h-56 rounded-xl block"
              />
            </div>
            <span className="text-[10px] font-bold text-[#786B5E] mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#D9A05B] animate-ping" />
              Atualiza automaticamente em tempo real
            </span>
          </div>

          {/* Instruções passo a passo */}
          <div className="space-y-3.5 flex-1">
            <div className="flex items-center gap-2 text-[#C46D53] font-bold text-sm">
              <QrCode size={18} />
              <span>Escaneie o código com o WhatsApp do Bot</span>
            </div>

            <ol className="space-y-2 text-xs text-[#554D46]">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F4EFE6] text-[#2C221E] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Abra o WhatsApp no celular que funcionará como bot</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F4EFE6] text-[#2C221E] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Toque em <strong>Configurações</strong> (ou nos 3 pontinhos) &gt; <strong>Aparelhos Conectados</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#F4EFE6] text-[#2C221E] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Toque em <strong>Conectar um Aparelho</strong> e aponte a câmera para o QR Code ao lado</span>
              </li>
            </ol>

            <div className="bg-[#FAF7F2] border border-[#E6DEC8] rounded-xl p-3 flex items-start gap-2 text-[11px] text-[#786B5E]">
              <Smartphone size={16} className="text-[#C46D53] shrink-0 mt-0.5" />
              <span>
                Assim que você escanear, esta tela mudará para <strong>Conectado</strong> imediatamente e a sessão ficará salva no banco Neon!
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Estado 3: AGUARDANDO INÍCIO DO SERVIÇO */
        <div className="bg-[#FAF7F2] border border-[#E6DEC8] rounded-2xl p-5 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#D9A05B]/20 text-[#D9A05B] flex items-center justify-center mx-auto">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#2C221E]">
              Aguardando o Serviço do Bot Iniciar
            </h4>
            <p className="text-[11px] text-[#786B5E] max-w-md mx-auto mt-1">
              Assim que o serviço no Render iniciar o processo, o QR Code aparecerá automaticamente nesta caixa para você escanear.
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C46D53] hover:bg-[#B05B42] text-[#FBF9F5] text-xs font-bold transition-all shadow-xs"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            <span>Verificar Agora</span>
          </button>
        </div>
      )}
    </div>
  );
};

