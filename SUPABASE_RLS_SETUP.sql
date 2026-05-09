-- # SCRIPT DE CONFIGURAÇÃO DE SEGURANÇA (RLS) - HORTIFRUTI SAAS
-- Instruções: Copie este script e execute no "SQL Editor" do seu painel do Supabase.

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para a tabela LOJAS
-- Qualquer pessoa pode ver as lojas (necessário para o catálogo carregar pelo slug)
CREATE POLICY "Lojas são visíveis por todos" ON lojas FOR SELECT USING (true);
-- Apenas o dono pode atualizar sua loja
CREATE POLICY "Dono pode atualizar sua loja" ON lojas FOR UPDATE USING (auth.uid() = dono_id);

-- 3. Políticas para a tabela PRODUTOS
-- Todos podem ver produtos (catálogo)
CREATE POLICY "Produtos são visíveis por todos" ON produtos FOR SELECT USING (true);
-- Apenas o dono pode gerenciar seus produtos
CREATE POLICY "Dono gerencia seus produtos" ON produtos FOR ALL USING (auth.uid() = dono_id);

-- 4. Políticas para a tabela CATEGORIAS
-- Todos podem ver categorias
CREATE POLICY "Categorias são visíveis por todos" ON categorias FOR SELECT USING (true);
-- Apenas o dono pode gerenciar categorias
CREATE POLICY "Dono gerencia categorias" ON categorias FOR ALL USING (auth.uid() = dono_id);

-- 5. Políticas para a tabela CONFIGURACOES
-- Todos podem ver configurações (necessário para cores, logo e horários)
CREATE POLICY "Configurações são visíveis por todos" ON configuracoes FOR SELECT USING (true);
-- Apenas o dono gerencia suas configurações
CREATE POLICY "Dono gerencia configurações" ON configuracoes FOR ALL USING (auth.uid() = dono_id);

-- 6. Políticas para a tabela PEDIDOS
-- Inserção pública (qualquer cliente pode fazer pedido)
CREATE POLICY "Clientes podem inserir pedidos" ON pedidos FOR INSERT WITH CHECK (true);
-- Apenas o dono pode ver e gerenciar os pedidos da sua loja
CREATE POLICY "Dono gerencia seus pedidos" ON pedidos FOR ALL USING (auth.uid() = dono_id);

-- NOTA: Certifique-se de que todas as tabelas tenham a coluna 'dono_id' do tipo UUID 
-- apontando para auth.users(id).
