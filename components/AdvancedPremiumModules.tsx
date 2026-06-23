"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Briefcase,
  Layers,
  UserPlus,
  Trash2,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FamilyMember, BusinessTransaction, Subscription } from "../lib/types";
import { isSupabaseConfigured, getSupabaseClient } from "../lib/supabase";

// Formatting helpers
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

interface AdvancedPremiumModulesProps {
  userEmail: string;
  offlineMode: boolean;
}

export default function AdvancedPremiumModules({ userEmail, offlineMode }: AdvancedPremiumModulesProps) {
  const [activeTab, setActiveTab] = useState<"family" | "business" | "subscriptions">("family");

  // State lists
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [businessTransactions, setBusinessTransactions] = useState<BusinessTransaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Family Inputs
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Parceiro(a)");
  const [invitePerm, setInvitePerm] = useState<"read" | "write">("read");
  const [familyStatusMsg, setFamilyStatusMsg] = useState("");

  // Business Inputs
  const [bizDesc, setBizDesc] = useState("");
  const [bizAmount, setBizAmount] = useState("");
  const [bizType, setBizType] = useState<"receita" | "despesa">("receita");
  const [bizEntity, setBizEntity] = useState("");

  // Subscriptions Inputs
  const [newSubName, setNewSubName] = useState("");
  const [newSubPrice, setNewSubPrice] = useState("");
  const [newSubBill, setNewSubBill] = useState("2026-07-01");

  // Load Premium Data from Supabase/LocalStorage Cache
  useEffect(() => {
    async function loadPremiumData() {
      // 1. Recover cache from localStorage immediately
      try {
        const cachedFam = localStorage.getItem("nexfin_family_members");
        const cachedBiz = localStorage.getItem("nexfin_business_transactions");
        const cachedSubs = localStorage.getItem("nexfin_subscriptions");

        if (cachedFam) setFamilyMembers(JSON.parse(cachedFam));
        if (cachedBiz) setBusinessTransactions(JSON.parse(cachedBiz));
        if (cachedSubs) setSubscriptions(JSON.parse(cachedSubs));
      } catch (e) {
        console.warn("Sem cache premium inicial", e);
      }

      const active = isSupabaseConfigured();
      if (!active || !userEmail || offlineMode) return;

      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const userId = "user-" + userEmail.replace(/[@.]/g, "-");

        // 1. Fetch family members
        const { data: famData, error: famErr } = await supabase
          .from("family_members")
          .select("*")
          .eq("user_id", userId);

        if (!famErr && famData) {
          const mappedFam = famData.map((item: any) => ({
            id: item.id,
            name: item.name,
            role: item.role,
            permission: item.permission as "read" | "write" | "admin",
          }));
          setFamilyMembers(mappedFam);
          localStorage.setItem("nexfin_family_members", JSON.stringify(mappedFam));
        }

        // 2. Fetch business transactions
        const { data: bizData, error: bizErr } = await supabase
          .from("business_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false });

        if (!bizErr && bizData) {
          const mappedBiz = bizData.map((item: any) => ({
            id: item.id,
            client: item.client,
            type: item.type as "receita" | "despesa",
            description: item.description,
            amount: parseFloat(item.amount),
            date: item.date,
          }));
          setBusinessTransactions(mappedBiz);
          localStorage.setItem("nexfin_business_transactions", JSON.stringify(mappedBiz));
        }

        // 3. Fetch subscriptions
        const { data: subData, error: subErr } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId);

        if (!subErr && subData) {
          const mappedSubs = subData.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            nextBill: item.next_bill,
            logo: item.logo || "💳",
            active: item.active,
          }));
          setSubscriptions(mappedSubs);
          localStorage.setItem("nexfin_subscriptions", JSON.stringify(mappedSubs));
        }
      } catch (err) {
        console.error("Erro ao carregar dados do Supabase:", err);
      }
    }

    loadPremiumData();
  }, [userEmail, offlineMode]);

  // Invite Family Member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName) return;

    const memberId = "fam-" + Date.now();
    const newMember: FamilyMember = {
      id: memberId,
      name: inviteName,
      role: inviteRole,
      permission: invitePerm as "read" | "write",
    };

    const updatedMembers = [...familyMembers, newMember];
    setFamilyMembers(updatedMembers);
    localStorage.setItem("nexfin_family_members", JSON.stringify(updatedMembers));
    setInviteName("");
    setFamilyStatusMsg(`Membro ${inviteName} salvo localmente!`);
    setTimeout(() => setFamilyStatusMsg(""), 4000);

    const active = isSupabaseConfigured();
    if (active && userEmail && !offlineMode) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const userId = "user-" + userEmail.replace(/[@.]/g, "-");
          await supabase.from("family_members").insert({
            id: memberId,
            user_id: userId,
            name: inviteName,
            role: inviteRole,
            permission: invitePerm,
          });
          setFamilyStatusMsg(`Convite de acesso para ${inviteName} sincronizado com Supabase!`);
        }
      } catch (err) {
        console.warn("Erro ao sincronizar com Supabase, salvo apenas localmente.", err);
      }
    }
  };

  // Remove Family Member
  const handleRemoveFamilyMember = async (id: string) => {
    const updatedMembers = familyMembers.filter((m) => m.id !== id);
    setFamilyMembers(updatedMembers);
    localStorage.setItem("nexfin_family_members", JSON.stringify(updatedMembers));

    const active = isSupabaseConfigured();
    if (active && userEmail && !offlineMode) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from("family_members").delete().eq("id", id);
        }
      } catch (err) {
        console.warn("Erro ao deletar no Supabase, alteração mantida localmente.", err);
      }
    }
  };

  // Add Business Transaction
  const handleAddBusinessTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizDesc || !bizAmount) return;

    const txId = "bt-" + Date.now();
    const parsedAmount = parseFloat(bizAmount);
    const today = new Date().toISOString().split("T")[0];

    const item: BusinessTransaction = {
      id: txId,
      client: bizEntity || "Geral",
      type: bizType,
      description: bizDesc,
      amount: parsedAmount,
      date: today,
    };

    const updatedBiz = [item, ...businessTransactions];
    setBusinessTransactions(updatedBiz);
    localStorage.setItem("nexfin_business_transactions", JSON.stringify(updatedBiz));
    setBizDesc("");
    setBizAmount("");
    setBizEntity("");

    const active = isSupabaseConfigured();
    if (active && userEmail && !offlineMode) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const userId = "user-" + userEmail.replace(/[@.]/g, "-");
          await supabase.from("business_transactions").insert({
            id: txId,
            user_id: userId,
            client: bizEntity || "Geral",
            type: bizType,
            description: bizDesc,
            amount: parsedAmount,
            date: today,
          });
        }
      } catch (err) {
        console.warn("Erro ao sincronizar com Supabase, transação PJ salva localmente.", err);
      }
    }
  };

  // Add Subscription
  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubPrice) return;

    const subId = "sub-" + Date.now();
    const parsedPrice = parseFloat(newSubPrice);

    const newSub: Subscription = {
      id: subId,
      name: newSubName,
      price: parsedPrice,
      nextBill: newSubBill,
      logo: "💳",
      active: true,
    };

    const updatedSubs = [...subscriptions, newSub];
    setSubscriptions(updatedSubs);
    localStorage.setItem("nexfin_subscriptions", JSON.stringify(updatedSubs));
    setNewSubName("");
    setNewSubPrice("");

    const active = isSupabaseConfigured();
    if (active && userEmail && !offlineMode) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const userId = "user-" + userEmail.replace(/[@.]/g, "-");
          await supabase.from("subscriptions").insert({
            id: subId,
            user_id: userId,
            name: newSubName,
            price: parsedPrice,
            next_bill: newSubBill,
            logo: "💳",
            active: true,
          });
        }
      } catch (err) {
        console.warn("Erro ao sincronizar assinatura com Supabase.", err);
      }
    }
  };

  // Toggle Subscription
  const handleToggleSub = async (id: string) => {
    let targetActive = true;
    const updatedSubs = subscriptions.map((s) => {
      if (s.id === id) {
        targetActive = !s.active;
        return { ...s, active: targetActive };
      }
      return s;
    });
    setSubscriptions(updatedSubs);
    localStorage.setItem("nexfin_subscriptions", JSON.stringify(updatedSubs));

    const active = isSupabaseConfigured();
    if (active && userEmail && !offlineMode) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from("subscriptions").update({ active: targetActive }).eq("id", id);
        }
      } catch (err) {
        console.warn("Erro ao atualizar assinatura com Supabase.", err);
      }
    }
  };

  // Delete Subscription
  const handleDeleteSub = async (id: string) => {
    const updatedSubs = subscriptions.filter((s) => s.id !== id);
    setSubscriptions(updatedSubs);
    localStorage.setItem("nexfin_subscriptions", JSON.stringify(updatedSubs));

    const active = isSupabaseConfigured();
    if (active && userEmail && !offlineMode) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from("subscriptions").delete().eq("id", id);
        }
      } catch (err) {
        console.warn("Erro ao deletar assinatura no Supabase.", err);
      }
    }
  };

  const totalMonthlySubs = subscriptions
    .filter((s) => s.active)
    .reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6" id="premium-modules-panel">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-1 rounded border border-amber-500/20 font-mono">
            Premium
          </span>
          <h2 className="text-xl font-bold font-sans mt-2">Módulos Avançados</h2>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab("family")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "family" ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Users size={14} /> Família
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "business" ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Briefcase size={14} /> Freelance/CNPJ
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "subscriptions" ? "bg-slate-800 text-amber-400" : "text-slate-400 hover:text-slate-100"
            }`}
          >
            <Layers size={14} /> Assinaturas
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "family" && (
          <motion.div
            key="family"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Col */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Convidar Membro</h3>
                <form onSubmit={handleInviteMember} className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nome do Membro</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Ex: Maria Rocha"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Função</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        placeholder="Ex: Cônjuge, Filho"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Permissão</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                        value={invitePerm}
                        onChange={(e) => setInvitePerm(e.target.value as "read" | "write")}
                      >
                        <option value="read">Apenas Ler</option>
                        <option value="write">Escrever</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md text-xs transition"
                  >
                    <UserPlus size={14} /> Carregar Novo Convite
                  </button>
                  {familyStatusMsg && (
                    <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} /> {familyStatusMsg}
                    </p>
                  )}
                </form>
              </div>

              {/* Members List Col */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Membros da Família em Sincronia</h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {familyMembers.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhum membro compartilhado.</p>
                  ) : (
                    familyMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{member.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {member.role} • Permissão: {member.permission === "write" ? "Gravação" : "Leitura"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveFamilyMember(member.id)}
                          className="p-1 px-2 text-slate-500 hover:text-rose-500 border border-transparent hover:border-rose-500/20 hover:bg-rose-500/5 rounded-md transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "business" && (
          <motion.div
            key="business"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Col */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Nova Transação PJ/Freelance</h3>
                <form onSubmit={handleAddBusinessTx} className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Tipo</label>
                      <select
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                        value={bizType}
                        onChange={(e) => setBizType(e.target.value as "receita" | "despesa")}
                      >
                        <option value="receita">Receita (Cliente)</option>
                        <option value="despesa">Despesa (Insumo)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Entidade/Cliente</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        value={bizEntity}
                        onChange={(e) => setBizEntity(e.target.value)}
                        placeholder="Ex: Google, AWS"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Descrição do Serviço</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      value={bizDesc}
                      onChange={(e) => setBizDesc(e.target.value)}
                      placeholder="Ex: Consultoria Next.js"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      value={bizAmount}
                      onChange={(e) => setBizAmount(e.target.value)}
                      placeholder="Ex: 2500.00"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md text-xs transition"
                  >
                    <PlusCircle size={14} /> Registrar Fluxo PJ
                  </button>
                </form>
              </div>

              {/* Business Tx List Col */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Extrato PJ / Fluxo Ativo</h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {businessTransactions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhum fluxo PJ registrado.</p>
                  ) : (
                    businessTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{tx.description}</p>
                          <p className="text-[10px] text-slate-500">
                            {tx.client} • {tx.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xs font-mono font-bold flex items-center gap-0.5 justify-end ${
                              tx.type === "receita" ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            {tx.type === "receita" ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {formatCurrency(tx.amount)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "subscriptions" && (
          <motion.div
            key="subscriptions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Col */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Cadastrar Assinatura/Recorrência</h3>
                <form onSubmit={handleAddSubscription} className="space-y-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nome do Serviço</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="Ex: Netflix, Spotify, AWS"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Fatura Mensal (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                        value={newSubPrice}
                        onChange={(e) => setNewSubPrice(e.target.value)}
                        placeholder="Ex: 55.90"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Próx. Faturamento</label>
                      <input
                        type="date"
                        className="w-full bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-300"
                        value={newSubBill}
                        onChange={(e) => setNewSubBill(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-md text-xs transition"
                  >
                    <PlusCircle size={14} /> Registrar Assinatura
                  </button>
                </form>
                {/* Visualizer Stat */}
                <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                      <DollarSign size={16} />
                    </div>
                    <span className="text-xs text-slate-400">Total Mensal Recorrente</span>
                  </div>
                  <span className="text-base font-mono font-bold text-slate-100">
                    {formatCurrency(totalMonthlySubs)}
                  </span>
                </div>
              </div>

              {/* Subscriptions List Col */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Assinaturas Registradas</h3>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {subscriptions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhuma assinatura registrada.</p>
                  ) : (
                    subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className={`flex items-center justify-between p-3 bg-slate-950 rounded-lg border transition ${
                          sub.active ? "border-slate-800" : "border-slate-900 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{sub.logo || "💳"}</span>
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{sub.name}</p>
                            <p className="text-[10px] text-slate-500">
                              Vence em {sub.nextBill} • {formatCurrency(sub.price)}/mês
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleSub(sub.id)}
                            className="p-1 px-1.5 text-slate-500 hover:text-amber-500 rounded-md transition"
                          >
                            {sub.active ? <ToggleRight size={22} className="text-amber-500" /> : <ToggleLeft size={22} />}
                          </button>
                          <button
                            onClick={() => handleDeleteSub(sub.id)}
                            className="p-1 px-1.5 text-slate-500 hover:text-rose-500 rounded-md transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
