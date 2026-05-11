-- # TABELA DE LEADS
-- Execute este script no SQL Editor do Supabase para criar a estrutura de captação de clientes.

CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_responsavel TEXT NOT NULL,
    nome_loja TEXT NOT NULL,
    telefone_whatsapp TEXT NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'contatado', 'aprovado', 'recusado')),
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Permitir inserção anônima (para a Landing Page funcionar)
DROP POLICY IF EXISTS "Permitir inserção anônima em leads" ON leads;
CREATE POLICY "Permitir inserção anônima em leads" ON leads FOR INSERT WITH CHECK (true);

-- O select/update/delete será feito via supabaseAdmin (que ignora RLS), 
-- então não precisamos criar políticas públicas de leitura.
