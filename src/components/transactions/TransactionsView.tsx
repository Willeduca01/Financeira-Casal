"use client";

import React, { useState, useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  formatBRL,
  formatDateBR,
  CATEGORY_DETAILS,
  PAYMENT_METHOD_DETAILS,
} from "@/lib/utils";
import {
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CreditCard,
  Wallet,
  UtensilsCrossed,
} from "lucide-react";

export const TransactionsView: React.FC = () => {
  const { expenses, incomes, users, deleteExpense, deleteIncome } = useFinance();

  const [filterUser, setFilterUser] = useState<string>("ALL");
  const [filterWallet, setFilterWallet] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Combinar despesas e receitas em um fluxo cronológico unificado
  const unifiedTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      isIncome: boolean;
      userId: string;
      category: string;
      paymentMethod?: string;
      walletType?: string;
      expenseType?: string;
    }> = [];

    incomes.forEach((inc) => {
      list.push({
        id: inc.id,
        description: inc.description,
        amount: inc.amountNet,
        date: inc.receivedAt,
        isIncome: true,
        userId: inc.userId,
        category: inc.category,
        walletType: inc.walletType,
      });
    });

    expenses.forEach((exp) => {
      list.push({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        isIncome: false,
        userId: exp.userId,
        category: exp.category,
        paymentMethod: exp.paymentMethod,
        expenseType: exp.expenseType,
      });
    });

    // Ordenar do mais recente para o mais antigo
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, expenses]);

  // Aplicar filtros
  const filteredList = useMemo(() => {
    return unifiedTransactions.filter((item) => {
      // Filtro de Usuário
      if (filterUser !== "ALL" && item.userId !== filterUser) return false;

      // Filtro de Carteira
      if (filterWallet !== "ALL") {
        if (filterWallet === "FREE") {
          if (item.isIncome && item.walletType !== "FREE") return false;
          if (!item.isIncome && item.paymentMethod !== "DEBIT_PIX") return false;
        } else if (filterWallet === "BENEFITS") {
          if (item.isIncome && item.walletType !== "BENEFITS") return false;
          if (!item.isIncome && item.paymentMethod !== "VR" && item.paymentMethod !== "VA") return false;
        } else if (filterWallet === "CREDIT_CARD") {
          if (item.isIncome) return false;
          if (!item.isIncome && item.paymentMethod !== "CREDIT_CARD") return false;
        }
      }

      // Filtro de Tipo
      if (filterType !== "ALL") {
        if (filterType === "INCOME" && !item.isIncome) return false;
        if (filterType === "FIXED" && item.expenseType !== "FIXED") return false;
        if (filterType === "VARIABLE" && item.expenseType !== "VARIABLE") return false;
        if (filterType === "LOAN" && item.expenseType !== "LOAN") return false;
      }

      // Filtro de busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.description.toLowerCase().includes(query);
      }

      return true;
    });
  }, [unifiedTransactions, filterUser, filterWallet, filterType, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros Artesanal */}
      <div className="organic-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Campo de Busca em Fundo Areia */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#786B5E]"
            />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F4EFE6] border border-[#E6DEC8] rounded-full pl-9 pr-4 py-2 text-xs text-[#2C221E] placeholder-[#786B5E] focus:outline-none focus:border-[#C46D53]"
            />
          </div>

          {/* Filtro por Pessoa (Pílulas Acolhedoras) */}
          <div className="flex items-center gap-1.5 bg-[#F4EFE6] p-1 border border-[#E6DEC8] rounded-full overflow-x-auto text-xs">
            <button
              onClick={() => setFilterUser("ALL")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterUser === "ALL"
                  ? "bg-[#C46D53] text-[#FBF9F5] shadow-sm"
                  : "text-[#786B5E] hover:text-[#2C221E]"
              }`}
            >
              Casal
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setFilterUser(u.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  filterUser === u.id
                    ? "bg-[#C46D53] text-[#FBF9F5] shadow-sm"
                    : "text-[#786B5E] hover:text-[#2C221E]"
                }`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-4 h-4 rounded-full object-cover ring-1 ring-white"
                />
                {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Carteiras & Meios */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E6DEC8]">
          <button
            onClick={() => setFilterWallet("ALL")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              filterWallet === "ALL"
                ? "bg-[#7A8B68] text-[#FBF9F5] border-[#7A8B68]"
                : "text-[#786B5E] border-[#E6DEC8] bg-[#F4EFE6] hover:bg-[#E6DEC8]"
            }`}
          >
            Todas as Carteiras
          </button>
          <button
            onClick={() => setFilterWallet("FREE")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              filterWallet === "FREE"
                ? "bg-[#7A8B68] text-[#FBF9F5] border-[#7A8B68]"
                : "text-[#556943] bg-[#E9EFE4] border-[#7A8B68]/30 hover:bg-[#7A8B68]/20"
            }`}
          >
            <Wallet size={12} />
            Carteira Livre (Pix / Débito)
          </button>
          <button
            onClick={() => setFilterWallet("BENEFITS")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              filterWallet === "BENEFITS"
                ? "bg-[#D99B52] text-[#FBF9F5] border-[#D99B52]"
                : "text-[#9A6424] bg-[#FDF3E7] border-[#D99B52]/30 hover:bg-[#D99B52]/20"
            }`}
          >
            <UtensilsCrossed size={12} />
            Benefícios (VR / VA)
          </button>
          <button
            onClick={() => setFilterWallet("CREDIT_CARD")}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
              filterWallet === "CREDIT_CARD"
                ? "bg-[#C46D53] text-[#FBF9F5] border-[#C46D53]"
                : "text-[#B05B42] bg-[#FCECE8] border-[#C46D53]/30 hover:bg-[#C46D53]/20"
            }`}
          >
            <CreditCard size={12} />
            Cartão de Crédito
          </button>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#786B5E] px-2">
          <span>{filteredList.length} lançamentos encontrados</span>
          <span>Mais recentes primeiro</span>
        </div>

        {filteredList.length > 0 ? (
          filteredList.map((tx) => {
            const user = users.find((u) => u.id === tx.userId) || users[0];
            const paymentDetails = tx.paymentMethod
              ? PAYMENT_METHOD_DETAILS[tx.paymentMethod as keyof typeof PAYMENT_METHOD_DETAILS]
              : null;
            const catDetails = !tx.isIncome
              ? CATEGORY_DETAILS[tx.category as keyof typeof CATEGORY_DETAILS]
              : null;

            return (
              <div
                key={tx.id}
                className="organic-card p-4 flex items-center justify-between gap-3 group hover:border-[#C46D53]/40 transition-all"
              >
                {/* Lado Esquerdo: Avatar & Informações */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-[#E6DEC8]"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tx.isIncome ? "bg-[#7A8B68] text-[#FBF9F5]" : "bg-[#C46D53] text-[#FBF9F5]"
                      }`}
                    >
                      {tx.isIncome ? (
                        <ArrowUpRight size={10} className="stroke-[3]" />
                      ) : (
                        <ArrowDownLeft size={10} className="stroke-[3]" />
                      )}
                    </div>
                  </div>

                  <div className="truncate">
                    <p className="text-sm font-bold text-[#2C221E] truncate">
                      {tx.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-[#786B5E]">
                      <span>{formatDateBR(tx.date)}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-[#2C221E]">
                        {user.name.split(" ")[0]}
                      </span>

                      {/* Badge do Meio / Carteira */}
                      {paymentDetails && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F4EFE6] border border-[#E6DEC8] text-[10px] font-medium text-[#786B5E]">
                          {paymentDetails.label}
                        </span>
                      )}

                      {tx.isIncome && (
                        <span className="px-2 py-0.5 rounded-full bg-[#E9EFE4] text-[#556943] text-[10px] font-semibold border border-[#7A8B68]/30">
                          {tx.walletType === "BENEFITS" ? "Benefício" : "Livre"}
                        </span>
                      )}

                      {catDetails && (
                        <span className="hidden sm:inline-block text-[10px] text-[#786B5E]">
                          ({catDetails.label})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Valor & Ação de Excluir */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-sm md:text-base font-black ${
                        tx.isIncome ? "text-[#7A8B68]" : "text-[#2C221E]"
                      }`}
                    >
                      {tx.isIncome ? "+" : "-"} {formatBRL(tx.amount)}
                    </p>
                    <span className="text-[10px] text-[#786B5E] block">
                      {tx.isIncome ? "Entrada" : "Saída"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (tx.isIncome) deleteIncome(tx.id);
                      else deleteExpense(tx.id);
                    }}
                    className="p-2 text-[#786B5E]/50 hover:text-[#B05B42] hover:bg-[#C46D53]/10 rounded-full transition-colors opacity-70 group-hover:opacity-100"
                    title="Excluir movimentação"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="organic-card p-10 text-center text-[#786B5E] text-xs space-y-1.5">
            <p className="font-serif text-sm font-bold text-[#2C221E]">
              Nenhuma movimentação encontrada
            </p>
            <p>Tente alterar o filtro de pessoa ou carteira acima.</p>
          </div>
        )}
      </div>
    </div>
  );
};
