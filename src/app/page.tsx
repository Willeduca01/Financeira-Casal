"use client";

import React, { useState, useEffect } from "react";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { TabType } from "@/components/BottomNav";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import dynamic from "next/dynamic";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { AvalancheAlertCard } from "@/components/dashboard/AvalancheAlertCard";

// Esqueletos de Carregamento Estilizados (Design Quente, Orgânico e Aconchegante)
const ChartsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
    <div className="lg:col-span-2 h-72 rounded-[28px] bg-[#FBF9F5] border border-[#E6DEC8] p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#E6DEC8]/60" />
        <div className="h-5 w-48 bg-[#E6DEC8]/60 rounded-full" />
      </div>
      <div className="h-44 w-full bg-[#E6DEC8]/20 rounded-2xl" />
    </div>
    <div className="h-72 rounded-[28px] bg-[#FBF9F5] border border-[#E6DEC8] p-5 flex flex-col justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#E6DEC8]/60" />
        <div className="h-5 w-32 bg-[#E6DEC8]/60 rounded-full" />
      </div>
      <div className="h-44 w-full bg-[#E6DEC8]/20 rounded-2xl" />
    </div>
  </div>
);

const ViewSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-28 rounded-[28px] bg-[#FBF9F5] border border-[#E6DEC8] p-5 flex items-center justify-between shadow-sm">
      <div className="space-y-2">
        <div className="h-5 w-48 bg-[#E6DEC8]/60 rounded-full" />
        <div className="h-3 w-64 bg-[#E6DEC8]/40 rounded-full" />
      </div>
      <div className="h-10 w-28 bg-[#E6DEC8]/50 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="h-48 rounded-[24px] bg-[#FBF9F5] border border-[#E6DEC8] p-4 shadow-sm" />
      <div className="h-48 rounded-[24px] bg-[#FBF9F5] border border-[#E6DEC8] p-4 shadow-sm" />
      <div className="h-48 rounded-[24px] bg-[#FBF9F5] border border-[#E6DEC8] p-4 shadow-sm" />
    </div>
  </div>
);

// Dynamic Views & Modals (Code Splitting e Lazy Loading)
const ChartsSection = dynamic(
  () => import("@/components/dashboard/ChartsSection").then((mod) => mod.ChartsSection),
  { loading: () => <ChartsSkeleton />, ssr: false }
);

const TransactionsView = dynamic(
  () => import("@/components/transactions/TransactionsView").then((mod) => mod.TransactionsView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

const CardsView = dynamic(
  () => import("@/components/cards/CardsView").then((mod) => mod.CardsView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

const LoansAvalancheView = dynamic(
  () => import("@/components/loans/LoansAvalancheView").then((mod) => mod.LoansAvalancheView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

const FixedAndReserveView = dynamic(
  () => import("@/components/fixed-and-reserve/FixedAndReserveView").then((mod) => mod.FixedAndReserveView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

const SettingsView = dynamic(
  () => import("@/components/settings/SettingsView").then((mod) => mod.SettingsView),
  { loading: () => <ViewSkeleton />, ssr: false }
);

const NewTransactionModal = dynamic(
  () => import("@/components/modals/NewTransactionModal").then((mod) => mod.NewTransactionModal),
  { ssr: false }
);

const AmortizationModal = dynamic(
  () => import("@/components/modals/AmortizationModal").then((mod) => mod.AmortizationModal),
  { ssr: false }
);

function DashboardContent() {
  const { isAuthenticated } = useFinance();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isAmortizeModalOpen, setIsAmortizeModalOpen] = useState(false);
  const [selectedAmortizeLoanId, setSelectedAmortizeLoanId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar disparidade SSR / Client por causa do localStorage
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C46D53] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se não estiver autenticado, exibe a tela de login/PIN do casal
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleOpenAmortize = (loanId?: string) => {
    setSelectedAmortizeLoanId(loanId);
    setIsAmortizeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#2C221E] flex selection:bg-[#C46D53]/25">
      {/* 1. SIDEBAR LATERAL ESQUERDA (DESKTOP FIXA + MOBILE DRAWER) */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. CONTEÚDO PRINCIPAL (À DIREITA DA SIDEBAR) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header com Botão de Menu para Mobile e Navegação */}
        <Header
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onNavigateTab={setActiveTab}
        />

        {/* Main Container - Agora 100% Desobstruído e Sem Menus Flutuantes na Base */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 md:py-6 pb-12 space-y-5">
          {/* TAB 1: VISÃO GERAL (DASHBOARD) */}
          {activeTab === "dashboard" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Banner de Quitação Avalanche (Alvo nº 1) */}
              <AvalancheAlertCard onOpenAmortize={handleOpenAmortize} />

              {/* Cards de Resumo Rápido e Carteiras */}
              <SummaryCards onNavigateTab={setActiveTab} />

              {/* Seção de Gráficos Visuais */}
              <ChartsSection />

              {/* Acesso rápido às movimentações recentes */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-bold text-[#2C221E]">Movimentações Recentes</h3>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-xs text-[#C46D53] hover:text-[#B05B42] font-bold transition-colors"
                  >
                    Ver extrato completo →
                  </button>
                </div>
                <TransactionsView />
              </div>
            </div>
          )}

          {/* TAB 2: CARTÕES & BENEFÍCIOS */}
          {activeTab === "cards" && (
            <div className="animate-in fade-in duration-200">
              <CardsView />
            </div>
          )}

          {/* TAB 3: EXTRATO & CARTEIRAS */}
          {activeTab === "transactions" && (
            <div className="animate-in fade-in duration-200 space-y-4">
              <div>
                <h2 className="text-lg md:text-xl font-black font-serif text-[#2C221E]">
                  Extrato Completo & Carteiras
                </h2>
                <p className="text-xs text-[#786B5E]">
                  Histórico detalhado com rastreabilidade de quem realizou cada gasto
                </p>
              </div>
              <TransactionsView />
            </div>
          )}

          {/* TAB 3: MÉTODO AVALANCHE & EMPRÉSTIMOS */}
          {activeTab === "loans" && (
            <div className="animate-in fade-in duration-200">
              <LoansAvalancheView onOpenAmortize={handleOpenAmortize} />
            </div>
          )}

          {/* TAB 4: GASTOS FIXOS & RESERVA DE EMERGÊNCIA */}
          {activeTab === "fixed-reserve" && (
            <div className="animate-in fade-in duration-200">
              <FixedAndReserveView />
            </div>
          )}

          {/* TAB 5: CONFIGURAÇÕES DO PERFIL & CASAL */}
          {activeTab === "settings" && (
            <div className="animate-in fade-in duration-200">
              <SettingsView />
            </div>
          )}
        </main>
      </div>

      {/* Botão Flutuante Rápido no Mobile (opcional e não invasivo) */}
      <FloatingActionButton onClick={() => setIsNewTxModalOpen(true)} />

      {/* Modais de Ação */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => setIsNewTxModalOpen(false)}
      />

      <AmortizationModal
        isOpen={isAmortizeModalOpen}
        loanId={selectedAmortizeLoanId}
        onClose={() => setIsAmortizeModalOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <FinanceProvider>
      <DashboardContent />
    </FinanceProvider>
  );
}
