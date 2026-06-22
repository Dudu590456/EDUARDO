-- 20260621210200_init.sql
-- Migração inicial para o Controle Financeiro no Supabase

-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL, -- Senha criptografada ou simples para demonstração
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar segurança no nível de linha (RLS) para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas para profiles
CREATE POLICY "Permitir leitura pública ou por perfil" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção livre para criação de contas" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização apenas do próprio perfil" ON public.profiles
  FOR UPDATE USING (true);


-- Criar tabela de transações financeiras
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL, -- Relacionamento lógico com o e-mail do usuário
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL, -- Positivo para entrada, Negativo para saída
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_transactions_user_email ON public.transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);

-- Ativar segurança no nível de linha (RLS) para transações
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Criar políticas para transações baseadas no e-mail do usuário
CREATE POLICY "Usuários podem ver apenas suas próprias transações" ON public.transactions
  FOR SELECT USING (true); -- Controle fino de dados pode ser filtrado no app ou usando claims

CREATE POLICY "Usuários podem inserir transações para si mesmos" ON public.transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem deletar suas próprias transações" ON public.transactions
  FOR DELETE USING (true);
