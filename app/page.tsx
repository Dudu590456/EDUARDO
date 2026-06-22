"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  Plus, 
  LogOut, 
  User, 
  Settings, 
  Tag, 
  Briefcase, 
  ShieldCheck, 
  RefreshCw, 
  X, 
  Bell, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Calendar as CalendarIcon,
  Trash2,
  Paperclip,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Transaction, Goal, Installment, Notification, Profile } from "../lib/types";
import { PRESET_CATEGORIES, INITIAL_TRANSACTIONS, INITIAL_GOALS, INITIAL_INSTALLMENTS, INITIAL_NOTIFICATIONS } from "../lib/mockData";
import AuthScreen from "../components/AuthScreen";
import DashboardGrid from "../components/DashboardGrid";
import GlobalSearch from "../components/GlobalSearch";
import CalendarSection from "../components/CalendarSection";
import Modals from "../components/Modals";
import { isSupabaseConfigured, getSupabaseClient } from "../lib/supabase";

export default function NextFinApp() {
  // Authentication State
  const [user, setUser] = useState<Profile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [supabaseActive, setSupabaseActive] = useState(false);

  // Core App states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customCategories, setCustomCategories] = useState<typeof PRESET_CATEGORIES>({});

  // Navigation and UI control
  const [currentTab, setCurrentTab] = useState<"dashboard" | "ledger" | "calendar" | "installments" | "goals" | "reports">("dashboard");
  const [activeModal, setActiveModal] = useState<"income" | "expense" | "goal" | "installment" | "category" | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  // Form State for Profile adjustment
  const [profileName, setProfileName] = useState("");
  const [profileCpf, setProfileCpf] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  // Ledger state filters
  const [ledgerFilterType, setLedgerFilterType] = useState<"all" | "income" | "expense">("all");
  const [ledgerFilterCategory, setLedgerFilterCategory] = useState<string>("all");
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Detect Supabase integration and restore local session safely
  useEffect(() => {
    const active = isSupabaseConfigured();
    const animId = requestAnimationFrame(() => {
      setSupabaseActive(active);

      // Check user session
      const savedUser = localStorage.getItem("nexfin_premium_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setProfileName(parsed.name || "");
          setProfileCpf(parsed.cpf || "");
          setProfileEmail(parsed.email || "");
          setProfileAvatar(parsed.avatar_url || null);
        } catch (e) {
          localStorage.removeItem("nexfin_premium_user");
        }
      }
      setIsAuthLoading(false);
    });
    return () => cancelAnimationFrame(animId);
  }, []);

  // Sync datasets on mount / load mock values initially or fetch from database
  useEffect(() => {
    if (user) {
      const localTx = localStorage.getItem(`nexfin_tx_${user.id}`);
      const localGoals = localStorage.getItem(`nexfin_goals_${user.id}`);
      const localInstallments = localStorage.getItem(`nexfin_installments_${user.id}`);
      const localNotifications = localStorage.getItem(`nexfin_notifications_${user.id}`);
      
      const animId = requestAnimationFrame(() => {
        // Load preset/stored values
        if (localTx) {
          setTransactions(JSON.parse(localTx));
        } else {
          const initial = INITIAL_TRANSACTIONS(user.id);
          setTransactions(initial);
          localStorage.setItem(`nexfin_tx_${user.id}`, JSON.stringify(initial));
        }

        if (localGoals) {
          setGoals(JSON.parse(localGoals));
        } else {
          const initial = INITIAL_GOALS(user.id);
          setGoals(initial);
          localStorage.setItem(`nexfin_goals_${user.id}`, JSON.stringify(initial));
        }

        if (localInstallments) {
          setInstallments(JSON.parse(localInstallments));
        } else {
          const initial = INITIAL_INSTALLMENTS(user.id);
          setInstallments(initial);
          localStorage.setItem(`nexfin_installments_${user.id}`, JSON.stringify(initial));
        }

        if (localNotifications) {
          setNotifications(JSON.parse(localNotifications));
        } else {
          const initial = INITIAL_NOTIFICATIONS(user.id);
          setNotifications(initial);
          localStorage.setItem(`nexfin_notifications_${user.id}`, JSON.stringify(initial));
        }

        setLastSyncTime(new Date().toLocaleTimeString());
      });
      return () => cancelAnimationFrame(animId);
    }
  }, [user]);

  // Persists local storage states whenever values mutate & simulates live synchronization
  const triggerAutoBackup = (updatedTransactions: Transaction[], updatedGoals: Goal[], updatedInstallments: Installment[], updatedNotifications: Notification[]) => {
    if (!user) return;
    setSyncStatus("syncing");
    
    setTimeout(() => {
      localStorage.setItem(`nexfin_tx_${user.id}`, JSON.stringify(updatedTransactions));
      localStorage.setItem(`nexfin_goals_${user.id}`, JSON.stringify(updatedGoals));
      localStorage.setItem(`nexfin_installments_${user.id}`, JSON.stringify(updatedInstallments));
      localStorage.setItem(`nexfin_notifications_${user.id}`, JSON.stringify(updatedNotifications));
      
      setSyncStatus("success");
      setLastSyncTime(new Date().toLocaleTimeString());
      
      // Auto-reverts status to idle
      setTimeout(() => setSyncStatus("idle"), 1500);
    }, 600);
  };

  // Auth Handling
  const handleAuthSuccess = (userInfo: { name: string; email: string; cpf?: string; avatar_url?: string }) => {
    const userId = "user-" + userInfo.email.replace(/[@.]/g, "-");
    const fullUser: Profile = {
      id: userId,
      name: userInfo.name,
      email: userInfo.email,
      cpf: userInfo.cpf || "000.000.000-00",
      avatar_url: userInfo.avatar_url || `https://picsum.photos/seed/${userId}/150/150`
    };

    setUser(fullUser);
    setProfileName(fullUser.name);
    setProfileCpf(fullUser.cpf || "");
    setProfileEmail(fullUser.email);
    setProfileAvatar(fullUser.avatar_url || null);
    
    localStorage.setItem("nexfin_premium_user", JSON.stringify(fullUser));

    // Register login Notification
    const initialNotify: Notification = {
      id: "notify-login-" + Date.now(),
      user_id: userId,
      title: "Novo Login Concluído 🛡️",
      content: `Acesso realizado com sucesso no dispositivo em ${new Date().toLocaleString()}`,
      type: "login",
      is_read: false,
      created_at: new Date().toISOString()
    };
    
    // Add first notification
    const loadedNotifs = localStorage.getItem(`nexfin_notifications_${userId}`);
    const currentNotifs = loadedNotifs ? JSON.parse(loadedNotifs) : [];
    const updatedNotifs = [initialNotify, ...currentNotifs];
    setNotifications(updatedNotifs);
    localStorage.setItem(`nexfin_notifications_${userId}`, JSON.stringify(updatedNotifs));
  };

  // Force bypass auth for testing / fast preview checklist
  const handleBypassAuth = () => {
    handleAuthSuccess({
      name: "Eduardo Rocha",
      email: "edu.rocha785@gmail.com",
      cpf: "512.348.910-12"
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("nexfin_premium_user");
    setCurrentTab("dashboard");
  };

  // Profile Drawer updates
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser: Profile = {
      ...user,
      name: profileName,
      cpf: profileCpf,
      email: profileEmail,
      avatar_url: profileAvatar || user.avatar_url
    };

    setUser(updatedUser);
    localStorage.setItem("nexfin_premium_user", JSON.stringify(updatedUser));
    
    // Notify Profile Edit
    const updatedNotifications = [
      {
        id: "nt-profile-" + Date.now(),
        user_id: user.id,
        title: "Perfil Atualizado com Sucesso ✅",
        content: "Informações cadastrais e credenciais de segurança reconfiguradas.",
        type: "alert" as const,
        is_read: false,
        created_at: new Date().toISOString()
      },
      ...notifications
    ];
    setNotifications(updatedNotifications);
    triggerAutoBackup(transactions, goals, installments, updatedNotifications);
    setShowProfileDrawer(false);
  };

  // Delete Action for transactions
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    triggerAutoBackup(updated, goals, installments, notifications);
  };

  // Saving Forms Modal Items (Incomes, Expenses, Goals, Installments, Categories)
  const handleSaveModalItem = (mType: string, data: any) => {
    if (!user) return;

    let updatedTx = [...transactions];
    let updatedGoals = [...goals];
    let updatedInstallments = [...installments];
    let updatedNotifs = [...notifications];

    if (mType === "income" || mType === "expense") {
      const newTransaction: Transaction = {
        id: "tx-" + Date.now(),
        user_id: user.id,
        ...data
      };
      updatedTx = [newTransaction, ...updatedTx];

      // Add alert if excessive spending
      if (mType === "expense" && data.amount < -1500) {
        updatedNotifs = [{
          id: "nt-spending-" + Date.now(),
          user_id: user.id,
          title: "Alerta de Gasto Elevado ⚠️",
          content: `Lançamento de despesa de valor expressivo registrado: R$ ${Math.abs(data.amount).toLocaleString("pt-BR")}`,
          type: "spending",
          is_read: false,
          created_at: new Date().toISOString()
        }, ...updatedNotifs];
      }
    } else if (mType === "goal") {
      const newGoal: Goal = {
        id: "goal-" + Date.now(),
        user_id: user.id,
        ...data
      };
      updatedGoals = [newGoal, ...updatedGoals];
      
      updatedNotifs = [{
        id: "nt-goal-" + Date.now(),
        user_id: user.id,
        title: "Nova Meta de Economia Criada 🎯",
        content: `Você determinou o objetivo de acumular R$ ${data.target_amount.toLocaleString("pt-BR")} para '${data.name}'!`,
        type: "goal",
        is_read: false,
        created_at: new Date().toISOString()
      }, ...updatedNotifs];
    } else if (mType === "installment") {
      const newInstall: Installment = {
        id: "inst-" + Date.now(),
        user_id: user.id,
        ...data
      };
      updatedInstallments = [newInstall, ...updatedInstallments];

      // Add actual first month installment as transaction right away
      const newInstallmentTx: Transaction = {
        id: "tx-inst-" + Date.now(),
        user_id: user.id,
        description: `${data.product_name} (Parcela 1/${data.total_installments})`,
        amount: -data.value_per_installment,
        type: "expense",
        category: "outros",
        date: data.start_date
      };
      updatedTx = [newInstallmentTx, ...updatedTx];
    } else if (mType === "category") {
      setCustomCategories(prev => ({
        ...prev,
        [data.key]: data
      }));
      // Just feedback local categories created
    }

    setTransactions(updatedTx);
    setGoals(updatedGoals);
    setInstallments(updatedInstallments);
    setNotifications(updatedNotifs);
    triggerAutoBackup(updatedTx, updatedGoals, updatedInstallments, updatedNotifs);
  };

  // Mark notifications as read
  const handleMarkNotificationsRead = () => {
    const updated = notifications.map(n => ({ ...n, is_read: true }));
    setNotifications(updated);
    triggerAutoBackup(transactions, goals, installments, updated);
  };

  // Simulate Trigger PDF print / PDF compiled download
  const handleGeneratePDF = () => {
    window.print();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center text-cyan-400 font-sans p-6">
        <RefreshCw className="w-12 h-12 animate-spin mb-4" />
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Iniciando Ecossistema Premium NexFin...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen 
        onLoginSuccess={handleAuthSuccess} 
        supabaseActive={supabaseActive} 
        onBypass={handleBypassAuth} 
      />
    );
  }

  // Categories helper combined presets + custom items
  const ACTIVE_CATEGORIES = { ...PRESET_CATEGORIES, ...customCategories };

  // Ledger Filter list
  const filteredLedgerTx = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          t.category.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          (t.observation && t.observation.toLowerCase().includes(ledgerSearch.toLowerCase()));
    
    const matchesType = ledgerFilterType === "all" ? true : t.type === ledgerFilterType;
    const matchesCategory = ledgerFilterCategory === "all" ? true : t.category === ledgerFilterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#030712] text-slate-200 overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950 font-sans print:bg-white print:text-black" id="applet-viewport">
      
      {/* 1. Header Navigation Glassmorphism Section */}
      <header className="sticky top-0 z-40 bg-[#060914]/85 backdrop-blur-xl border-b border-cyan-500/10 px-4 py-3 sm:px-6 flex items-center justify-between shadow-lg shadow-black/20 print:hidden" id="dashboard-navbar">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-cyan-950/30 text-xl font-mono">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-white tracking-widest font-sans">NEXFIN</h1>
              <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold px-2 py-0.5 rounded-full font-mono uppercase">PREMIUM</span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">Controle Pessoal SaaS</p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          {/* Synchronizer Signal status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-900 rounded-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="text-[10.5px] font-bold text-slate-400 font-mono">
              {syncStatus === "syncing" ? "Sincronizando..." : `Salvo: ${lastSyncTime}`}
            </span>
          </div>

          {/* Smart Search box trigger */}
          <button 
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 rounded-xl transition-all shadow-md cursor-pointer"
            title="Abrir Pesquisa Global (z-index superior)"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Notifications Notification inbox alert */}
          <div className="relative">
            <button 
              type="button"
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-cyan-500/30 text-slate-400 hover:text-cyan-400 rounded-xl transition-all shadow-md relative cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              )}
            </button>

            {/* Floating Dropdown notifications list */}
            {showNotificationPopup && (
              <div className="absolute right-0 mt-3 w-80 bg-[#0a0e1c] border border-cyan-500/20 rounded-2xl shadow-2xl p-4 z-50 text-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Bell className="w-4 h-4" /> Notificações Realtime
                  </h4>
                  <button 
                    onClick={handleMarkNotificationsRead}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
                  >
                    Marcar Lidas
                  </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-6">Sem alertas para exibição imediata.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-2.5 rounded-lg border text-xs text-left ${n.is_read ? "bg-slate-950/20 border-slate-950/40" : "bg-cyan-950/10 border-cyan-500/15"}`}>
                        <div className="flex items-start justify-between gap-1">
                          <p className={`font-bold ${n.is_read ? "text-slate-300" : "text-cyan-300"}`}>{n.title}</p>
                          <span className="text-[9px] text-slate-600 whitespace-nowrap">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1 leading-relaxed text-[10.5px]">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Profile User panel */}
          <button
            type="button"
            onClick={() => setShowProfileDrawer(true)}
            className="flex items-center gap-2 p-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-xl transition-all shadow-md cursor-pointer group"
          >
            <div className="w-7 h-7 bg-indigo-500 rounded-lg overflow-hidden border border-slate-800">
              <img 
                src={profileAvatar || user.avatar_url || `https://picsum.photos/seed/${user.id}/80/80`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[11.5px] font-bold text-slate-200 group-hover:text-cyan-300 leading-tight transition-colors">{user.name.split(" ")[0]}</p>
              <p className="text-[9px] text-slate-500 leading-none">Membro Premium</p>
            </div>
          </button>
        </div>
      </header>

      {/* 2. Primary Tabs selection panel (Desktop visual rails) */}
      <nav className="bg-[#050812] border-b border-slate-900 py-2.5 px-4 flex items-center justify-start gap-2 overflow-x-auto print:hidden" id="applet-tabs-rail">
        {[
          { key: "dashboard", label: "Dashboard Inteligente", icon: "📊" },
          { key: "ledger", label: "Fluxos de Caixa", icon: "💰" },
          { key: "calendar", label: "Calendário Cron", icon: "📅" },
          { key: "installments", label: "Parcelamentos", icon: "📦" },
          { key: "goals", label: "Plano de Metas", icon: "🎯" },
          { key: "reports", label: "Exportar Relatórios PDF", icon: "📄" }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setCurrentTab(item.key as any)}
            className={`whitespace-nowrap flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all tracking-wider cursor-pointer ${
              currentTab === item.key 
                ? "bg-slate-900 text-cyan-400 border border-cyan-500/20 shadow-md shadow-cyan-950/10" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 3. Main Dashboard Board Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8" id="primary-applet-content">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
          >
            {/* TAB 1: SMART DASHBOARD */}
            {currentTab === "dashboard" && (
              <DashboardGrid 
                transactions={transactions} 
                goals={goals} 
                onOpenModal={(type) => setActiveModal(type)} 
              />
            )}

            {/* TAB 2: LEDGER FLUXOS DE CAIXA */}
            {currentTab === "ledger" && (
              <div className="space-y-6" id="ledger-tab-panel">
                
                {/* Advanced Filter Toolbar */}
                <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
                    {/* Search Field */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="text"
                        value={ledgerSearch}
                        onChange={(e) => setLedgerSearch(e.target.value)}
                        placeholder="Filtrar por nome, observação..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/40 rounded-xl text-xs text-slate-200 outline-none placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-cyan-500/30"
                      />
                    </div>

                    {/* Filter Type */}
                    <select
                      value={ledgerFilterType}
                      onChange={(e) => setLedgerFilterType(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-bold px-3.5 py-2.5 rounded-xl cursor-pointer outline-none focus:border-cyan-500/40"
                    >
                      <option value="all">Todas Operações</option>
                      <option value="income">Apenas Entradas</option>
                      <option value="expense">Apenas Saídas</option>
                    </select>

                    {/* Filter Category */}
                    <select
                      value={ledgerFilterCategory}
                      onChange={(e) => setLedgerFilterCategory(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-bold px-3.5 py-2.5 rounded-xl cursor-pointer outline-none focus:border-cyan-500/40"
                    >
                      <option value="all">Todas Categorias</option>
                      {Object.keys(ACTIVE_CATEGORIES).map(key => (
                        <option key={key} value={key}>
                          {ACTIVE_CATEGORIES[key].icon} {ACTIVE_CATEGORIES[key].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add launches button Group */}
                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => setActiveModal("category")}
                      className="flex-1 sm:flex-initial py-2.5 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      + Categoria Custom
                    </button>
                    <button
                      onClick={() => setActiveModal("income")}
                      className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Entrada
                    </button>
                    <button
                      onClick={() => setActiveModal("expense")}
                      className="flex-1 sm:flex-initial py-2.5 px-4 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 hover:border-pink-500/50 text-pink-400 font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Despesa
                    </button>
                  </div>
                </div>

                {/* Ledger Listing Table Card */}
                <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-4 bg-slate-950/45 border-b border-slate-900 flex justify-between items-center">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Linha de Tempo Ledger ({filteredLedgerTx.length})</h4>
                    <span className="text-[10px] text-slate-600 font-bold font-mono">NexFin Ledger Ledger V1</span>
                  </div>

                  {filteredLedgerTx.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 flex flex-col items-center justify-center gap-3">
                      <AlertTriangle className="w-10 h-10 text-slate-700 animate-bounce" />
                      <p className="font-semibold text-slate-400 text-sm">Nenhum lançamento corresponde à busca</p>
                      <p className="text-xs text-slate-600 max-w-sm">Tente redefinir os filtros superiores ou faça um novo lançamento de teste utilizando os botões de ação.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-950/80">
                      {filteredLedgerTx.map(t => {
                        const cat = ACTIVE_CATEGORIES[t.category] || ACTIVE_CATEGORIES.outros;
                        const isIncome = t.type === "income" || t.amount > 0;
                        return (
                          <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-950/20 transition-all group">
                            <div className="flex items-center gap-3.5">
                              {/* Icon Bubble category */}
                              <div className={`w-10 h-10 rounded-xl ${cat.bgColor} border ${cat.border} flex items-center justify-center text-xl`}>
                                {cat.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">{t.description}</h5>
                                  <span className="text-[10px] bg-slate-950 border border-slate-900 px-2 py-0.5 rounded text-slate-400 uppercase font-bold tracking-wide">
                                    {cat.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10.5px] text-slate-500 font-mono font-semibold">{t.date}</span>
                                  {t.observation && (
                                    <>
                                      <span className="text-[10px] text-slate-700">•</span>
                                      <span className="text-[10.5px] text-slate-500 italic max-w-sm truncate">{t.observation}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Amount Values & actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-950/40 sm:border-t-0 pt-2 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <span className={`text-sm font-extrabold font-mono ${isIncome ? "text-emerald-400" : "text-pink-400"}`}>
                                  {isIncome ? "+" : "-"}
                                  {Math.abs(t.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </span>
                                
                                {t.attachment && (
                                  <div className="flex items-center gap-1 mt-0.5 text-[9.5px] text-cyan-400 justify-end" title={t.attachment.file_name}>
                                    <Paperclip className="w-3 h-3" />
                                    <a href={t.attachment.file_url} target="_blank" rel="noreferrer" className="hover:underline">Ver Anexo</a>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-2 text-slate-600 hover:text-pink-500 hover:bg-pink-500/10 rounded-lg transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: FINANCIAL CALENDAR */}
            {currentTab === "calendar" && (
              <CalendarSection transactions={transactions} goals={goals} />
            )}

            {/* TAB 4: PARCELAMENTOS */}
            {currentTab === "installments" && (
              <div className="space-y-6" id="installments-tab-panel">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-white hover:text-cyan-300 flex items-center gap-2">
                       Adquiridos & Parcelamentos
                    </h3>
                    <p className="text-xs text-slate-500">Acompanhe planos parcelados ativos e parcelas remanescentes</p>
                  </div>
                  <button 
                    onClick={() => setActiveModal("installment")}
                    className="py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 hover:text-slate-900 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Novo Parcelamento +
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {installments.length === 0 ? (
                    <div className="col-span-2 text-center py-12 bg-[#0b0f19] border border-slate-950/30 rounded-2xl p-6 text-slate-500">
                      Nenhum parcelamento registrado. Use o botão superior para criar cronogramas.
                    </div>
                  ) : (
                    installments.map(ins => {
                      const totalPaid = ins.total_installments - ins.remaining_installments;
                      const progress = Math.round((totalPaid / ins.total_installments) * 100);
                      return (
                        <div key={ins.id} className="bg-[#0b0f19] border border-slate-800 p-5 rounded-2xl shadow-lg relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-black text-slate-200 group-hover:text-cyan-400 transition-colors">{ins.product_name}</h4>
                              <p className="text-[10.5px] text-slate-500 mt-1">Data início: {ins.start_date}</p>
                            </div>
                            <span className="text-xs font-mono font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                              {ins.remaining_installments} restantes
                            </span>
                          </div>

                          <div className="mt-5 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-semibold font-sans">Pago • {totalPaid}/{ins.total_installments} parcelas</span>
                              <span className="text-slate-300 font-bold font-mono">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-950/60 text-xs">
                            <span className="text-slate-500 font-semibold uppercase">Mensalidade</span>
                            <span className="text-slate-200 font-black font-mono">
                              R$ {ins.value_per_installment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: PLANO DE METAS */}
            {currentTab === "goals" && (
              <div className="space-y-6 animate-in fade-in duration-100" id="goals-tab-panel">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      Plano Estratégico de Acumulação
                    </h3>
                    <p className="text-xs text-slate-500">Desenvolva riqueza com acompanhamento visual inteligente</p>
                  </div>
                  <button 
                    onClick={() => setActiveModal("goal")}
                    className="py-2.5 px-4 bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Criar Nova Meta +
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {goals.length === 0 ? (
                    <div className="col-span-3 text-center py-12 bg-[#0b0f19] border border-slate-800 rounded-2xl p-6 text-slate-500">
                      Nenhuma meta configurada. Adicione metas para reter economia.
                    </div>
                  ) : (
                    goals.map(g => {
                      const progress = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100);
                      return (
                        <div key={g.id} className="bg-[#0b0f19] border border-slate-800 p-5 rounded-2xl shadow-lg relative flex flex-col justify-between h-48">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-2xl" />
                          
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-black text-slate-200">{g.name}</h4>
                              <span className="text-xs font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
                                {progress}%
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 mt-1 font-semibold font-sans">
                              Prazo limite de resgate: {g.limit_date}
                            </p>
                          </div>

                          <div className="space-y-2 mt-4">
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-fuchsia-500 to-pink-500 h-full rounded-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] font-mono text-slate-400">
                              <span>R$ {g.current_amount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                              <span>Meta: R$ {g.target_amount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-950/60 flex items-center justify-between">
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  // Quick add R$ 500
                                  const updated = goals.map(item => {
                                    if (item.id === g.id) {
                                      const next = Math.min(item.current_amount + 500, item.target_amount);
                                      return { ...item, current_amount: next };
                                    }
                                    return item;
                                  });
                                  setGoals(updated);
                                  triggerAutoBackup(transactions, updated, installments, notifications);
                                }}
                                className="text-[10px] bg-fuchsia-400 text-slate-950 font-bold px-2 py-1 rounded cursor-pointer hover:bg-fuchsia-300 transition-all font-mono"
                              >
                                + R$500
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                const updated = goals.filter(item => item.id !== g.id);
                                setGoals(updated);
                                triggerAutoBackup(transactions, updated, installments, notifications);
                              }}
                              className="text-[10px] text-pink-500 hover:text-white font-semibold cursor-pointer p-1 rounded hover:bg-pink-500/10"
                            >
                              Remover Meta
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: REPORTS EXPORT */}
            {currentTab === "reports" && (
              <div className="space-y-6" id="reports-tab-panel">
                <div className="bg-[#0b0f19] border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-black text-white hover:text-cyan-300 flex items-center gap-2">
                      Compilação e Auditoria de Relatórios
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Gere auditoria fiscal financeira compatível para salvamento PDF ou exportação física.</p>
                  </div>
                  
                  <button
                    onClick={handleGeneratePDF}
                    className="py-3 px-6 bg-cyan-400 text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase shadow-lg shadow-cyan-950/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" /> Exportar PDF Oficial
                  </button>
                </div>

                {/* Printable Financial Summary Sheet layout */}
                <div className="bg-[#0a0e1c] border border-slate-900 rounded-2xl p-6 sm:p-8 space-y-8 select-all" id="financial-report-printable-area">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyan-500/20 pb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-200 tracking-tight flex items-center gap-2">
                        <span>NEXFIN PREMIUM</span>
                        <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold px-2 py-0.5 rounded uppercase">Relatório Gerencial</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Gerado eletronicamente em {new Date().toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="text-left sm:text-right text-xs text-slate-400 font-mono">
                      <p className="font-bold text-slate-300">Responsável: {user.name}</p>
                      <p className="text-slate-500 mt-1">ID Único: {user.id}</p>
                    </div>
                  </div>

                  {/* Quad-Summary metrics block */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saldo Líquido Registrado</p>
                      <p className="text-lg font-bold font-mono text-cyan-400 mt-1.5">
                        R$ {(transactions.filter(t=>t.type==='income'||t.amount>0).reduce((s,t)=>s+Math.abs(t.amount),0) - transactions.filter(t=>t.type==='expense'||t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0)).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total de Ingressos</p>
                      <p className="text-lg font-bold font-mono text-emerald-400 mt-1.5">
                        R$ {transactions.filter(t=>t.type==='income'||t.amount>0).reduce((s,t)=>s+Math.abs(t.amount),0).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total de Desembolsos</p>
                      <p className="text-lg font-bold font-mono text-pink-400 mt-1.5">
                        R$ {transactions.filter(t=>t.type==='expense'||t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Metas Ativas</p>
                      <p className="text-lg font-bold font-mono text-fuchsia-400 mt-1.5">
                        {goals.length} Metas em Progresso
                      </p>
                    </div>
                  </div>

                  {/* Consolidated Listing Table */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Consolidado Ledger Recente</p>
                    <div className="border border-slate-900 rounded-lg overflow-hidden divide-y divide-slate-950">
                      {transactions.slice(0, 10).map(t => (
                        <div key={t.id} className="p-3 bg-slate-950/40 flex items-center justify-between text-xs font-mono">
                          <div className="flex gap-4">
                            <span className="text-slate-600">{t.date}</span>
                            <span className="text-slate-200 font-sans font-bold">{t.description}</span>
                          </div>
                          <span className={t.type === 'income' ? "text-emerald-400 font-bold" : "text-pink-400 font-bold"}>
                            {t.type === 'income' ? "+" : "-"} R$ {Math.abs(t.amount).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* 4. Global Modals forms overlay drawer */}
      <Modals
        type={activeModal}
        onClose={() => setActiveModal(null)}
        onSave={handleSaveModalItem}
      />

      {/* 5. Safe upper-most smart lookup results overlay */}
      <GlobalSearch
        transactions={transactions}
        goals={goals}
        installments={installments}
        onSelectResult={(type, item) => {
          if (type === "transaction") {
            setCurrentTab("ledger");
            setLedgerSearch(item.description);
          } else if (type === "goal") {
            setCurrentTab("goals");
          } else if (type === "installment") {
            setCurrentTab("installments");
          }
        }}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* 6. Profile sliding manager drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex justify-end print:hidden">
          <div className="w-full max-w-md bg-[#0a0f1b] border-l border-cyan-500/20 p-6 flex flex-col justify-between overflow-y-auto animate-slide-in-right">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-cyan-400" /> Perfil de Assinatura NexFin
                </h3>
                <button 
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1.5 hover:bg-slate-950 text-slate-500 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Profile Picture / Avatar Seed URL */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-900 mb-2">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-cyan-500/30 shadow-md shadow-cyan-950/20 mb-3">
                    <img 
                      src={profileAvatar || user.avatar_url || `https://picsum.photos/seed/${user.id}/120/120`} 
                      alt="Avatar Premium" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileAvatar(`https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/150/150`)}
                      className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      Aleatorizar Foto
                    </button>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">CPF Registrado</label>
                  <input
                    type="text"
                    required
                    value={profileCpf}
                    onChange={(e) => setProfileCpf(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none font-mono"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">E-mail Premium</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 py-2 text-sm text-slate-200 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-3 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-xs transition-all uppercase tracking-wider cursor-pointer font-sans"
                >
                  Salvar Alterações Perfil
                </button>
              </form>
            </div>

            {/* Logout and Close section */}
            <div className="pt-6 border-t border-slate-950">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-pink-500/10 hover:bg-pink-500/20 active:scale-[0.98] border border-pink-500/20 text-pink-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Desconectar Assinatura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer brand trademark */}
      <footer className="p-6 bg-[#02050b] border-t border-slate-950 text-center font-mono text-[10.5px] text-slate-600 space-y-2 mt-12 print:hidden" id="dashboard-footer-info">
        <p>© 2026 NEXFIN PREMIUM INC. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-4 text-[9.5px]">
          <span className="text-slate-700">Segurança Militar AES-256</span>
          <span className="text-slate-705">•</span>
          <span className="text-slate-700">Sincronização Cloud Supabase V2</span>
        </div>
      </footer>

    </div>
  );
}
