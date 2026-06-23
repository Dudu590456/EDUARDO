"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, DollarSign, Calendar, Target, ShoppingBag, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Transaction, Goal, Installment } from "../lib/types";
import { PRESET_CATEGORIES } from "../lib/mockData";

interface GlobalSearchProps {
  transactions: Transaction[];
  goals: Goal[];
  installments: Installment[];
  onSelectResult: (type: "transaction" | "goal" | "installment", item: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({
  transactions,
  goals,
  installments,
  onSelectResult,
  isOpen,
  onClose
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  // Filter Search
  const normalizedQuery = query.toLowerCase().trim();
  
  const filteredTransactions = normalizedQuery
    ? transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(normalizedQuery) ||
          (t.category || "Geral").toLowerCase().includes(normalizedQuery) ||
          (PRESET_CATEGORIES[t.category || "Geral"]?.label || "").toLowerCase().includes(normalizedQuery)
      )
    : [];

  const filteredGoals = normalizedQuery
    ? goals.filter((g) => g.name.toLowerCase().includes(normalizedQuery))
    : [];

  const filteredInstallments = normalizedQuery
    ? installments.filter((i) => i.description.toLowerCase().includes(normalizedQuery))
    : [];

  const totalResults =
    filteredTransactions.length + filteredGoals.length + filteredInstallments.length;

  return (
    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4">
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-[#0b1021] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/20 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in duration-200"
      >
        {/* Search Header Input bar */}
        <div className="flex items-center gap-3 p-4 border-b border-cyan-950/40 bg-slate-950/40">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquise por descrição, categorias, metas ou parcelas..."
            className="w-full bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 px-2 py-1 rounded text-slate-400 hover:text-white transition-all font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query ? (
            <div className="text-center py-10 text-slate-500 text-sm font-sans flex flex-col items-center justify-center gap-2">
              <Search className="w-10 h-10 text-slate-700 animate-pulse" />
              <p className="font-semibold text-slate-400">Pesquisa Geral Inteligente</p>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Digite o termo de sua transação, categoria, parcelamento ou meta para filtrar e carregar instantaneamente.
              </p>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              Nenhum registro encontrado correspondente ao termo <span className="text-pink-400 font-mono">&quot;{query}&quot;</span>.
            </div>
          ) : (
            <>
              {/* Transactions Section */}
              {filteredTransactions.length > 0 && (
                <div>
                  <h3 className="text-[10.5px] font-bold text-cyan-400 tracking-widest uppercase mb-2 ml-1 flex items-center gap-1.5 font-sans">
                    <DollarSign className="w-3.5 h-3.5" />
                    Transações ({filteredTransactions.length})
                  </h3>
                  <div className="space-y-1">
                    {filteredTransactions.slice(0, 5).map((t) => {
                      const categoryData = PRESET_CATEGORIES[t.category || "Geral"];
                      const isIncome = (t.type as string) === "receita" || (t.type as string) === "income" || t.amount > 0;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            onSelectResult("transaction", t);
                            onClose();
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 hover:bg-cyan-950/20 border border-transparent hover:border-cyan-500/20 cursor-pointer transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{categoryData?.icon || "📦"}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                                {t.description}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-slate-400 font-semibold">
                                  {categoryData?.label || t.category}
                                </span>
                                <span className="text-[10px] text-slate-600">•</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {t.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold font-mono ${isIncome ? "text-emerald-400" : "text-pink-400"}`}>
                              {isIncome ? "+" : ""}
                              {t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                            <Eye className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Goals Section */}
              {filteredGoals.length > 0 && (
                <div>
                  <h3 className="text-[10.5px] font-bold text-fuchsia-400 tracking-widest uppercase mb-2 ml-1 flex items-center gap-1.5 font-sans">
                    <Target className="w-3.5 h-3.5" />
                    Metas Financeiras ({filteredGoals.length})
                  </h3>
                  <div className="space-y-1">
                    {filteredGoals.map((g) => (
                      <div
                        key={g.id}
                        onClick={() => {
                          onSelectResult("goal", g);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 hover:bg-fuchsia-950/20 border border-transparent hover:border-fuchsia-500/20 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 font-bold border border-fuchsia-500/20">
                            🎯
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200 group-hover:text-fuchsia-300">
                              {g.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Meta: R$ {g.target_amount.toLocaleString("pt-BR")} • Prazo: {g.deadline}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-0.5 rounded text-fuchsia-400 font-bold font-mono">
                            {Math.round((g.current_amount / g.target_amount) * 100)}%
                          </span>
                          <Eye className="w-4 h-4 text-slate-600 group-hover:text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Installments Section */}
              {filteredInstallments.length > 0 && (
                <div>
                  <h3 className="text-[10.5px] font-bold text-amber-400 tracking-widest uppercase mb-2 ml-1 flex items-center gap-1.5 font-sans">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Parcelamentos ({filteredInstallments.length})
                  </h3>
                  <div className="space-y-1">
                    {filteredInstallments.map((i) => (
                      <div
                        key={i.id}
                        onClick={() => {
                          onSelectResult("installment", i);
                          onClose();
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 hover:bg-amber-950/20 border border-transparent hover:border-amber-500/20 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold border border-amber-500/20">
                            📦
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-300">
                              {i.description}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {i.current_installment}/{i.installments_count} parcelas pagas • R$ {(i.total_amount / i.installments_count).toLocaleString("pt-BR")}/mês
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-bold font-mono">
                            R$ {i.total_amount.toLocaleString("pt-BR")}
                          </span>
                          <Eye className="w-4 h-4 text-slate-600 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/50 border-t border-cyan-950/40 text-[10px] text-slate-600 text-center font-mono">
          Use a barra inteligente para localizar qualquer despesa, receita ou meta em milissegundos.
        </div>
      </div>
    </div>
  );
}
