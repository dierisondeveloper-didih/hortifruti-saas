-- ============================================================
-- Migration 002: corrigir unique de categorias
--
-- PROBLEMA: a constraint `categorias_nome_key` torna o NOME único
-- no sistema INTEIRO. Por isso, quando a 2ª loja tenta criar "Frutas"
-- (que a 1ª loja já criou), o banco recusa e — por causa do catch
-- silencioso no route.ts — nenhuma categoria da nova loja é criada.
-- Resultado: dropdown "Nenhuma categoria cadastrada" em lojas novas.
--
-- SOLUÇÃO: nome único POR LOJA (nome + dono_id), não global.
-- Assim cada loja pode ter sua própria "Frutas".
--
-- RODE EM 2 ETAPAS, conferindo entre elas.
-- ============================================================


-- ------------------------------------------------------------
-- ETAPA 0 (checagem — leitura, não altera nada):
-- Confirme que NÃO existem categorias duplicadas dentro de uma
-- mesma loja. Deve retornar VAZIO. Se retornar linhas, me avise
-- antes de prosseguir (precisaríamos limpar os duplicados primeiro).
-- ------------------------------------------------------------

-- select nome, dono_id, count(*)
-- from categorias
-- group by nome, dono_id
-- having count(*) > 1;


-- ------------------------------------------------------------
-- ETAPA 1: remove o unique global no nome.
-- ------------------------------------------------------------

alter table categorias
  drop constraint if exists categorias_nome_key;


-- ------------------------------------------------------------
-- ETAPA 2: cria o unique composto (nome único dentro de cada loja).
-- Só rode depois de confirmar que a Etapa 0 voltou vazia e a
-- Etapa 1 rodou com sucesso.
-- ------------------------------------------------------------

alter table categorias
  add constraint categorias_nome_dono_unique unique (nome, dono_id);
