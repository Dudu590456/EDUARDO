"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Activity,
  Calendar,
  CloudLightning,
  Sparkles,
  CreditCard,
  Target,
  RefreshCw,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction, Goal, Installment } from "../lib/types";
import { isSupabaseConfigured, getSupabaseClient } from "../lib/supabase";
import AdvancedPremiumModules from "../components/AdvancedPremiumModules";

// Formatting helpers
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

export default function Page() {
  const userEmail = "edu.rocha785@gmail.com";

  // State lists
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);

  // Input states for transactions
  const [txDesc, setTxDesc] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"receita" | "despesa">("receita");
  const [txCategory, setTxCategory] = useState("Alimentação");
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Input states for goals
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  // Input states for installments
  const [instDesc, setInstDesc] = useState("");
  const [instTotalAmount, setInstTotalAmount] = useState("");
  const [instCount, setInstCount] = useState("");

  // UI States
  const [activeSegment, setActiveSegment] = useState<"transactions" | "goals" | "installments">("transactions");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error" | "offline">("syncing");
  const [errorMessage, setErrorMessage] = useState("");
  const [suggestedSql, setSuggestedSql] = useState("");

  // Load All Data from Supabase Client
  const loadAllData = async () => {
    setSyncStatus("syncing");
    const active = isSupabaseConfigured();
    if (!active) {
      setSyncStatus("offline");
      setErrorMessage("Supabase não está configurado. Verifique o arquivo .env.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setSyncStatus("offline");
      return;
    }

    try {
      const userId = "user-" + userEmail.replace(/[@.]/g, "-");

      // 1. Fetch transactions
      const { data: txData, error: txErr } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (txErr) {
        if (txErr.message.includes("Could not find the table")) {
          // Table doesn't exist
          setSuggestedSql(prev => prev + `
-- Criar tabela de transações
CREATE TABLE public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category TEXT,
  date DATE NOT NULL
);
`);
        }
        throw txErr;
      }

      if (txData) {
        setTransactions(
          txData.map((item: any) => ({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount),
            type: item.type as "receita" | "despesa",
            date: item.date,
            category: item.category || "Geral",
          }))
        );
      }

      // 2. Fetch goals
      const { data: goalData, error: goalErr } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId);

      if (goalErr) {
        if (goalErr.message.includes("Could not find the table")) {
          setSuggestedSql(prev => prev + `
-- Criar tabela de metas
CREATE TABLE public.goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  active BOOLEAN DEFAULT true
);
`);
        }
        throw goalErr;
      }

      if (goalData) {
        setGoals(
          goalData.map((item: any) => ({
            id: item.id,
            name: item.name,
            target_amount: parseFloat(item.target_amount),
            current_amount: parseFloat(item.current_amount),
            deadline: item.deadline || "",
            active: item.active !== false,
          }))
        );
      }

      // 3. Fetch installments
      const { data: instData, error: instErr } = await supabase
        .from("installments")
        .select("*")
        .eq("user_id", userId);

      if (instErr) {
        if (instErr.message.includes("Could not find the table")) {
          setSuggestedSql(prev => prev + `
-- Criar tabela de parcelamentos
CREATE TABLE public.installments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installments_count INTEGER NOT NULL,
  current_installment INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  date_started DATE NOT NULL
);
`);
        }
        throw instErr;
      }

      if (instData) {
        setInstallments(
          instData.map((item: any) => ({
            id: item.id,
            description: item.description,
            total_amount: parseFloat(item.total_amount),
            installments_count: parseInt(item.installments_count),
            current_installment: parseInt(item.current_installment),
            active: item.active !== false,
            date_started: item.date_started || new Date().toISOString().split("T")[0],
          }))
        );
      }

      setSyncStatus("synced");
      setErrorMessage("");
    } catch (err: any) {
      console.error("Erro ao carregar dados do Supabase:", err);
      setSyncStatus("error");
      setErrorMessage("Erro de sinc: " + err.message);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Trigger autobackup function (requested by user to update directly utilizing Supabase Client)
  const triggerAutoBackup = async (type: "transactions" | "goals" | "installments", payload: any, action: "insert" | "update" | "delete") => {
    setSyncStatus("syncing");
    const active = isSupabaseConfigured();
    if (!active) {
      setSyncStatus("offline");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const userId = "user-" + userEmail.replace(/[@.]/g, "-");

      if (type === "transactions") {
        if (action === "insert") {
          await supabase.from("transactions").insert({
            id: payload.id,
            user_id: userId,
            description: payload.description,
            amount: payload.amount,
            type: payload.type,
            category: payload.category,
            date: payload.date,
          });
        } else if (action === "delete") {
          await supabase.from("transactions").delete().eq("id", payload.id);
        }
      } else if (type === "goals") {
        if (action === "insert") {
          await supabase.from("goals").insert({
            id: payload.id,
            user_id: userId,
            name: payload.name,
            target_amount: payload.target_amount,
            current_amount: payload.current_amount,
            deadline: payload.deadline || null,
            active: payload.active,
          });
        } else if (action === "update") {
          await supabase.from("goals").update({
            current_amount: payload.current_amount,
            active: payload.active,
          }).eq("id", payload.id);
        } else if (action === "delete") {
          await supabase.from("goals").delete().eq("id", payload.id);
        }
      } else if (type === "installments") {
        if (action === "insert") {
          await supabase.from("installments").insert({
            id: payload.id,
            user_id: userId,
            description: payload.description,
            total_amount: payload.total_amount,
            installments_count: payload.installments_count,
            current_installment: payload.current_installment,
            active: payload.active,
            date_started: payload.date_started,
          });
        } else if (action === "update") {
          await supabase.from("installments").update({
            current_installment: payload.current_installment,
            active: payload.active,
          }).eq("id", payload.id);
        } else if (action === "delete") {
          await supabase.from("installments").delete().eq("id", payload.id);
        }
      }

      setSyncStatus("synced");
    } catch (err: any) {
      console.error(`Erro no auto-backup (${type} - ${action}):`, err);
      setSyncStatus("error");
      setErrorMessage(`Erro ao persistir no Supabase: ${err.message}`);
    }
  };

  // Add Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc || !txAmount) return;

    const txId = "tx-" + Date.now();
    const parsedAmount = parseFloat(txAmount);

    const newTx: Transaction = {
      id: txId,
      description: txDesc,
      amount: parsedAmount,
      type: txType,
      date: txDate,
      category: txCategory,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setTxDesc("");
    setTxAmount("");

    // Trigger instant Supabase Sync
    await triggerAutoBackup("transactions", newTx, "insert");
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await triggerAutoBackup("transactions", { id }, "delete");
  };

  // Add Goal
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTarget) return;

    const goalId = "gl-" + Date.now();
    const target = parseFloat(goalTarget);
    const current = parseFloat(goalCurrent) || 0;

    const newGoal: Goal = {
      id: goalId,
      name: goalName,
      target_amount: target,
      current_amount: current,
      deadline: goalDeadline || new Date().toISOString().split("T")[0],
      active: true,
    };

    setGoals((prev) => [...prev, newGoal]);
    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("");
    setGoalDeadline("");

    await triggerAutoBackup("goals", newGoal, "insert");
  };

  // Quick increment current savings goal
  const handleQuickIncrementGoal = async (id: string, increment: number) => {
    let updatedGoal: Goal | null = null;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const newCurrent = Math.min(g.target_amount, g.current_amount + increment);
          updatedGoal = { ...g, current_amount: newCurrent };
          return updatedGoal;
        }
        return g;
      })
    );

    if (updatedGoal) {
      await triggerAutoBackup("goals", updatedGoal, "update");
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await triggerAutoBackup("goals", { id }, "delete");
  };

  // Add Installment
  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instDesc || !instTotalAmount || !instCount) return;

    const instId = "inst-" + Date.now();
    const total = parseFloat(instTotalAmount);
    const count = parseInt(instCount);
    const started = new Date().toISOString().split("T")[0];

    const newInst: Installment = {
      id: instId,
      description: instDesc,
      total_amount: total,
      installments_count: count,
      current_installment: 1,
      active: true,
      date_started: started,
    };

    setInstallments((prev) => [...prev, newInst]);
    setInstDesc("");
    setInstTotalAmount("");
    setInstCount("");

    await triggerAutoBackup("installments", newInst, "insert");
  };

  // Pay next installment / Advance
  const handleAdvanceInstallment = async (id: string) => {
    let updatedInst: Installment | null = null;
    setInstallments((prev) =>
      prev.map((ins) => {
        if (ins.id === id) {
          const next = ins.current_installment + 1;
          const isFinished = next > ins.installments_count;
          updatedInst = {
            ...ins,
            current_installment: Math.min(ins.installments_count, next),
            active: !isFinished,
          };
          return updatedInst;
        }
        return ins;
      })
    );

    if (updatedInst) {
      await triggerAutoBackup("installments", updatedInst, "update");
    }
  };

  // Delete Installment
  const handleDeleteInstallment = async (id: string) => {
    setInstallments((prev) => prev.filter((i) => i.id !== id));
    await triggerAutoBackup("installments", { id }, "delete");
  };

  // Calculate stats
  const totalIncomes = transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + t.amount, 0);

  const overallBalance = totalIncomes - totalExpenses;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8" id="financial-dashboard-container">
      {/* Top Navigation / Branding Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
              <CloudLightning size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">NexFin</h1>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">
              v1.2
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Seu assistente financeiro de verdade, sincronizado com Supabase em tempo real.
          </p>
        </div>

        {/* Sync status box */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg md:self-end">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                syncStatus === "synced"
                  ? "bg-emerald-500 animate-pulse"
                  : syncStatus === "syncing"
                    ? "bg-amber-500 animate-bounce"
                    : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-medium text-slate-300 capitalize">
              {syncStatus === "synced"
                ? "Sincronizado"
                : syncStatus === "syncing"
                  ? "Sincronizando..."
                  : "Erro Sinc"}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-mono text-slate-400">{userEmail}</span>
          <button
            onClick={loadAllData}
            title="Recarregar Dados"
            className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white"
          >
            <RefreshCw size={12} className={syncStatus === "syncing" ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Database Setup Help Banner */}
      {errorMessage && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-xl space-y-3" id="error-config-alert">
          <div className="flex items-start gap-3">
            <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-amber-500">Atenção ao Esquema do Banco no Supabase</p>
              <p className="text-xs text-slate-300 mt-1">
                Fomos instruídos a persistir diretamente no Supabase em vez de localStorage. Detectamos que as tabelas
                exigidas ainda não foram criadas no banco de dados {syncStatus === "error" ? "ou houve um erro de conexão." : "."}
              </p>
            </div>
          </div>
          {suggestedSql && (
            <div className="mt-2">
              <p className="text-[11px] text-slate-400 font-semibold mb-1">
                Execute o SQL abaixo no editor SQL do seu painel do Supabase para criar as tabelas necessárias:
              </p>
              <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-auto max-h-[160px]">
                {suggestedSql}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Section 1: Dashboard Stats Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="stats-metrics-grid">
        {/* Total balance card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saldo Geral</span>
            <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <DollarSign size={16} />
            </span>
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight mt-3 text-white">
            {formatCurrency(overallBalance)}
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 font-sans">Receitas deduzidas de despesas ativa</p>
        </div>

        {/* Total incomes card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Receitas</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <TrendingUp size={16} />
            </span>
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight mt-3 text-emerald-400">
            {formatCurrency(totalIncomes)}
          </h2>
          <p className="text-[10px] text-emerald-500/40 mt-1 font-sans">Ganhos e faturamentos registrados</p>
        </div>

        {/* Total expenses card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Despesas</span>
            <span className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
              <TrendingDown size={16} />
            </span>
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight mt-3 text-rose-500">
            {formatCurrency(totalExpenses)}
          </h2>
          <p className="text-[10px] text-rose-500/40 mt-1 font-sans">Compromissos e despesas lançadas</p>
        </div>
      </div>

      {/* Main Core Form & Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-columns-grid">
        {/* Column 1: Fast Inputs Form */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-amber-500" /> Carregar Lançamentos
            </h2>

            {/* Form Toggle Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs mb-4">
              <button
                onClick={() => setActiveSegment("transactions")}
                className={`w-full py-1.5 rounded-md font-medium transition ${
                  activeSegment === "transactions" ? "bg-slate-800 text-amber-400 animate-pulse" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                Transação
              </button>
              <button
                onClick={() => setActiveSegment("goals")}
                className={`w-full py-1.5 rounded-md font-medium transition ${
                  activeSegment === "goals" ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                Meta
              </button>
              <button
                onClick={() => setActiveSegment("installments")}
                className={`w-full py-1.5 rounded-md font-medium transition ${
                  activeSegment === "installments" ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                Parcelamento
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeSegment === "transactions" && (
                <motion.form
                  key="form-tx"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleAddTransaction}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Tipo</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        value={txType}
                        onChange={(e) => setTxType(e.target.value as "receita" | "despesa")}
                      >
                        <option value="receita">Receita</option>
                        <option value="despesa">Despesa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Categoria</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                      >
                        <option value="Alimentação">Alimentação</option>
                        <option value="Salário">Salário</option>
                        <option value="Moradia">Moradia</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Descrição</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                      value={txDesc}
                      onChange={(e) => setTxDesc(e.target.value)}
                      placeholder="Ex: Supermercado, Aluguel"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        placeholder="Ex: 125.50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Data</label>
                      <input
                        type="date"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Registrar Transação
                  </button>
                </motion.form>
              )}

              {activeSegment === "goals" && (
                <motion.form
                  key="form-goal"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleAddGoal}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block text-slate-500 mb-1">Nome da Meta</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      placeholder="Ex: Viagem de Férias, Reserva"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Valor Almejado (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        placeholder="Ex: 5000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Depósito Inicial (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        value={goalCurrent}
                        onChange={(e) => setGoalCurrent(e.target.value)}
                        placeholder="Ex: 500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Data Limite (Deadline)</label>
                    <input
                      type="date"
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Estabelecer Nova Meta
                  </button>
                </motion.form>
              )}

              {activeSegment === "installments" && (
                <motion.form
                  key="form-inst"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleAddInstallment}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block text-slate-500 mb-1">Descrição</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                      value={instDesc}
                      onChange={(e) => setInstDesc(e.target.value)}
                      placeholder="Ex: MacBook parcelado, Seguro"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Valor Total (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        value={instTotalAmount}
                        onChange={(e) => setInstTotalAmount(e.target.value)}
                        placeholder="Ex: 2400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Parc. (Vezes)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                        value={instCount}
                        onChange={(e) => setInstCount(e.target.value)}
                        placeholder="Ex: 12"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} /> Registrar Parcelamento
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Column 2 & 3: Lists Visualization Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            {/* Header of Content Board */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity size={16} className="text-amber-500" />{" "}
                {activeSegment === "transactions"
                  ? "Histórico de Transações"
                  : activeSegment === "goals"
                    ? "Suas Metas Ativas"
                    : "Lançamentos Parcelados"}
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                Total registrado:{" "}
                {activeSegment === "transactions"
                  ? transactions.length
                  : activeSegment === "goals"
                    ? goals.length
                    : installments.length}
              </span>
            </div>

            {/* List Panels wrapper */}
            <div className="space-y-3 min-h-[280px]">
              {activeSegment === "transactions" && (
                <div className="space-y-2">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xs text-slate-500 italic">Nenhuma transação ativa.</p>
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/80 hover:border-slate-700 transition"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`h-2.5 w-2/5 p-1 rounded text-[10px] font-bold shrink-0 text-center ${
                            tx.type === "receita" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {tx.category || "Geral"}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{tx.description}</p>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar size={10} /> {tx.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span
                            className={`text-xs font-mono font-bold ${
                              tx.type === "receita" ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {tx.type === "receita" ? "+" : "-"} {formatCurrency(tx.amount)}
                          </span>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-1 text-slate-500 hover:text-rose-500 rounded border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSegment === "goals" && (
                <div className="space-y-3">
                  {goals.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xs text-slate-500 italic">Nenhuma meta ativa cadastrada no momento.</p>
                    </div>
                  ) : (
                    goals.map((g) => {
                      const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)) || 0;
                      return (
                        <div
                          key={g.id}
                          className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Target size={14} className="text-amber-500" /> {g.name}
                              </p>
                              {g.deadline && (
                                <span className="text-[10px] text-slate-500 mt-0.5 block">Prazo: {g.deadline}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuickIncrementGoal(g.id, 100)}
                                className="px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20 text-[10px] font-bold rounded transition"
                              >
                                + R$ 100
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(g.id)}
                                className="p-1 text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 rounded transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span>Progresso: {pct}%</span>
                              <span className="font-mono">
                                {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeSegment === "installments" && (
                <div className="space-y-3">
                  {installments.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-xs text-slate-500 italic">Nenhum parcelamento ativo cadastrado.</p>
                    </div>
                  ) : (
                    installments.map((ins) => {
                      const monthlyVal = ins.total_amount / ins.installments_count;
                      return (
                        <div
                          key={ins.id}
                          className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <CreditCard size={14} className="text-amber-500" /> {ins.description}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Valor Total Parc: {formatCurrency(ins.total_amount)} ({ins.installments_count}x de{" "}
                              {formatCurrency(monthlyVal)})
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-slate-200">
                                Parcela {ins.current_installment}/{ins.installments_count}
                              </span>
                              {!ins.active && (
                                <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 justify-end">
                                  <CheckCircle size={10} /> Quitado
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ins.active && (
                                <button
                                  onClick={() => handleAdvanceInstallment(ins.id)}
                                  className="px-2 py-1 bg-amber-500 text-slate-950 hover:bg-amber-600 text-[10px] font-semibold rounded transition"
                                >
                                  Pagar Parc.
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInstallment(ins.id)}
                                className="p-1 text-slate-500 hover:text-rose-500 rounded border border-transparent hover:border-rose-500/20 transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Premium Integration Segment */}
      <AdvancedPremiumModules userEmail={userEmail} />
    </div>
  );
}
