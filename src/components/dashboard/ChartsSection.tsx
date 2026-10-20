"use client";

import React, { useMemo } from "react";
import { useFinance } from "@/context/FinanceContext";
import { formatBRL, CATEGORY_DETAILS } from "@/lib/utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { PieChart as PieIcon, BarChart3, TrendingDown, Users } from "lucide-react";

export const ChartsSection: React.FC = () => {
  const { expenses, incomeStats, expenseStats } = useFinance();

  // 1. Dados para o gráfico de rosca: Gastos Variáveis por Subcategoria
  const variableExpensesData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    expenses
      .filter((exp) => exp.expenseType === "VARIABLE")
      .forEach((exp) => {
        const catKey = exp.category;
        categoryTotals[catKey] = (categoryTotals[catKey] || 0) + exp.amount;
      });

    const items = Object.entries(categoryTotals).map(([catKey, total]) => {
      const details = CATEGORY_DETAILS[catKey as keyof typeof CATEGORY_DETAILS];
      return {
        name: details?.label || catKey,
        value: total,
        color: details?.color || "#94a3b8",
      };
    });

    return items.sort((a, b) => b.value - a.value);
  }, [expenses]);

  // 2. Dados para o gráfico de barras: Rastreabilidade Casal (Lucas vs Mariana)
  const coupleComparisonData = useMemo(() => {
    return [
      {
        pessoa: "Lucas",
        Receitas: incomeStats.lucasNet,
        Gastos: expenseStats.lucasSpent,
      },
      {
        pessoa: "Mariana",
        Receitas: incomeStats.marianaNet,
        Gastos: expenseStats.marianaSpent,
      },
    ];
  }, [incomeStats, expenseStats]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900/95 border border-white/15 p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-md">
          <p className="font-semibold text-white">{data.name}</p>
          <p className="text-emerald-400 font-bold mt-0.5">
            {formatBRL(data.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-white/15 p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-md">
          <p className="font-semibold text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2" style={{ color: entry.fill }}>
              <span className="font-medium">{entry.name}:</span>
              <span className="font-bold">{formatBRL(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* GRÁFICO 1: Gastos Variáveis por Subcategoria */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <PieIcon size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                Gastos Variáveis do Dia a Dia
              </h4>
              <p className="text-[11px] text-slate-400">
                Mercado, Mistura, Doces, Lazer & Comer Fora
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
            Total: {formatBRL(expenseStats.totalVariable)}
          </span>
        </div>

        {variableExpensesData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 my-2">
            <div className="w-full sm:w-1/2 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={variableExpensesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {variableExpensesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda compacta estilizada */}
            <div className="w-full sm:w-1/2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {variableExpensesData.map((item, idx) => {
                const percent =
                  expenseStats.totalVariable > 0
                    ? ((item.value / expenseStats.totalVariable) * 100).toFixed(0)
                    : 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-300 truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold text-white">
                        {formatBRL(item.value)}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500">
            Nenhum gasto variável cadastrado no mês
          </div>
        )}
      </div>

      {/* GRÁFICO 2: Rastreabilidade Casal (Lucas vs Mariana) */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Users size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                Balanço Individual do Casal
              </h4>
              <p className="text-[11px] text-slate-400">
                Receitas trazidas vs Gastos executados
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/30">
            Rastreabilidade
          </span>
        </div>

        <div className="h-48 w-full my-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={coupleComparisonData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="pessoa" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickFormatter={(val) => `R$${val / 1000}k`}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }}
                iconType="circle"
              />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-around text-[11px] text-slate-400">
          <div>
            Participação Receita: <span className="text-emerald-400 font-bold">Lucas {incomeStats.lucasProportion}%</span> | <span className="text-teal-400 font-bold">Mari {incomeStats.marianaProportion}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
