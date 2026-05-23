-- ============================================================
-- Migration 004: valor mínimo de entrega + dias de funcionamento
--
-- Bug 3: lojista quer poder exigir um valor mínimo de pedido para
--        entregar (ex: "só entrego acima de R$ 30").
-- Bug 4: horário só tinha abertura/fechamento, sem dias da semana.
--        Lojas que abrem sábado/domingo apareciam como "fechado".
--
-- Rode as duas etapas (são ALTER simples, seguros).
-- ============================================================

-- valor_minimo_entrega: 0 = sem mínimo (padrão)
alter table configuracoes
  add column if not exists valor_minimo_entrega numeric default 0;

-- dias_funcionamento: quais dias da semana a loja abre.
-- Guardamos como texto CSV de números 0-6 (0=domingo ... 6=sábado).
-- Default '1,2,3,4,5' = segunda a sexta (comportamento antigo).
alter table configuracoes
  add column if not exists dias_funcionamento text default '1,2,3,4,5';
