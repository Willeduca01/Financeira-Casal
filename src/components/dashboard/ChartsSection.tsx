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
import { PieChart as PieIcon, Users } from "lucide-react";

// Paleta Terrosa e Orgânica Solicitada
const EARTHY_PALETTE = ["#C46D53", "#7A8B68", "#D99B52", "#8C6D53", "#A3B18A", "#E07A5F"];

export const ChartsSection: React.FC = () => {
  const { expenses, incomeStats, expenseStats, users } = useFinance();

  const partner1FirstName = users[0]?.name ? users[0].name.split(" ")[0] : "Parceiro 1";
  const partner2FirstName = users[1]?.name ? users[1].name.split(" ")[0] : "Parceiro 2";

  // 1. Dados para o gráfico de rosca: Gastos Variáveis por Subcategoria
  const variableExpensesData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};

    expenses
      .filter((exp) => exp.expenseType === "VARIABLE")
      .forEach((exp) => {
        const catKey = exp.category;
        categoryTotals[catKey] = (categoryTotals[catKey] || 0) + exp.amount;
      });

    const items = Object.entries(categoryTotals).map(([catKey, total], index) => {
      const details = CATEGORY_DETAILS[catKey as keyof typeof CATEGORY_DETAILS];
      return {
        name: details?.label || catKey,
        value: total,
        color: EARTHY_PALETTE[index % EARTHY_PALETTE.length],
      };
    });

    return items.sort((a, b) => b.value - a.value);
  }, [expenses]);

  // 2. Dados para o gráfico de barras: Rastreabilidade Casal
  const coupleComparisonData = useMemo(() => {
    return [
      {
        pessoa: partner1FirstName,
        Receitas: incomeStats.lucasNet,
        Gastos: expenseStats.lucasSpent,
      },
      {
        pessoa: partner2FirstName,
        Receitas: incomeStats.marianaNet,
        Gastos: expenseStats.marianaSpent,
      },
    ];
  }, [incomeStats, expenseStats, partner1FirstName, partner2FirstName]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[#FBF9F5] border border-[#E6DEC8] p-3 rounded-2xl shadow-[0_8px_30px_rgb(61,44,30,0.12)] text-xs text-[#2C221E]">
          <p className="font-bold text-[#2C221E]">{data.name}</p>
          <p className="text-[#C46D53] font-black text-sm mt-0.5">
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
        <div className="bg-[#FBF9F5] border border-[#E6DEC8] p-3 rounded-2xl shadow-[0_8px_30px_rgb(61,44,30,0.12)] text-xs text-[#2C221E]">
          <p className="font-bold text-[#2C221E] mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2 font-medium" style={{ color: entry.fill }}>
              <span>{entry.name}:</span>
              <strong className="font-bold">{formatBRL(entry.value)}</strong>
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
      <div className="organic-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#D99B52]/15 text-[#D99B52] flex items-center justify-center border border-[#D99B52]/20">
              <PieIcon size={18} />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-[#2C221E] leading-tight">
                Gastos Variáveis do Dia a Dia
              </h4>
              <p className="text-[11px] text-[#786B5E]">
                Mercado, Açougue, Lanches & Passeios
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#2C221E] bg-[#F4EFE6] px-3 py-1 rounded-full border border-[#E6DEC8]">
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
                    innerRadius={46}
                    outerRadius={76}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {variableExpensesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FBF9F5" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda compacta com paleta terrosa */}
            <div className="w-full sm:w-1/2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {variableExpensesData.map((item, idx) => {
                const percent =
                  expenseStats.totalVariable > 0
                    ? ((item.value / expenseStats.totalVariable) * 100).toFixed(0)
                    : 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded-xl hover:bg-[#F4EFE6] transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#2C221E] font-medium truncate">{item.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-[#2C221E]">
                        {formatBRL(item.value)}
                      </span>
                      <span className="text-[10px] text-[#786B5E] ml-1">
                        ({percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-[#786B5E]">
            Nenhum gasto variável cadastrado no mês
          </div>
        )}
      </div>

      {/* GRÁFICO 2: Rastreabilidade Casal (Lucas vs Mariana) */}
      <div className="organic-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#7A8B68]/15 text-[#7A8B68] flex items-center justify-center border border-[#7A8B68]/20">
              <Users size={18} />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-[#2C221E] leading-tight">
                Balanço Individual do Casal
              </h4>
              <p className="text-[11px] text-[#786B5E]">
                Receitas trazidas vs Gastos executados
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#556943] bg-[#E9EFE4] px-3 py-1 rounded-full border border-[#7A8B68]/20">
            Rastreabilidade
          </span>
        </div>

        <div className="h-48 w-full my-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={coupleComparisonData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="pessoa" stroke="#786B5E" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#786B5E"
                fontSize={10}
                tickFormatter={(val) => `R$${val / 1000}k`}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }}
                iconType="circle"
              />
              <Bar dataKey="Receitas" fill="#7A8B68" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Gastos" fill="#C46D53" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-3 border-t border-[#E6DEC8] flex items-center justify-around text-[11px] text-[#786B5E]">
          <div>
            Proporção de Renda: <strong className="text-[#7A8B68]">{partner1FirstName} {incomeStats.lucasProportion}%</strong> &bull; <strong className="text-[#C46D53]">{partner2FirstName} {incomeStats.marianaProportion}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
