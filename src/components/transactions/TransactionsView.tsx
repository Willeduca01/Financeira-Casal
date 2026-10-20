"use client";

import React, { useState, useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import {
  formatBRL,
  formatDateBR,
  CATEGORY_DETAILS,
  PAYMENT_METHOD_DETAILS,
  INCOME_CATEGORY_DETAILS,
} from "@/lib/utils";
import {
  Filter,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Users,
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
      {/* Barra de Filtros */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Filtro por Pessoa */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 border border-white/10 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setFilterUser("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterUser === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Casal
            </button>
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setFilterUser(u.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  filterUser === u.id
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por Carteiras & Meios */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-white/10">
          <button
            onClick={() => setFilterWallet("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              filterWallet === "ALL"
                ? "bg-slate-800 text-white border-white/20"
                : "text-slate-400 border-transparent hover:bg-white/5"
            }`}
          >
            Todas as Carteiras
          </button>
          <button
            onClick={() => setFilterWallet("FREE")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors ${
              filterWallet === "FREE"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "text-slate-400 border-transparent hover:bg-white/5"
            }`}
          >
            <Wallet size={12} className="text-emerald-400" />
            Carteira Livre (Pix / Débito)
          </button>
          <button
            onClick={() => setFilterWallet("BENEFITS")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors ${
              filterWallet === "BENEFITS"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "text-slate-400 border-transparent hover:bg-white/5"
            }`}
          >
            <UtensilsCrossed size={12} className="text-amber-400" />
            Benefícios (VR / VA)
          </button>
          <button
            onClick={() => setFilterWallet("CREDIT_CARD")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 transition-colors ${
              filterWallet === "CREDIT_CARD"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "text-slate-400 border-transparent hover:bg-white/5"
            }`}
          >
            <CreditCard size={12} className="text-purple-400" />
            Cartão de Crédito
          </button>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>{filteredList.length} lançamentos encontrados</span>
          <span>Ordenado por data decrescente</span>
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
                className="glass-card-interactive rounded-2xl p-3.5 flex items-center justify-between gap-3 group"
              >
                {/* Lado Esquerdo: Avatar & Informações */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10"
                    />
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        tx.isIncome ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white truncate">
                        {tx.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                      <span>{formatDateBR(tx.date)}</span>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">
                        {user.name.split(" ")[0]}
                      </span>

                      {/* Badge do Meio / Carteira */}
                      {paymentDetails && (
                        <span className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-300">
                          {paymentDetails.label}
                        </span>
                      )}

                      {tx.isIncome && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                          {tx.walletType === "BENEFITS" ? "Benefício" : "Livre"}
                        </span>
                      )}

                      {catDetails && (
                        <span className="hidden sm:inline-block text-[10px] text-slate-400">
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
                      className={`text-sm md:text-base font-bold ${
                        tx.isIncome ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {tx.isIncome ? "+" : "-"} {formatBRL(tx.amount)}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      {tx.isIncome ? "Entrada" : "Saída"}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (tx.isIncome) deleteIncome(tx.id);
                      else deleteExpense(tx.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                    title="Excluir movimentação"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-xs space-y-2">
            <p className="text-sm font-semibold text-slate-300">
              Nenhuma movimentação com os filtros selecionados
            </p>
            <p>Tente alterar o filtro de pessoa ou carteira acima.</p>
          </div>
        )}
      </div>
    </div>
  );
};
