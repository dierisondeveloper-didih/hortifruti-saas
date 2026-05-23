-- ============================================================
-- Migration 003 (OPCIONAL): apertar listagem de arquivos no Storage
--
-- O aviso "Clients can list all files in this bucket" significa que
-- existe uma policy de SELECT ampla em storage.objects que permite
-- QUALQUER cliente LISTAR todos os arquivos dos buckets públicos.
--
-- IMPORTANTE — diferença entre LISTAR e LER:
--   • LER (baixar um arquivo por URL pública) → precisa continuar funcionando
--     (o catálogo carrega imagens/vídeos por URL pública).
--   • LISTAR (pedir a lista de todos os arquivos do bucket) → é o que o
--     aviso reclama. Não é necessário para o app e expõe nomes de arquivos.
--
-- Buckets públicos NÃO precisam de policy de SELECT para servir arquivos
-- por URL pública — o acesso público de leitura é garantido pela flag
-- "public" do bucket, não pela policy. Então remover a policy de listagem
-- NÃO quebra o carregamento de imagens.
--
-- ⚠️ RODE COM CALMA e TESTE depois: após aplicar, recarregue o catálogo
-- de uma loja e confirme que as imagens/vídeos ainda aparecem. Se algo
-- sumir, me avise — dá pra reverter recriando a policy.
-- ============================================================


-- ── PASSO 1 (leitura): veja quais policies existem em storage.objects ──
-- Rode isto primeiro e me cole o resultado, para identificarmos o nome
-- exato da policy de listagem antes de remover.

-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'storage' and tablename = 'objects';


-- ── PASSO 2: remover a policy de listagem ampla ──
-- O nome varia por projeto. Substitua <NOME_DA_POLICY> pelo nome real
-- que apareceu no PASSO 1 (geralmente algo como
-- "Public read access" ou "Allow public SELECT").
-- NÃO remova policies de INSERT/UPDATE necessárias para uploads.

-- drop policy "<NOME_DA_POLICY>" on storage.objects;


-- NOTA: como o nome da policy é específico do seu projeto, este passo
-- ficou como template. Cole o resultado do PASSO 1 que eu te passo o
-- DROP exato e seguro.
