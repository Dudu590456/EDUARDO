"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Target,
  PieChart as PieIcon,
  ChevronRight,
  AlertTriangle,
  FileSpreadsheet
} from "lucide-react";
import { Transaction, Goal } from "../lib/types";
import { PRESET_CATEGORIES } from "../lib/mockData";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from "recharts";

interface DashboardGridProps {
  transactions: Transaction[];
  goals: Goal[];
  onOpenModal: (type: "income" | "expense" | "goal") => void;
}

export default function DashboardGrid({ transactions, goals, onOpenModal }: DashboardGridProps) {
  const [chartPeriod, setChartPeriod] = useState<"monthly" | "yearly">("monthly");

  // Calculations
  const incomesSum = transactions
    .filter((t) => t.type === "income" || t.amount > 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const expensesSum = transactions
    .filter((t) => t.type === "expense" || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalBalance = incomesSum - expensesSum;
  const savingsRate = incomesSum > 0 ? Math.round(((incomesSum - expensesSum) / incomesSum) * 100) : 0;

  // Filter current month transactions
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, "0");
  const currentYearStr = String(new Date().getFullYear());
  
  const currentMonthExpenses = transactions
    .filter(t => (t.type === "expense" || t.amount < 0) && t.date.includes(`${currentYearStr}-${currentMonthStr}`))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Group transactions for line chart (last 7 entries or grouped by day)
  const lastDaysData = () => {
    const days: { [key: string]: { income: number; expense: number } } = {};
    const sorted = [...transactions].sort((a,b) => a.date.localeCompare(b.date));
    
    // Fallback if empty
    if (sorted.length === 0) {
      return [{ date: "Vazio", Saldo: 0, Receitas: 0, Despesas: 0 }];
    }

    sorted.slice(-10).forEach(t => {
      const dateLabel = t.date.slice(5); // MM-DD
      if (!days[dateLabel]) {
        days[dateLabel] = { income: 0, expense: 0 };
      }
      if (t.type === "income" || t.amount > 0) {
        days[dateLabel].income += Math.abs(t.amount);
      } else {
        days[dateLabel].expense += Math.abs(t.amount);
      }
    });

    let runningBalance = 0;
    return Object.keys(days).map(date => {
      const inc = days[date].income;
      const exp = days[date].expense;
      runningBalance += (inc - exp);
      return {
        date,
        Saldo: runningBalance,
        Receitas: inc,
        Despesas: exp
      };
    });
  };

  // Category list calculations
  const categoryChartData = () => {
    const categories: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === "expense" || t.amount < 0)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
      });

    return Object.keys(categories).map(catKey => ({
      name: PRESET_CATEGORIES[catKey]?.label || catKey,
      value: categories[catKey],
      color: PRESET_CATEGORIES[catKey]?.bgColor.replace("/10", "") || "#a1a1aa"
    })).sort((a,b) => b.value - a.value);
  };

  const chartColors = ["#00f0ff", "#a259ff", "#ff007f", "#39ff14", "#ffb703", "#e9c46a"];
  const pieData = categoryChartData().slice(0, 5);

  return (
    <div className="space-y-6" id="dashboard-grid-container">
      
      {/* 1. Quad-Boxes Metrics Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="main-metrics-bento">
        
        {/* Metric 1: Total Balance */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1224] to-[#040814] border border-cyan-500/20 rounded-xl p-5 shadow-lg shadow-black/40 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest">Saldo Líquido</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
              {totalBalance.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <span className={`font-bold flex items-center font-mono ${totalBalance >= 0 ? "text-emerald-400" : "text-pink-400"}`}>
                {totalBalance >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {savingsRate}% de economia
              </span>
              <span>acumulado</span>
            </p>
          </div>
        </div>

        {/* Metric 2: Total Incomes */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1224] to-[#040814] border border-emerald-500/20 rounded-xl p-5 shadow-lg shadow-black/40 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest">Inflows • Receitas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight font-mono">
              + {incomesSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <button 
              onClick={() => onOpenModal("income")}
              className="text-[10px] text-emerald-300 font-bold hover:underline mt-1.5 flex items-center gap-0.5 cursor-pointer"
            >
              Lançar Entrada <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 3: Total Expenses */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1224] to-[#040814] border border-pink-500/20 rounded-xl p-5 shadow-lg shadow-black/40 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest">Outflows • Despesas</span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-400/20 flex items-center justify-center text-pink-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl sm:text-3xl font-black text-pink-400 tracking-tight font-mono">
              - {expensesSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <button 
              onClick={() => onOpenModal("expense")}
              className="text-[10px] text-pink-300 font-bold hover:underline mt-1.5 flex items-center gap-0.5 cursor-pointer"
            >
              Lançar Saída <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Metric 4: Spent this Month */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1224] to-[#040814] border border-amber-500/20 rounded-xl p-5 shadow-lg shadow-black/40 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-widest">Gastos do Mês</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-mono">
              {currentMonthExpenses.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Limite mensal estimado</span>
            </p>
          </div>
        </div>

      </div>

      {/* 2. Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="charts-bento-area">
        
        {/* Evolution Area Graph (8 columns on large screens) */}
        <div className="lg:col-span-8 bg-[#0b0f19]/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Evolução Patrimonial e Caixa
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Visão cronológica de entradas versus despesas de consumo</p>
            </div>
            
            <div className="flex gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-lg shrink-0">
              <button
                onClick={() => setChartPeriod("monthly")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  chartPeriod === "monthly" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-500 hover:text-slate-200"
                }`}
              >
                Caixa
              </button>
              <button
                onClick={() => setChartPeriod("yearly")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                  chartPeriod === "yearly" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-500 hover:text-slate-200"
                }`}
              >
                Projeção
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartPeriod === "monthly" ? (
                <AreaChart data={lastDaysData()}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#03f4fc" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#03f4fc" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#090d1a", borderColor: "rgba(34, 211, 238, 0.2)", borderRadius: "10px", color: "#f8fafc" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="Saldo" stroke="#00f0ff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaldo)" />
                  <Area type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={1} fillOpacity={1} fill="url(#colorReceitas)" />
                </AreaChart>
              ) : (
                <BarChart data={[
                  { name: "Jan", Receitas: incomesSum * 0.8, Despesas: expensesSum * 0.9 },
                  { name: "Fev", Receitas: incomesSum * 0.9, Despesas: expensesSum * 0.8 },
                  { name: "Mar", Receitas: incomesSum, Despesas: expensesSum },
                  { name: "Abr", Receitas: incomesSum * 1.05, Despesas: expensesSum * 0.85 },
                  { name: "Mai", Receitas: incomesSum * 1.1, Despesas: expensesSum * 1.1 },
                  { name: "Jun", Receitas: incomesSum * 1.25, Despesas: expensesSum * 0.95 }
                ]}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#090d1a", borderColor: "rgba(34, 211, 238, 0.2)", borderRadius: "10px" }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#ff007f" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie distribution / Categories (4 columns) */}
        <div className="lg:col-span-4 bg-[#0b0f19]/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-purple-400" />
              Gastos por Categoria
            </h4>
            <p className="text-xs text-slate-500 mb-4">Principais centros de custo ativos</p>
          </div>

          {pieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <AlertTriangle className="w-8 h-8 text-slate-700 mb-2" />
              <p className="text-xs">Não há saídas registradas neste período para composição gráfica.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dynamic Pie chart visual */}
              <div className="h-44 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#090d1a", borderRadius: "8px", border: "1px solid #334155" }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Consumido</span>
                  <span className="text-sm font-extrabold text-slate-200 font-mono">
                    R$ {expensesSum.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Legend checklist */}
              <div className="space-y-1.5 flex-1">
                {pieData.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-950/40 transition-all">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      />
                      <span className="text-slate-300 font-semibold">{item.name}</span>
                    </div>
                    <span className="text-slate-400 font-semibold font-mono">
                      R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. Goals Progress Row (Quick Preview) */}
      {goals.length > 0 && (
        <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-fuchsia-400" />
              Metas de Economia Ativas ({goals.length})
            </h4>
            <button 
              onClick={() => onOpenModal("goal")}
              className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-bold hover:underline cursor-pointer"
            >
              Nova Meta +
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((g) => {
              const progress = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100);
              return (
                <div key={g.id} className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-fuchsia-500/5 rounded-full blur-xl" />
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-slate-200 group-hover:text-fuchsia-300 transition-colors">{g.name}</h5>
                    <span className="text-[10px] text-fuchsia-400 font-bold font-mono bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/20">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-3.5">
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-fuchsia-500 to-pink-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2.5 text-[10px] text-slate-500 font-mono">
                    <span>Acumulado: R$ {g.current_amount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                    <span>Alvo: R$ {g.target_amount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
