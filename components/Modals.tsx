"use client";

import React, { useState } from "react";
import { X, Plus, Calendar, Coins, DollarSign, Edit3, Image as ImageIcon, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { PRESET_CATEGORIES } from "../lib/mockData";

interface ModalsProps {
  type: "income" | "expense" | "goal" | "installment" | "category" | null;
  onClose: () => void;
  onSave: (type: string, data: any) => void;
}

export default function Modals({ type, onClose, onSave }: ModalsProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState("alimentacao");
  const [observation, setObservation] = useState("");
  
  // Goals State
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("0");
  const [goalDate, setGoalDate] = useState("");

  // Installments State
  const [installProduct, setInstallProduct] = useState("");
  const [installValue, setInstallValue] = useState("");
  const [installCount, setInstallCount] = useState("12");

  // Custom Category State
  const [customCatKey, setCustomCatKey] = useState("");
  const [customCatLabel, setCustomCatLabel] = useState("");
  const [customCatIcon, setCustomCatIcon] = useState("📦");
  const [customCatColor, setCustomCatColor] = useState("text-cyan-400");

  // Attachment State (Local simulation base64 URL)
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentData, setAttachmentData] = useState<string | null>(null);

  if (!type) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      // Simulate reading/retrieving base64 URL or standard preview
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "income" || type === "expense") {
      if (!description || !amount || !category) return;
      
      const numericalAmount = Math.abs(parseFloat(amount));
      const signedAmount = type === "income" ? numericalAmount : -numericalAmount;

      onSave(type, {
        description,
        amount: signedAmount,
        type,
        category,
        date,
        observation,
        attachment: attachmentName ? {
          file_name: attachmentName,
          file_url: attachmentData || "https://picsum.photos/seed/doc/1200/900",
          file_type: "image/jpeg"
        } : undefined
      });
    } else if (type === "goal") {
      if (!goalName || !goalTarget || !goalDate) return;
      onSave("goal", {
        name: goalName,
        target_amount: parseFloat(goalTarget),
        current_amount: parseFloat(goalCurrent || "0"),
        limit_date: goalDate
      });
    } else if (type === "installment") {
      if (!installProduct || !installValue || !installCount) return;
      const count = parseInt(installCount);
      const totalVal = parseFloat(installValue);
      onSave("installment", {
        product_name: installProduct,
        total_value: totalVal,
        total_installments: count,
        remaining_installments: count,
        value_per_installment: parseFloat((totalVal / count).toFixed(2)),
        start_date: date,
        category: "outros"
      });
    } else if (type === "category") {
      if (!customCatLabel) return;
      const key = customCatKey.trim().toLowerCase() || customCatLabel.trim().toLowerCase().replace(/\s+/g, "_");
      onSave("category", {
        key,
        label: customCatLabel,
        icon: customCatIcon,
        color: customCatColor,
        bgColor: `${customCatColor.replace("text-", "bg-")}/10`,
        border: `border-${customCatColor.replace("text-", "")}/30`
      });
    }
    
    // Clean fields
    setDescription("");
    setAmount("");
    setObservation("");
    setAttachmentName("");
    setAttachmentData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#02050c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-2xl scale-in-center animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        id="modal-interactive-window"
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center bg-slate-950/50 p-4 border-b border-cyan-950/40">
          <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <Coins className="w-4.5 h-4.5 text-cyan-400" />
            {type === "income" && "Lançar Entrada Financeira"}
            {type === "expense" && "Registrar Saída/Despesa"}
            {type === "goal" && "Criar Meta de Economia"}
            {type === "installment" && "Cadastrar Novo Parcelamento"}
            {type === "category" && "Criar Categoria Personalizada"}
          </h4>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* INCOME OR EXPENSE FLOWS */}
          {(type === "income" || type === "expense") && (
            <>
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descrição do Lançamento</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Aquisição de software SaaS, Supermercado..."
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>

              {/* Value and Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none placeholder:text-slate-600 font-mono transition-all focus:ring-1 focus:ring-cyan-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data de Competência</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none font-mono focus:ring-1 focus:ring-cyan-500/30"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Categoria do Fluxo</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none transition-all cursor-pointer"
                >
                  {Object.keys(PRESET_CATEGORIES)
                    // If expense show all except income headers
                    .filter((key) => {
                      if (type === "income") {
                        return ["salario", "comissao", "freelance", "vendas", "investimentos", "outros"].includes(key);
                      }
                      return true; // Show all for expenses
                    })
                    .map((key) => (
                      <option key={key} value={key} className="bg-[#0b0f19] text-slate-200 font-sans">
                        {PRESET_CATEGORIES[key].icon} {PRESET_CATEGORIES[key].label}
                      </option>
                    ))}
                </select>
              </div>

              {/* Observation Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Observação Livre</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Detalhamentos opcionais sobre este lançamento bancário..."
                  rows={2}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition-all focus:ring-1 focus:ring-cyan-500/30 text-left"
                />
              </div>

              {/* Attachments Upload section for Expenses */}
              {type === "expense" && (
                <div className="bg-slate-950/40 border border-dashed border-slate-800 p-4 rounded-xl text-center">
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <ImageIcon className="w-6 h-6 text-cyan-400 animate-pulse" />
                      <span className="text-xs text-slate-400 font-semibold">Anexar Comprovante / Nota Fiscal</span>
                      <span className="text-[10px] text-slate-500">Arraste ou clique para selecionar PDF, PNG ou JPG</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden" 
                    />
                  </label>

                  {attachmentName && (
                    <div className="mt-3 p-2 bg-slate-950/80 border border-slate-800/80 rounded-lg text-left text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span className="truncate max-w-[200px]">{attachmentName}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setAttachmentName("")}
                        className="text-pink-400 hover:text-white text-[10px] font-bold"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* GOAL CREATION FLOW */}
          {type === "goal" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome do Alvo / Objetivo</label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Ex: Reserva de Independência, Upgrade Carro..."
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    required
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Aporte Inicial</label>
                  <input
                    type="number"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    placeholder="Ex: 1000"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Data Limite de Realização</label>
                <input
                  type="date"
                  required
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none font-mono"
                />
              </div>
            </>
          )}

          {/* INSTALLMENTS PURCHASE FLOW */}
          {type === "installment" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Nome do Produto / Serviço</label>
                <input
                  type="text"
                  required
                  value={installProduct}
                  onChange={(e) => setInstallProduct(e.target.value)}
                  placeholder="Ex: MacBook Tech, Geladeira Inox..."
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Valor Integral (R$)</label>
                  <input
                    type="number"
                    required
                    value={installValue}
                    onChange={(e) => setInstallValue(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nº de Parcelas</label>
                  <select
                    value={installCount}
                    onChange={(e) => setInstallCount(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none cursor-pointer font-mono"
                  >
                    {[2,3,4,5,6,10,12,18,24,36].map((num) => (
                      <option key={num} value={num} className="bg-[#0b0f19]">
                        {num}x sem juros
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Primeiro Vencimento</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none font-mono"
                />
              </div>
            </>
          )}

          {/* CUSTOM CATEGORY CREATION */}
          {type === "category" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  value={customCatLabel}
                  onChange={(e) => {
                    setCustomCatLabel(e.target.value);
                  }}
                  placeholder="Ex: Manutenção de Carro, Farmácia..."
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Emoji Icon</label>
                  <input
                    type="text"
                    required
                    value={customCatIcon}
                    onChange={(e) => setCustomCatIcon(e.target.value)}
                    placeholder="Ex: 🔧, 💊, 🐾"
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none text-center font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Paleta de Destaque</label>
                  <select
                    value={customCatColor}
                    onChange={(e) => setCustomCatColor(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="text-cyan-400" className="bg-[#0b0f19] text-cyan-400 font-bold">Azul Cyber</option>
                    <option value="text-pink-400" className="bg-[#0b0f19] text-pink-400 font-bold">Fuchsia Neon</option>
                    <option value="text-emerald-400" className="bg-[#0b0f19] text-emerald-400 font-bold">Verde Gold</option>
                    <option value="text-amber-400" className="bg-[#0b0f19] text-amber-400 font-bold">Laranja Coral</option>
                    <option value="text-violet-400" className="bg-[#0b0f19] text-violet-400 font-bold">Violeta Matte</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Form Actions footer */}
          <div className="pt-4 border-t border-cyan-950/40 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 hover:text-slate-900 font-black rounded-xl text-xs transition-all tracking-wider uppercase shadow-md shadow-cyan-950/20 cursor-pointer"
            >
              Confirmar Lançamento ➜
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
