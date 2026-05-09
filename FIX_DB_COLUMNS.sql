-- # MIGRATION: ADICIONAR COLUNAS DE HORÁRIO
-- Execute este script no SQL Editor do Supabase para corrigir o erro 400 ao salvar configurações.

ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS horario_abertura text DEFAULT '08:00';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS horario_fechamento text DEFAULT '20:00';

-- # CORREÇÃO DE SEGURANÇA (Caso não tenha rodado o anterior completo)
-- Garante que o RLS está ativo e com as políticas corretas
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Remove política antiga se existir para evitar erro de duplicidade
DROP POLICY IF EXISTS "Dono gerencia configurações" ON configuracoes;

CREATE POLICY "Dono gerencia configurações" ON configuracoes 
FOR ALL USING (auth.uid() = dono_id);
