"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, ArrowUpRight, ArrowDownRight, Tag, HelpCircle, CheckSquare, Target } from "lucide-react";
import { Transaction, Goal } from "../lib/types";
import { PRESET_CATEGORIES } from "../lib/mockData";

interface CalendarSectionProps {
  transactions: Transaction[];
  goals: Goal[];
}

export default function CalendarSection({ transactions, goals }: CalendarSectionProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
  };

  // Get days in current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Create grid cells
  const dayCells = [];
  // Empty spaces from prev month
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(null);
  }
  // Safe numbers for current month
  for (let j = 1; j <= totalDays; j++) {
    dayCells.push(j);
  }

  // Get matching ledger items for a specific date
  const getDayItems = (day: number) => {
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = String(month + 1).padStart(2, "0");
    const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    const items = transactions.filter(t => t.date === targetDateStr);
    const dayGoals = goals.filter(g => g.limit_date === targetDateStr);

    return { transactions: items, goals: dayGoals };
  };

  // Annual overview aggregate math
  const getMonthTotal = (monthIdx: number) => {
    const formattedMonth = String(monthIdx + 1).padStart(2, "0");
    const prefix = `${year}-${formattedMonth}`;

    const incomes = transactions
      .filter(t => t.date.startsWith(prefix) && (t.type === "income" || t.amount > 0))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = transactions
      .filter(t => t.date.startsWith(prefix) && (t.type === "expense" || t.amount < 0))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { incomes, expenses };
  };

  return (
    <div className="bg-[#0b0f19]/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden" id="financial-calendar-bento">
      <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Calendar Header Control Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-900 pb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-cyan-400" />
            Calendário Financeiro Premium
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">Organize seus vencimentos, metas e fluxos futuros por datas</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
          <div className="flex gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === "monthly" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Exibição Mensal
            </button>
            <button
              onClick={() => setViewMode("yearly")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === "yearly" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Panorama Anual
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={viewMode === "monthly" ? handlePrevMonth : handlePrevYear}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            
            <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider min-w-[100px] text-center">
              {viewMode === "monthly" ? `${months[month]} ${year}` : `${year}`}
            </span>

            <button
              onClick={viewMode === "monthly" ? handleNextMonth : handleNextYear}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Render selected Calendar mode */}
      {viewMode === "monthly" ? (
        <div className="space-y-4">
          {/* Day Names Row */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10.5px] font-bold text-slate-500 tracking-wider">
            <span>DOM</span>
            <span>SEG</span>
            <span>TER</span>
            <span>QUA</span>
            <span>QUI</span>
            <span>SEX</span>
            <span>SÁB</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {dayCells.map((day, idx) => {
              if (day === null) {
                return (
                  <div key={`empty-${idx}`} className="aspect-square bg-slate-950/20 border border-slate-950/10 rounded-xl" />
                );
              }

              const { transactions: dayTx, goals: dayGoals } = getDayItems(day);
              const dayIncomes = dayTx.filter(t => t.type === "income" || t.amount > 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
              const dayExpenses = dayTx.filter(t => t.type === "expense" || t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
              const hasAlerts = dayExpenses > 0;
              
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div 
                  key={`day-${day}`} 
                  className={`aspect-square p-2 bg-slate-950/40 border rounded-xl flex flex-col justify-between transition-all group overflow-hidden ${
                    isToday ? "border-cyan-400/50 bg-cyan-950/10" : "border-slate-900 hover:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold font-mono ${isToday ? "text-cyan-400 font-extrabold" : "text-slate-400 group-hover:text-white"}`}>
                      {day}
                    </span>
                    
                    {dayGoals.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" title="Meta de economia expira hoje!" />
                    )}
                  </div>

                  {/* Cash flow representations */}
                  <div className="space-y-0.5 mt-1">
                    {dayIncomes > 0 && (
                      <div className="text-[8.5px] text-emerald-400 font-mono font-bold leading-none truncate p-0.5 bg-emerald-500/5 rounded">
                        +{dayIncomes.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </div>
                    )}
                    {dayExpenses > 0 && (
                      <div className="text-[8.5px] text-pink-400 font-mono font-bold leading-none truncate p-0.5 bg-pink-500/5 rounded">
                        -{dayExpenses.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick legend info box */}
          <div className="mt-4 flex items-center justify-center gap-6 text-[10.5px] text-slate-500 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
              <span>Saldos de Entrada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-pink-500/20 border border-pink-500/40" />
              <span>Saídas Registradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
              <span>Vencimento de Metas</span>
            </div>
          </div>
        </div>
      ) : (
        /* PANORAMA ANUAL View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {months.map((mName, mIdx) => {
            const { incomes, expenses } = getMonthTotal(mIdx);
            return (
              <div key={mIdx} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl relative overflow-hidden flex flex-col justify-between h-36">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{mName}</h5>
                  <span className="text-[9px] font-mono text-slate-500">{year}</span>
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" /> Entradas
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      R$ {incomes.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold font-sans flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-pink-400" /> Saídas
                    </span>
                    <span className="text-pink-400 font-bold font-mono">
                      R$ {expenses.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-900/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-semibold uppercase">Saldo</span>
                  <span className={`font-black font-mono ${incomes - expenses >= 0 ? "text-cyan-400" : "text-pink-400"}`}>
                    R$ {(incomes - expenses).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
