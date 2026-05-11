-- # SCRIPT DE MIGRAÇÃO: ITENS_PEDIDO
-- Execute este script no SQL Editor do Supabase.

CREATE TABLE IF NOT EXISTS itens_pedido (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
    quantidade NUMERIC NOT NULL,
    preco_unitario NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dono da loja gerencia os itens" ON itens_pedido
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM pedidos p 
            WHERE p.id = itens_pedido.pedido_id 
            AND p.dono_id = auth.uid()
        )
    );

-- Nota: A inserção via API pública precisará de uma policy para inserção anônima se feita do client side.
-- Ou continuará sendo feita usando o service_role ou ignorando RLS momentaneamente se for o caso.
CREATE POLICY "Permitir inserção anônima para novos pedidos" ON itens_pedido
    FOR INSERT WITH CHECK (true);
