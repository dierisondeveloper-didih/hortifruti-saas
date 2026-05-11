-- # SCRIPT DE MIGRAÇÃO: PIX E PAGAMENTOS
-- Execute este script no SQL Editor do Supabase.

-- 1. Adicionar campo de Chave Pix nas configurações da loja
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS chave_pix TEXT;

-- 2. Adicionar campo de Forma de Pagamento nos pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS forma_pagamento TEXT DEFAULT 'dinheiro';
