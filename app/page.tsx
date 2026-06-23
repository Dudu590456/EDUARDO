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
  Info,
  Database,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Server,
  Network
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

const FULL_SQL_SCRIPT = `-- ========================================================
-- SCRIPT DE INICIALIZAÇÃO COMPLETO - DATABASE SCHEMA NEXFIN
-- Execute este script no SQL Editor do seu Painel Supabase
-- para habilitar todos os módulos (Básicos e Premium).
-- ========================================================

-- 1. Tabela de Transações (Básico)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category TEXT DEFAULT 'Geral',
  date DATE NOT NULL
);

-- 2. Tabela de Metas de Economia (Básico)
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  active BOOLEAN DEFAULT true
);

-- 3. Tabela de Parcelamentos (Básico)
CREATE TABLE IF NOT EXISTS public.installments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  installments_count INTEGER NOT NULL,
  current_installment INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  date_started DATE NOT NULL
);

-- 4. Tabela de Membros da Família (Premium)
CREATE TABLE IF NOT EXISTS public.family_members (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  permission TEXT CHECK (permission IN ('read', 'write', 'admin'))
);

-- 5. Tabela de Transações PJ/Freelancer (Premium)
CREATE TABLE IF NOT EXISTS public.business_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  client TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL
);

-- 6. Tabela de Assinaturas e Recorrências (Premium)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  next_bill DATE,
  logo TEXT DEFAULT '💳',
  active BOOLEAN DEFAULT true
);

-- --------------------------------------------------------
-- POLÍTICAS DE SEGURANÇA E BUNDLES RLS (ROW LEVEL SECURITY)
-- Habilita o acesso rápido de leitura e gravação simplificado
-- --------------------------------------------------------

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso livre transacoes" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso livre metas" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso livre parcelas" ON public.installments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso livre membros" ON public.family_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso livre freelancer" ON public.business_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso livre assinaturas" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
`;

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
  
  // Advanced Diagnostics & Offline States
  const [tableStatus, setTableStatus] = useState<Record<string, "success" | "missing" | "error" | "loading">>({
    transactions: "loading",
    goals: "loading",
    installments: "loading",
    family_members: "loading",
    business_transactions: "loading",
    subscriptions: "loading",
  });
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState<boolean>(true);
  const [bulkSyncing, setBulkSyncing] = useState<boolean>(false);
  const [bulkSyncResult, setBulkSyncResult] = useState<string | null>(null);

  // Read offline/localStorage mode toggle on mount
  useEffect(() => {
    try {
      const storedOffline = localStorage.getItem("nexfin_offline_mode") === "true";
      setOfflineMode(storedOffline);
    } catch (e) {
      console.error("Local storage indisponível", e);
    }
  }, []);

  // Sync state offlineMode to local Storage when updated
  const toggleOfflineMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextVal = !offlineMode;
    setOfflineMode(nextVal);
    localStorage.setItem("nexfin_offline_mode", nextVal ? "true" : "false");
    
    if (nextVal) {
      setSyncStatus("offline");
      setErrorMessage("");
    } else {
      loadAllData();
    }
  };

  // Inspect schema elements independently to find which tables are created
  const checkSupabaseSchema = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const status: Record<string, "success" | "missing" | "error" | "loading"> = {
      transactions: "loading",
      goals: "loading",
      installments: "loading",
      family_members: "loading",
      business_transactions: "loading",
      subscriptions: "loading",
    };

    // 1. Check transactions table
    try {
      const { error } = await supabase.from("transactions").select("id").limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.code === "42P01") {
          status.transactions = "missing";
        } else {
          status.transactions = "error";
        }
      } else {
        status.transactions = "success";
      }
    } catch {
      status.transactions = "error";
    }

    // 2. Check goals table
    try {
      const { error } = await supabase.from("goals").select("id").limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.code === "42P01") {
          status.goals = "missing";
        } else {
          status.goals = "error";
        }
      } else {
        status.goals = "success";
      }
    } catch {
      status.goals = "error";
    }

    // 3. Check installments table
    try {
      const { error } = await supabase.from("installments").select("id").limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.code === "42P01") {
          status.installments = "missing";
        } else {
          status.installments = "error";
        }
      } else {
        status.installments = "success";
      }
    } catch {
      status.installments = "error";
    }

    // 4. Check family members table
    try {
      const { error } = await supabase.from("family_members").select("id").limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.code === "42P01") {
          status.family_members = "missing";
        } else {
          status.family_members = "error";
        }
      } else {
        status.family_members = "success";
      }
    } catch {
      status.family_members = "error";
    }

    // 5. Check PJ business_transactions table
    try {
      const { error } = await supabase.from("business_transactions").select("id").limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.code === "42P01") {
          status.business_transactions = "missing";
        } else {
          status.business_transactions = "error";
        }
      } else {
        status.business_transactions = "success";
      }
    } catch {
      status.business_transactions = "error";
    }

    // 6. Check subscriptions table
    try {
      const { error } = await supabase.from("subscriptions").select("id").limit(1);
      if (error) {
        if (error.message.includes("Could not find the table") || error.code === "42P01") {
          status.subscriptions = "missing";
        } else {
          status.subscriptions = "error";
        }
      } else {
        status.subscriptions = "success";
      }
    } catch {
      status.subscriptions = "error";
    }

    return status;
  };

  // Recover active elements from localStorage first, then live fetch
  const loadAllData = async () => {
    setSyncStatus("syncing");

    // Immediately fetch from Local Storage Cache for rapid optimistic viewing
    try {
      const cachedTx = localStorage.getItem("nexfin_transactions");
      const cachedGoals = localStorage.getItem("nexfin_goals");
      const cachedInst = localStorage.getItem("nexfin_installments");

      if (cachedTx) setTransactions(JSON.parse(cachedTx));
      if (cachedGoals) setGoals(JSON.parse(cachedGoals));
      if (cachedInst) setInstallments(JSON.parse(cachedInst));
    } catch (e) {
      console.warn("Nenhum cache local encontrado durante inicialização.", e);
    }

    const active = isSupabaseConfigured();
    const isForcedOffline = localStorage.getItem("nexfin_offline_mode") === "true";

    if (!active || isForcedOffline) {
      setSyncStatus("offline");
      setErrorMessage(
        isForcedOffline 
          ? "Você ativou o Modo Local Seguro. Suas alterações são lidas e persistidas exclusivamente no localStorage."
          : "Supabase não está configurado. O NexFin está sendo executado em Modo Local Seguro (localStorage)."
      );
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setSyncStatus("offline");
      return;
    }

    // Diagnose schemas
    const diagnosis = await checkSupabaseSchema();
    if (diagnosis) {
      setTableStatus(diagnosis);
      
      const missingTotal = Object.values(diagnosis).filter((s) => s === "missing").length;
      const errorTotal = Object.values(diagnosis).filter((s) => s === "error").length;

      if (missingTotal > 0) {
        setSyncStatus("error");
        setErrorMessage(`Identificamos que ${missingTotal} das 6 tabelas requeridas não existem ou precisam ser inicializadas no Supabase.`);
      } else if (errorTotal > 0) {
        setSyncStatus("error");
        setErrorMessage("Erro de conexão com o banco de dados. Verifique a conexidade com suas variáveis de ambiente.");
      } else {
        setErrorMessage("");
      }
    }

    try {
      const userId = "user-" + userEmail.replace(/[@.]/g, "-");

      // Load Transactions if table is verified successfully
      if (diagnosis?.transactions === "success") {
        const { data: txData, error: txErr } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });

        if (!txErr && txData) {
          const mapped = txData.map((item: any) => ({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount),
            type: item.type as "receita" | "despesa",
            date: item.date,
            category: item.category || "Geral",
          }));
          setTransactions(mapped);
          localStorage.setItem("nexfin_transactions", JSON.stringify(mapped));
        }
      }

      // Load Goals if table is verified successfully
      if (diagnosis?.goals === "success") {
        const { data: goalData, error: goalErr } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", userId);

        if (!goalErr && goalData) {
          const mapped = goalData.map((item: any) => ({
            id: item.id,
            name: item.name,
            target_amount: parseFloat(item.target_amount),
            current_amount: parseFloat(item.current_amount),
            deadline: item.deadline || "",
            active: item.active !== false,
          }));
          setGoals(mapped);
          localStorage.setItem("nexfin_goals", JSON.stringify(mapped));
        }
      }

      // Load Installments if table is verified successfully
      if (diagnosis?.installments === "success") {
        const { data: instData, error: instErr } = await supabase
          .from("installments")
          .select("*")
          .eq("user_id", userId);

        if (!instErr && instData) {
          const mapped = instData.map((item: any) => ({
            id: item.id,
            description: item.description,
            total_amount: parseFloat(item.total_amount),
            installments_count: parseInt(item.installments_count),
            current_installment: parseInt(item.current_installment),
            active: item.active !== false,
            date_started: item.date_started || new Date().toISOString().split("T")[0],
          }));
          setInstallments(mapped);
          localStorage.setItem("nexfin_installments", JSON.stringify(mapped));
        }
      }

      // Determine global sync status
      if (diagnosis) {
        const hasMissing = Object.values(diagnosis).some((s) => s === "missing");
        const hasError = Object.values(diagnosis).some((s) => s === "error");
        
        if (!hasMissing && !hasError) {
          setSyncStatus("synced");
          setErrorMessage("");
        } else {
          setSyncStatus("error");
        }
      }
    } catch (err: any) {
      console.error("Erro no fetch de dados Supabase:", err);
      setSyncStatus("error");
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Local sync to Cloud DB (Bulk sync offline entries)
  const handleBulkCloudSync = async () => {
    setBulkSyncing(true);
    setBulkSyncResult(null);

    const active = isSupabaseConfigured();
    if (!active) {
      setBulkSyncResult("Erro: Conectores Supabase não configurados em seu ambiente.");
      setBulkSyncing(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setBulkSyncResult("Erro: Cliente de API Supabase falhou ao inicializar.");
      setBulkSyncing(false);
      return;
    }

    try {
      const userId = "user-" + userEmail.replace(/[@.]/g, "-");
      let countTx = 0;
      let countGl = 0;
      let countIns = 0;

      // 1. Transactions Upload
      for (const tx of transactions) {
        // Safe check for existing
        const { data: pre } = await supabase.from("transactions").select("id").eq("id", tx.id).maybeSingle();
        if (!pre) {
          await supabase.from("transactions").insert({
            id: tx.id,
            user_id: userId,
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            category: tx.category || "Geral",
            date: tx.date,
          });
          countTx++;
        }
      }

      // 2. Goals Upload
      for (const val of goals) {
        const { data: pre } = await supabase.from("goals").select("id").eq("id", val.id).maybeSingle();
        if (!pre) {
          await supabase.from("goals").insert({
            id: val.id,
            user_id: userId,
            name: val.name,
            target_amount: val.target_amount,
            current_amount: val.current_amount,
            deadline: val.deadline || null,
            active: val.active,
          });
          countGl++;
        }
      }

      // 3. Installments Upload
      for (const inst of installments) {
        const { data: pre } = await supabase.from("installments").select("id").eq("id", inst.id).maybeSingle();
        if (!pre) {
          await supabase.from("installments").insert({
            id: inst.id,
            user_id: userId,
            description: inst.description,
            total_amount: inst.total_amount,
            installments_count: inst.installments_count,
            current_installment: inst.current_installment,
            active: inst.active,
            date_started: inst.date_started,
          });
          countIns++;
        }
      }

      setBulkSyncResult(`Sincronização em lote concluída! Subimos ${countTx} transações, ${countGl} metas e ${countIns} parcelas.`);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      setBulkSyncResult(`Falha na exportação: ${err.message}`);
    } finally {
      setBulkSyncing(false);
      setTimeout(() => setBulkSyncResult(null), 6000);
    }
  };

  // Trigger auto backup action helper (updates local and proxies to Supabase if online)
  const triggerAutoBackup = async (
    type: "transactions" | "goals" | "installments",
    payload: any,
    action: "insert" | "update" | "delete"
  ) => {
    // If explicitly offline mode, just rely on localStorage (already written in handlers)
    if (offlineMode) return;

    const active = isSupabaseConfigured();
    if (!active) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setSyncStatus("syncing");
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
      setErrorMessage("");
    } catch (err: any) {
      console.warn(`Erro no auto-backup (${type} - ${action}):`, err);
      setSyncStatus("error");
      setErrorMessage(`O item foi salvo apenas localmente. Erro no Supabase: ${err.message}`);
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

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem("nexfin_transactions", JSON.stringify(updated));

    setTxDesc("");
    setTxAmount("");

    await triggerAutoBackup("transactions", newTx, "insert");
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    localStorage.setItem("nexfin_transactions", JSON.stringify(updated));

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

    const updated = [...goals, newGoal];
    setGoals(updated);
    localStorage.setItem("nexfin_goals", JSON.stringify(updated));

    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("");
    setGoalDeadline("");

    await triggerAutoBackup("goals", newGoal, "insert");
  };

  // Quick increment current savings goal
  const handleQuickIncrementGoal = async (id: string, increment: number) => {
    let updatedGoal: Goal | null = null;
    const updated = goals.map((g) => {
      if (g.id === id) {
        const newCurrent = Math.min(g.target_amount, g.current_amount + increment);
        updatedGoal = { ...g, current_amount: newCurrent };
        return updatedGoal;
      }
      return g;
    });

    setGoals(updated);
    localStorage.setItem("nexfin_goals", JSON.stringify(updated));

    if (updatedGoal) {
      await triggerAutoBackup("goals", updatedGoal, "update");
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    localStorage.setItem("nexfin_goals", JSON.stringify(updated));

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

    const updated = [...installments, newInst];
    setInstallments(updated);
    localStorage.setItem("nexfin_installments", JSON.stringify(updated));

    setInstDesc("");
    setInstTotalAmount("");
    setInstCount("");

    await triggerAutoBackup("installments", newInst, "insert");
  };

  // Pay next installment / Advance
  const handleAdvanceInstallment = async (id: string) => {
    let updatedInst: Installment | null = null;
    const updated = installments.map((ins) => {
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
    });

    setInstallments(updated);
    localStorage.setItem("nexfin_installments", JSON.stringify(updated));

    if (updatedInst) {
      await triggerAutoBackup("installments", updatedInst, "update");
    }
  };

  // Delete Installment
  const handleDeleteInstallment = async (id: string) => {
    const updated = installments.filter((i) => i.id !== id);
    setInstallments(updated);
    localStorage.setItem("nexfin_installments", JSON.stringify(updated));

    await triggerAutoBackup("installments", { id }, "delete");
  };

  // Copy unified script with visual success callback state
  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => {
      setCopiedSql(false);
    }, 2000);
  };

  // Calculate stats
  const totalIncomes = transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + t.amount, 0);

  const overallBalance = totalIncomes - totalExpenses;

  // Track if any schema table checks are missing or pending
  const hasPendingSchemaMsg = Object.values(tableStatus).some((s) => s === "missing") && isSupabaseConfigured();

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
              v1.5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Seu assistente financeiro de verdade, sincronizado com Supabase em tempo real.
          </p>
        </div>

        {/* Sync status box */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-lg md:self-end">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                offlineMode 
                  ? "bg-slate-500" 
                  : syncStatus === "synced"
                    ? "bg-emerald-500 animate-pulse"
                    : syncStatus === "syncing"
                      ? "bg-amber-500 animate-bounce"
                      : "bg-rose-500"
              }`}
            />
            <span className="text-xs font-medium text-slate-300 capitalize">
              {offlineMode 
                ? "Modo Local" 
                : syncStatus === "synced"
                  ? "Nuvem Sinc"
                  : syncStatus === "syncing"
                    ? "Sincronizando..."
                    : "Erro Conexão"}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <span className="text-xs font-mono text-slate-400">{userEmail}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={offlineMode}
              title="Recarregar do Supabase"
              className={`p-1.5 rounded transition text-slate-400 hover:text-white ${offlineMode ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-800"}`}
            >
              <RefreshCw size={13} className={syncStatus === "syncing" ? "animate-spin" : ""} />
            </button>
            <button
              onClick={toggleOfflineMode}
              title={offlineMode ? "Desativar Modo Local (Ligar Nuvem)" : "Ativar Modo Local Seguro"}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-slate-950 hover:bg-slate-850 hover:text-slate-100 border border-slate-800 rounded text-slate-300 transition"
            >
              {offlineMode ? <ToggleRight size={16} className="text-amber-500" /> : <ToggleLeft size={16} />}
              <span>Local</span>
            </button>
          </div>
        </div>
      </div>

      {/* RE-ARCHITECTED DATABASE SETUP AND SCHEMA CONFIGURATION ASSISTANT */}
      {errorMessage && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl" id="error-config-alert">
          {/* Header */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg mt-0.5">
                <Database size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Painel de Diagnóstico do Banco de Dados / Supabase</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {errorMessage} {offlineMode ? "" : "Ativamos o backup em cache local para garantir operação ininterrupta."}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={() => setShowDiagnosticsPanel(!showDiagnosticsPanel)}
                className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
              >
                {showDiagnosticsPanel ? "Ocultar Detalhes" : "Ver Instruções & SQL"}
              </button>
            </div>
          </div>

          {/* Details Body */}
          <AnimatePresence>
            {showDiagnosticsPanel && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 space-y-6">
                  {/* Status Grid check box */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-amber-500" />
                      Status Individual das Tabelas do Projeto:
                    </h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      {Object.entries(tableStatus).map(([tabName, status]) => (
                        <div 
                          key={tabName} 
                          className={`p-2.5 rounded-lg border text-xs text-center flex flex-col items-center justify-center gap-1 ${
                            status === "success" 
                              ? "bg-emerald-500/5 border-emerald-500/20" 
                              : status === "missing"
                                ? "bg-amber-500/5 border-amber-500/20"
                                : status === "error"
                                  ? "bg-rose-500/5 border-rose-500/20"
                                  : "bg-slate-900 border-slate-800"
                          }`}
                        >
                          <span className="font-semibold text-[10px] text-slate-400 capitalize truncate w-full" title={tabName}>
                            {tabName.replace("_", " ")}
                          </span>
                          
                          {status === "success" && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                              <CheckCircle size={9} /> Ativa
                            </span>
                          )}
                          {status === "missing" && (
                            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                              <AlertCircle size={9} /> Pendente
                            </span>
                          )}
                          {status === "error" && (
                            <span className="text-[10px] text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                              <AlertCircle size={9} /> Conexão
                            </span>
                          )}
                          {status === "loading" && (
                            <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded font-bold animate-pulse">
                              Lendo...
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Column (Bulk Sync / Move to Local) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">🛠️ Solução Temporária: Modo Local Ativado</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Enquanto você não executa as queries SQL abaixo no Supabase, mantivemos as operações rodando perfeitamente e guardando as transações, metas e parcelamentos no navegador.
                      </p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={toggleOfflineMode}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-xs border border-slate-800 text-slate-200 hover:text-white rounded font-medium transition"
                        >
                          {offlineMode ? "Desativar Local (Usar Nuvem)" : "Forçar Modo Local/Offline"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-200">🚀 Exportar Dados Locais para o Supabase</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Depois que criar as tabelas do script SQL em seu painel no Supabase, clique no botão abaixo para sincronizar todos os registros que você inseriu localmente diretamente para a Nuvem de uma só vez!
                      </p>
                      
                      <div className="mt-3">
                        <button
                          onClick={handleBulkCloudSync}
                          disabled={bulkSyncing}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-xs text-slate-950 font-bold rounded flex items-center gap-1.5 transition"
                        >
                          <Server size={12} className={bulkSyncing ? "animate-spin" : ""} />
                          {bulkSyncing ? "Exportando..." : "Subir Dados Offline para o Supabase"}
                        </button>
                        
                        {bulkSyncResult && (
                          <p className="text-[10px] text-slate-300 mt-1.5 bg-slate-950 px-2 py-1 border border-slate-800 rounded font-medium">
                            {bulkSyncResult}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Copy SQL Box */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CodeIcon className="h-4 w-4" /> Script SQL de Inicialização Completa
                      </span>
                      <button
                        onClick={handleCopySql}
                        className="flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white text-[11px] text-slate-300 font-bold transition duration-150"
                      >
                        {copiedSql ? (
                          <>
                            <Check size={11} className="text-emerald-400" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={11} /> Copiar SQL Completo
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      Vá em <span className="text-slate-200">Database Dashboard do Supabase &gt; SQL Editor &gt; New Query</span>, cole as linhas abaixo e clique em <span className="text-emerald-400 font-bold">Run</span> para criar as tabelas e habilitar as permissões de acesso:
                    </p>

                    <pre className="bg-slate-950 p-4 border border-slate-900 rounded-lg text-[11px] text-emerald-400 font-mono overflow-auto max-h-[180px] scrollbar-thin scrollbar-thumb-slate-800">
                      {FULL_SQL_SCRIPT}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 mb-1"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500 text-slate-200"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Registrar Transação {offlineMode && "Local"}
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
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-300 focus:outline-none focus:border-amber-500 text-slate-200"
                      value={goalDeadline}
                      onChange={(e) => setGoalDeadline(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Estabelecer Nova Meta {offlineMode && "Local"}
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
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} /> Registrar Parcelamento {offlineMode && "Local"}
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
                    : installments.length}{" "}
                {offlineMode ? "(Local)" : ""}
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
                            className="p-1 text-slate-500 hover:text-rose-500 rounded border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 transition cursor-pointer"
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
                                className="px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20 text-[10px] font-bold rounded transition cursor-pointer"
                              >
                                + R$ 100
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(g.id)}
                                className="p-1 text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 rounded transition cursor-pointer"
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
                                  className="px-2 py-1 bg-amber-500 text-slate-950 hover:bg-amber-600 text-[10px] font-semibold rounded transition cursor-pointer"
                                >
                                  Pagar Parc.
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInstallment(ins.id)}
                                className="p-1 text-slate-500 hover:text-rose-500 rounded border border-transparent hover:border-rose-500/20 transition cursor-pointer"
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
      <AdvancedPremiumModules userEmail={userEmail} offlineMode={offlineMode} />
    </div>
  );
}

// Custom code icon component to replace dynamic imports or missing ones
function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
