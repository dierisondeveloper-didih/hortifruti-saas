-- # SCRIPT DE ROBUSTEZ FINAL - HORTIFRUTI SAAS
-- Execute este script no SQL Editor do Supabase.

--------------------------------------------------------------------------------
-- 1. SEGURANÇA: ROW LEVEL SECURITY (RLS)
--------------------------------------------------------------------------------

-- Habilitar RLS em todas as tabelas
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas para evitar erros de duplicidade
DROP POLICY IF EXISTS "Lojas são visíveis por todos" ON lojas;
DROP POLICY IF EXISTS "Dono pode atualizar sua loja" ON lojas;
DROP POLICY IF EXISTS "Produtos são visíveis por todos" ON produtos;
DROP POLICY IF EXISTS "Dono gerencia seus produtos" ON produtos;
DROP POLICY IF EXISTS "Categorias são visíveis por todos" ON categorias;
DROP POLICY IF EXISTS "Dono gerencia categorias" ON categorias;
DROP POLICY IF EXISTS "Configurações são visíveis por todos" ON configuracoes;
DROP POLICY IF EXISTS "Dono gerencia configurações" ON configuracoes;
DROP POLICY IF EXISTS "Clientes podem inserir pedidos" ON pedidos;
DROP POLICY IF EXISTS "Dono gerencia seus pedidos" ON pedidos;

-- Criar Novas Políticas Baseadas no dono_id (UUID)
CREATE POLICY "Lojas são visíveis por todos" ON lojas FOR SELECT USING (true);
CREATE POLICY "Dono pode atualizar sua loja" ON lojas FOR ALL USING (auth.uid() = dono_id);

CREATE POLICY "Produtos são visíveis por todos" ON produtos FOR SELECT USING (true);
CREATE POLICY "Dono gerencia seus produtos" ON produtos FOR ALL USING (auth.uid() = dono_id);

CREATE POLICY "Categorias são visíveis por todos" ON categorias FOR SELECT USING (true);
CREATE POLICY "Dono gerencia categorias" ON categorias FOR ALL USING (auth.uid() = dono_id);

CREATE POLICY "Configurações são visíveis por todos" ON configuracoes FOR SELECT USING (true);
CREATE POLICY "Dono gerencia configurações" ON configuracoes FOR ALL USING (auth.uid() = dono_id);

CREATE POLICY "Clientes podem inserir pedidos" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Dono gerencia seus pedidos" ON pedidos FOR ALL USING (auth.uid() = dono_id);

--------------------------------------------------------------------------------
-- 2. AUTOMAÇÃO: TRIGGER DE ESTOQUE (SERVER-SIDE)
--------------------------------------------------------------------------------

-- Função para baixar ou estornar estoque baseada no status do pedido
CREATE OR REPLACE FUNCTION gerenciar_estoque_pedido()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- Se o status mudou para 'concluido' (Baixa de Estoque)
    IF (NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status <> 'concluido')) THEN
        FOR item IN SELECT * FROM jsonb_to_recordset(NEW.itens) AS x(product_id uuid, quantity int) LOOP
            UPDATE produtos 
            SET estoque = GREATEST(0, COALESCE(estoque, 0) - item.quantity)
            WHERE id = item.product_id;
        END LOOP;
    
    -- Se o status mudou DE 'concluido' para outro (Estorno de Estoque)
    ELSIF (OLD.status = 'concluido' AND NEW.status <> 'concluido') THEN
        FOR item IN SELECT * FROM jsonb_to_recordset(NEW.itens) AS x(product_id uuid, quantity int) LOOP
            UPDATE produtos 
            SET estoque = COALESCE(estoque, 0) + item.quantity
            WHERE id = item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função sempre que um pedido for atualizado
DROP TRIGGER IF EXISTS tr_estoque_pedido ON pedidos;
CREATE TRIGGER tr_estoque_pedido
AFTER UPDATE OF status ON pedidos
FOR EACH ROW
EXECUTE FUNCTION gerenciar_estoque_pedido();

--------------------------------------------------------------------------------
-- 3. REALTIME: Habilitar publicação para o Dashboard
--------------------------------------------------------------------------------
-- Isso deve ser feito no painel do Supabase em "Replication" para a tabela 'pedidos'
-- Ou via SQL se você tiver permissões de superusuário:
-- ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
