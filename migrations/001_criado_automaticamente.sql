-- ============================================================
-- Migration: diferenciar produtos-base (criados pelo sistema)
-- de produtos cadastrados/adotados pelo lojista.
--
-- Objetivo: o onboarding ("Cadastre seus produtos") só deve
-- marcar como concluído quando o lojista CRIAR um produto novo
-- ou EDITAR (adotar) um produto-base.
--
-- RODE EM DUAS ETAPAS, conferindo entre elas. Não rode tudo de uma vez.
-- ============================================================


-- ------------------------------------------------------------
-- ETAPA 1 (segura e reversível): adiciona a coluna.
-- Todo produto existente e futuro passa a ter o campo,
-- com default false (= "do lojista"). Rode esta parte primeiro.
-- ------------------------------------------------------------

alter table produtos
  add column if not exists criado_automaticamente boolean not null default false;


-- ------------------------------------------------------------
-- ETAPA 2 (marca os produtos-base já existentes):
-- Só rode DEPOIS de confirmar que a Etapa 1 funcionou.
--
-- Marca como automáticos os produtos que ainda têm a "cara"
-- de produto-base: sem imagem própria, sem oferta e com estoque 0
-- (que é exatamente como o sistema os cria em route.ts).
--
-- ATENÇÃO: se algum lojista já tiver editado um produto-base
-- (mudado preço/foto), ele NÃO será marcado como automático aqui
-- — o que é o comportamento desejado (ele já "adotou" o produto).
-- ------------------------------------------------------------

update produtos
set criado_automaticamente = true
where imagem_url is null
  and em_oferta = false
  and coalesce(estoque, 0) = 0;


-- ------------------------------------------------------------
-- ETAPA 3 (controle de estoque opcional):
-- Adiciona a flag `controla_estoque`. Quando FALSE (padrão), o
-- produto é sempre tratado como disponível — o lojista não precisa
-- gerenciar números. Quando TRUE, o sistema usa o campo `estoque`
-- e mostra "Esgotado" quando chega a zero.
--
-- Default false: a maioria dos hortifrutis não controla estoque
-- unidade a unidade, então "sempre disponível" é o padrão sensato.
-- ------------------------------------------------------------

alter table produtos
  add column if not exists controla_estoque boolean not null default false;
