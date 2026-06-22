-- 20260622010000_premium_extensions.sql
-- Nova migração para os recursos premium (Modo Família, Corporativo MEI e Central de Assinaturas) no NexFin

-- 1. Tabela de Membros de Família (family_members)
CREATE TABLE IF NOT EXISTS public.family_members (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- Relacionamento lógico com o ID do usuário (baseado em e-mail)
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança no nível de linha (RLS) para family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre / lógico gerenciadas pelo App
CREATE POLICY "Permitir leitura de family_members" ON public.family_members
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de family_members" ON public.family_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir remoção de family_members" ON public.family_members
  FOR DELETE USING (true);


-- 2. Tabela de Transações de Negócios (business_transactions)
CREATE TABLE IF NOT EXISTS public.business_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- Relacionamento lógico com o ID do usuário (baseado em e-mail)
  client TEXT NOT NULL DEFAULT 'Geral',
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  description TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança no nível de linha (RLS) para business_transactions
ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir gerenciamento de transações comerciais" ON public.business_transactions
  FOR ALL USING (true);


-- 3. Tabela de Assinaturas Hub (subscriptions)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- Relacionamento lógico com o ID do usuário (baseado em e-mail)
  name TEXT NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  next_bill DATE NOT NULL,
  logo TEXT NOT NULL DEFAULT '💳',
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança no nível de linha (RLS) para subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir gerenciamento de assinaturas" ON public.subscriptions
  FOR ALL USING (true);
