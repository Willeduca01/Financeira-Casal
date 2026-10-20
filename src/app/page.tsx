"use client";

import React, { useState } from "react";
import { FinanceProvider } from "@/context/FinanceContext";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { TabType } from "@/components/BottomNav";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { AvalancheAlertCard } from "@/components/dashboard/AvalancheAlertCard";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { TransactionsView } from "@/components/transactions/TransactionsView";
import { LoansAvalancheView } from "@/components/loans/LoansAvalancheView";
import { FixedAndReserveView } from "@/components/fixed-and-reserve/FixedAndReserveView";
import { NewTransactionModal } from "@/components/modals/NewTransactionModal";
import { AmortizationModal } from "@/components/modals/AmortizationModal";

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isAmortizeModalOpen, setIsAmortizeModalOpen] = useState(false);
  const [selectedAmortizeLoanId, setSelectedAmortizeLoanId] = useState<string | undefined>(
    undefined
  );

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
        {/* Top Header com Botão de Menu para Mobile */}
        <Header onOpenMobileMenu={() => setIsMobileSidebarOpen(true)} />

        {/* Main Container - Agora 100% Desobstruído e Sem Menus Flutuantes na Base */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 md:py-6 pb-12 space-y-5">
          {/* TAB 1: VISÃO GERAL (DASHBOARD) */}
          {activeTab === "dashboard" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Banner de Quitação Avalanche (Alvo nº 1) */}
              <AvalancheAlertCard onOpenAmortize={handleOpenAmortize} />

              {/* Cards de Resumo Rápido e Carteiras */}
              <SummaryCards />

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

          {/* TAB 2: EXTRATO & CARTEIRAS */}
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
