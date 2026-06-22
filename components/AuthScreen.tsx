"use client";

import React, { useState } from "react";
import { 
  Lock, 
  Mail, 
  User, 
  UserCheck, 
  CreditCard, 
  Sparkles, 
  Info,
  ShieldCheck, 
  Globe, 
  ArrowRight,
  RefreshCw,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onLoginSuccess: (user: { name: string; email: string; cpf?: string }) => void;
  supabaseActive: boolean;
  onBypass: () => void;
}

export default function AuthScreen({ onLoginSuccess, supabaseActive, onBypass }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Simple CPF mask helper
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 9) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length > 6) {
      value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
    } else if (value.length > 3) {
      value = `${value.slice(0, 3)}.${value.slice(3)}`;
    }
    setCpf(value);
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          throw new Error("Por favor, preencha todos os campos obrigatórios.");
        }

        if (supabaseActive) {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Combinação incorreta de credenciais.");
          }
          onLoginSuccess(data.user);
        } else {
          // Fallback Local
          if (email.trim() === "demo@demo.com" && password === "123456") {
            onLoginSuccess({ name: "Eduardo Rocha", email: "demo@demo.com", cpf: "123.456.789-00" });
          } else {
            // Find registered users inside localStorage
            const localUsersStr = localStorage.getItem("registered_users");
            const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
            const found = localUsers.find((u: any) => u.email.toLowerCase() === email.trim().toLowerCase());
            
            if (found && found.password === password) {
              onLoginSuccess({ name: found.name, email: found.email, cpf: found.cpf });
            } else {
              throw new Error("Credenciais inválidas. Para testar offline use demo@demo.com e senha 123456 ou cadastre uma nova conta.");
            }
          }
        }
      } else if (mode === "register") {
        if (!fullName || !cpf || !email || !password || !confirmPassword) {
          throw new Error("Por favor, preencha todos os campos do formulário.");
        }
        if (password !== confirmPassword) {
          throw new Error("As senhas informadas não coincidem.");
        }
        if (password.length < 6) {
          throw new Error("A senha precisa ter pelo menos 6 caracteres.");
        }

        if (supabaseActive) {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: fullName, email, password, cpf })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Não foi possível efetuar o cadastro.");
          }
          setSuccess("Sua conta NexFin Premium foi criada com sucesso no Supabase! Faça o login agora.");
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        } else {
          // Offline local memory register
          const localUsersStr = localStorage.getItem("registered_users");
          const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
          if (localUsers.some((u: any) => u.email.toLowerCase() === email.trim().toLowerCase())) {
            throw new Error("Este endereço de e-mail já possui uma conta NexFin.");
          }

          const newUser = { name: fullName, email, password, cpf, created_at: new Date().toISOString() };
          localUsers.push(newUser);
          localStorage.setItem("registered_users", JSON.stringify(localUsers));

          setSuccess("Cadastro efetuado localmente! Conectado na sandbox criptografada.");
          setMode("login");
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        // Forgot password
        if (!email) {
          throw new Error("Informe o e-mail cadastrado.");
        }

        if (supabaseActive) {
          // Simulate or trigger auth reset
          setSuccess("Solicitação enviada! Se o e-mail existir, você receberá o link de redefinição.");
        } else {
          setSuccess(`Simulação offline: Um link de redefinição de senha fictício foi disparado para ${email}.`);
        }
        setMode("login");
      }
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro ao processar sua requisição.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#030712] overflow-hidden px-4" id="supabase-auth-panel">
      {/* Dynamic Futuristic Neon Gradients Background */}
      <div className="absolute top-1/4 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Background Matrix/Fintech grid lines */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: "radial-gradient(#22d3ee 1px, transparent 1px), linear-gradient(to right, rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(34, 211, 238, 0.1) 1px, transparent 1px)",
          backgroundSize: "24px 24px, 48px 48px, 48px 48px"
        }}
      />

      <div className="relative w-full max-w-lg z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 rounded-full mb-3 shadow-md shadow-cyan-950/20">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs text-cyan-300 font-semibold tracking-wider uppercase">Plataforma Financeira SaaS</span>
            {supabaseActive ? (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : null}
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter" style={{ fontFamily: "var(--font-sans)" }}>
            NEX<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400">FIN</span>
            <span className="text-xs font-bold bg-pink-500/20 text-pink-400 px-2.5 py-0.5 rounded-md ml-2 border border-pink-500/30 font-mono tracking-normal">PREMIUM</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Ecossistema de gestão inteligente com tecnologia preditiva e segurança militar.
          </p>
        </div>

        {/* Authentication Card with Glassmorphism and Neon Border */}
        <div className="bg-[#0b0f19]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black">
          
          <div className="flex border-b border-cyan-950/40 mb-6">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 pb-3 text-sm font-bold transition-all ${
                mode === "login" || mode === "forgot"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 pb-3 text-sm font-bold transition-all ${
                mode === "register"
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Criar Conta Premium
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error && (
                <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-start gap-2.5 font-sans">
                  <span className="mt-0.5 bg-red-500/20 text-red-400 p-1 rounded-md text-[10px] font-bold">!]</span>
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-start gap-2.5 font-sans">
                  <span className="mt-0.5 bg-emerald-500/20 text-emerald-400 p-1 rounded-md text-[10px] font-bold">✓</span>
                  <p className="leading-relaxed">{success}</p>
                </div>
              )}

              <form onSubmit={handleAction} className="space-y-4">
                
                {mode === "register" && (
                  <>
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex: Eduardo Rocha"
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/30"
                        />
                      </div>
                    </div>

                    {/* CPF */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">CPF do Titular</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={cpf}
                          onChange={handleCpfChange}
                          placeholder="000.000.000-00"
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/30"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email (Always active except password recovery check screen, but we use it everywhere) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Endereço de E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/30"
                    />
                  </div>
                </div>

                {mode !== "forgot" && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
                        >
                          Esqueci Minha Senha?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>
                )}

                {mode === "register" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-cyan-500/50 rounded-xl text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 active:scale-[0.98] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      {mode === "login" ? "Acessar Painel" : mode === "register" ? "Cadastrar Assinatura" : "Enviar Solicitação"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Quick Demo Login Information / Safe Sandbox Toggle */}
          <div className="mt-6 pt-5 border-t border-slate-900 flex flex-col gap-3">
            <div className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-slate-400">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-300">Sandbox NexFin Liberada</p>
                <p className="mt-0.5 text-slate-400">
                  Para uma demonstração imediata sem necessitar configurar banco externo, use o usuário de demonstração ou clique no botão rápido abaixo.
                </p>
                <div className="mt-2 text-slate-500 font-mono text-[10.5px]">
                  E-mail: <span className="text-cyan-400Selection bg-cyan-950/10 text-cyan-400">demo@demo.com</span> <br />
                  Senha: <span className="text-cyan-400">123456</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("demo@demo.com");
                  setPassword("123456");
                  setMode("login");
                }}
                className="flex-1 py-2 px-3 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-bold transition-all text-center cursor-pointer"
              >
                Preencher Demo
              </button>
              <button
                type="button"
                onClick={onBypass}
                className="flex-1 py-2 px-3 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-300 rounded-lg text-xs font-bold transition-all text-center cursor-pointer"
              >
                Ignorar Login ➜
              </button>
            </div>
          </div>

        </div>

        {/* Security Seals */}
        <div className="mt-6 flex items-center justify-center gap-6 text-slate-600 text-[11px] font-semibold tracking-wider uppercase">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4.5 h-4.5 text-slate-500" />
            <span>Encriptação AES-256</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-4.5 h-4.5 text-slate-500" />
            <span>Supabase Cloud Integration</span>
          </div>
        </div>

      </div>
    </div>
  );
}
