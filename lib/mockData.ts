import { Transaction, Goal, Installment, Notification } from "./types";

export const PRESET_CATEGORIES: { 
  [key: string]: { label: string; color: string; bgColor: string; icon: string; border: string } 
} = {
  // Receitas
  salario: { label: "Salário", color: "text-emerald-400 font-mono", bgColor: "bg-emerald-500/10", icon: "💰", border: "border-emerald-500/30" },
  comissao: { label: "Comissão", color: "text-green-400 font-mono", bgColor: "bg-green-500/10", icon: "📈", border: "border-green-500/30" },
  freelance: { label: "Freelance", color: "text-teal-400 font-mono", bgColor: "bg-teal-500/10", icon: "💻", border: "border-teal-500/30" },
  vendas: { label: "Vendas", color: "text-sky-400 font-mono", bgColor: "bg-sky-500/10", icon: "🛒", border: "border-sky-500/30" },
  investimentos: { label: "Investimentos", color: "text-cyan-400 font-mono", bgColor: "bg-cyan-500/10", icon: "🏦", border: "border-cyan-500/30" },

  // Despesas
  alimentacao: { label: "Alimentação", color: "text-amber-400", bgColor: "bg-amber-500/10", icon: "🍔", border: "border-amber-500/30" },
  mercado: { label: "Mercado", color: "text-purple-400", bgColor: "bg-purple-500/10", icon: "🛒", border: "border-purple-500/30" },
  farmacia: { label: "Farmácia", color: "text-rose-400", bgColor: "bg-rose-500/10", icon: "💊", border: "border-rose-500/30" },
  combustivel: { label: "Combustível", color: "text-orange-400", bgColor: "bg-orange-500/10", icon: "⛽", border: "border-orange-500/30" },
  transporte: { label: "Transporte", color: "text-blue-400", bgColor: "bg-blue-500/10", icon: "🚗", border: "border-blue-500/30" },
  agua: { label: "Água", color: "text-sky-300", bgColor: "bg-sky-400/10", icon: "💧", border: "border-sky-400/30" },
  luz: { label: "Luz", color: "text-yellow-400", bgColor: "bg-yellow-500/10", icon: "⚡", border: "border-yellow-500/30" },
  internet: { label: "Internet", color: "text-indigo-400", bgColor: "bg-indigo-500/10", icon: "🌐", border: "border-indigo-500/30" },
  telefone: { label: "Telefone", color: "text-zinc-400", bgColor: "bg-zinc-500/10", icon: "📞", border: "border-zinc-500/30" },
  streaming: { label: "Streaming", color: "text-red-400", bgColor: "bg-red-500/10", icon: "🎬", border: "border-red-500/30" },
  saude: { label: "Saúde", color: "text-red-500", bgColor: "bg-red-500/10", icon: "❤️", border: "border-red-500/30" },
  academia: { label: "Academia", color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/10", icon: "💪", border: "border-fuchsia-500/30" },
  educacao: { label: "Educação", color: "text-violet-400", bgColor: "bg-violet-500/10", icon: "📚", border: "border-violet-500/30" },
  aluguel: { label: "Aluguel", color: "text-indigo-400", bgColor: "bg-indigo-500/10", icon: "🏠", border: "border-indigo-500/30" },
  condominio: { label: "Condomínio", color: "text-slate-400", bgColor: "bg-slate-500/10", icon: "🏢", border: "border-slate-500/30" },
  lazer: { label: "Lazer", color: "text-pink-400", bgColor: "bg-pink-500/10", icon: "🎉", border: "border-pink-500/30" },
  viagem: { label: "Viagem", color: "text-cyan-400", bgColor: "bg-cyan-500/10", icon: "✈️", border: "border-cyan-500/30" },
  pets: { label: "Pets", color: "text-yellow-600", bgColor: "bg-yellow-600/10", icon: "🐾", border: "border-yellow-600/30" },
  roupas: { label: "Roupas", color: "text-teal-400", bgColor: "bg-teal-500/10", icon: "👕", border: "border-teal-500/30" },
  beleza: { label: "Beleza", color: "text-rose-300", bgColor: "bg-rose-300/10", icon: "💅", border: "border-rose-300/30" },
  impostos: { label: "Impostos", color: "text-red-400", bgColor: "bg-red-500/10", icon: "📄", border: "border-red-500/30" },
  outros: { label: "Outros", color: "text-slate-400", bgColor: "bg-slate-500/10", icon: "📦", border: "border-slate-500/30" }
};

export const INITIAL_TRANSACTIONS = (userId: string = "demo-user-id"): Transaction[] => {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  
  return [
    {
      id: "tx-1",
      user_id: userId,
      description: "Aporte Mensal - Salário NexFin",
      amount: 8500.00,
      type: "income",
      category: "salario",
      date: `${currentYear}-${currentMonth}-05`,
      observation: "Referente ao faturamento de consultoria sênior"
    },
    {
      id: "tx-2",
      user_id: userId,
      description: "Supermercado Gourmet",
      amount: -850.40,
      type: "expense",
      category: "mercado",
      date: `${currentYear}-${currentMonth}-10`,
      observation: "Compras mensais com carnes e importados sem glúten"
    },
    {
      id: "tx-3",
      user_id: userId,
      description: "Resgate de Dividendos",
      amount: 450.00,
      type: "income",
      category: "investimentos",
      date: `${currentYear}-${currentMonth}-15`,
      observation: "Ações PETR4 e fundos imobiliários MXRF11"
    },
    {
      id: "tx-4",
      user_id: userId,
      description: "Mensalidade da Academia Premium",
      amount: -299.90,
      type: "expense",
      category: "academia",
      date: `${currentYear}-${currentMonth}-08`,
      observation: "Plano Black VIP com direito a convidados"
    },
    {
      id: "tx-5",
      user_id: userId,
      description: "Freelance Landing Page Web3",
      amount: 2200.00,
      type: "income",
      category: "freelance",
      date: `${currentYear}-${currentMonth}-18`,
      observation: "Desenvolvimento Next.js e Tailwind para cliente do Canadá"
    },
    {
      id: "tx-6",
      user_id: userId,
      description: "Combustível SUV Turbo",
      amount: -220.00,
      type: "expense",
      category: "combustivel",
      date: `${currentYear}-${currentMonth}-14`,
      observation: "Combustível aditivado posto BR Shell"
    },
    {
      id: "tx-7",
      user_id: userId,
      description: "Investimento Tesouro Direto Selic",
      amount: -1500.00,
      type: "expense",
      category: "investimentos",
      date: `${currentYear}-${currentMonth}-06`,
      observation: "Reserva de emergência líquida automática"
    }
  ];
};

export const INITIAL_GOALS = (userId: string = "demo-user-id"): Goal[] => {
  const currentYear = new Date().getFullYear();
  return [
    {
      id: "gl-1",
      user_id: userId,
      name: "Viagem Maldivas Gold",
      target_amount: 25000.00,
      current_amount: 12500.00,
      limit_date: `${currentYear + 1}-02-28`
    },
    {
      id: "gl-2",
      user_id: userId,
      name: "Reserva de Independência",
      target_amount: 100000.00,
      current_amount: 65000.00,
      limit_date: `${currentYear + 2}-12-31`
    },
    {
      id: "gl-3",
      user_id: userId,
      name: "Upgrade Setup Dev Gamer",
      target_amount: 15000.00,
      current_amount: 9200.00,
      limit_date: `${new Date().getFullYear()}-12-25`
    }
  ];
};

export const INITIAL_INSTALLMENTS = (userId: string = "demo-user-id"): Installment[] => {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  
  return [
    {
      id: "ins-1",
      user_id: userId,
      product_name: "MacBook Pro M4 32GB",
      total_value: 12000.00,
      total_installments: 12,
      remaining_installments: 8,
      value_per_installment: 1000.00,
      start_date: `${currentYear}-${currentMonth}-01`,
      category: "tecnologia"
    },
    {
      id: "ins-2",
      user_id: userId,
      product_name: "iPhone 17 Pro Max Titanium",
      total_value: 9600.00,
      total_installments: 10,
      remaining_installments: 6,
      value_per_installment: 960.00,
      start_date: `${currentYear}-${currentMonth}-15`,
      category: "tecnologia"
    }
  ];
};

export const INITIAL_NOTIFICATIONS = (userId: string = "demo-user-id"): Notification[] => {
  return [
    {
      id: "nt-1",
      user_id: userId,
      title: "Parabéns! Meta de Economia decolando 🚀",
      content: "Você já realizou 65% do progresso de sua meta 'Reserva de Independência'. Continue firme!",
      type: "goal",
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "nt-2",
      user_id: userId,
      title: "Fatura de Energia em breve ⚡",
      content: "Sua conta de Luz estimada no valor de R$ 134,20 vence nos próximos 5 dias.",
      type: "alert",
      is_read: false,
      created_at: new Date(Date.now() - 17200000).toISOString()
    },
    {
      id: "nt-3",
      user_id: userId,
      title: "Despesa elevada detectada",
      content: "A despesa 'Supermercado Gourmet' ultrapassou o alerta de gasto médio do mês.",
      type: "spending",
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];
};
