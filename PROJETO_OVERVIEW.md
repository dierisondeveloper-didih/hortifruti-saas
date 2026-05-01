# Hortifruti App — Visão Geral do Projeto para Revisão

## O que é este projeto?

SaaS multi-tenant para hortifrutis brasileiros. Cada lojista tem um catálogo próprio acessível via `/[slug]`, faz gestão de produtos/pedidos no `/admin`, e os clientes finalizam o pedido pelo WhatsApp. Desenvolvido com Next.js 16 (App Router), Tailwind CSS v4 e Supabase.

Estou buscando sugestões de melhorias de produto, UX, performance, arquitetura e novas funcionalidades. Por favor, analise o contexto abaixo e sugira o que poderia ser melhorado ou adicionado.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (Radix primitives) |
| Backend/DB | Supabase (PostgreSQL, Auth, Storage) |
| Deploy | Vercel |
| Linguagem | TypeScript 5.7 |
| Sem testes | Nenhum teste automatizado |

Dependências relevantes: `recharts`, `react-hook-form`, `zod`, `sonner`, `date-fns`, `lucide-react`, `next-themes`.

---

## Arquitetura e Rotas

```
/                   → Catálogo legado (single-tenant, sem filtro dono_id)
/[slug]             → Catálogo multi-tenant (slug → lojas.dono_id → produtos)
/admin              → Painel do lojista (auth-gated, client-side)
/login              → Login com Supabase Auth
/super-admin        → Painel operador para criar novos lojistas
/api/clientes       → POST: cria tenant (auth user + loja + config + seed de dados)
/api/change-password → POST: troca senha do lojista (valida token JWT)
/api/super-admin/*  → APIs internas do super admin
```

---

## Banco de Dados (Supabase)

### Tabelas principais

**`produtos`**
```
id, dono_id, nome, preco, unidade, estoque, categoria,
imagem_url, video_url, ultimo_video_em, em_oferta, preco_oferta, criado_em
```

**`categorias`**
```
id, dono_id, nome
```

**`configuracoes`** (settings white-label por loja)
```
id, dono_id, nome_loja, telefone_whatsapp, taxa_entrega,
logo_url, cor_primaria, tipo_servico (enum: entrega|retirada|ambos)
```

**`lojas`**
```
id, dono_id, name, slug, ativo
```

**`pedidos`**
```
id, dono_id, cliente_nome, cliente_endereco, tipo_entrega (delivery|pickup),
total, itens (JSONB), status (pendente|concluido|cancelado), created_at
```

**`itens_pedido`** — tabela existe mas itens são armazenados como JSONB dentro de `pedidos.itens`

### Storage Buckets
- `videos_produtos` — vídeos `.webm` gravados pelo lojista (frescor do produto)
- `logos_lojas` — logos das lojas
- `imagens_produtos` — imagens de produtos

### Segurança Multi-tenant
Todo query no admin inclui `.eq("dono_id", user.id)`. Sem RLS configurado no banco (a segurança é feita no código).

---

## Fluxo Principal de Negócio

### Catálogo (`/[slug]`)
1. Resolve `slug` → `lojas` → `dono_id`
2. Busca em paralelo: `produtos`, `configuracoes`, `categorias` (4 queries sequenciais, não paralelas)
3. Renderiza grid de produtos com filtro por categoria e busca por nome
4. Produto com vídeo mostra autoplay muted em loop + badge de frescor ("AO VIVO", "Hoje às HH:MM", "Há X min")
5. Cliente adiciona ao carrinho → abre `CartDrawer` → informa nome + endereço → clica "Finalizar no WhatsApp"
6. Sistema salva pedido em `pedidos` (Supabase) e abre `wa.me` com mensagem pré-formatada

### Admin (`/admin`)
Tabs: Dashboard | Vídeos | Produtos | Pedidos | Configurações

- **Dashboard**: métricas (produtos, pedidos total, pendentes, vídeos desatualizados) + link público da loja
- **Vídeos**: lista de produtos com status de vídeo (updated/outdated/old) — lojista grava via câmera do celular
- **Produtos**: CRUD completo (nome, preço, unidade, estoque, categoria, imagem)
- **Pedidos**: lista com expansão, alteração de status (pendente/concluido/cancelado), baixa automática de estoque ao concluir
- **Configurações**: nome da loja, WhatsApp, taxa de entrega, tipo de serviço, cor primária, logo, troca de senha

### Criação de Tenant (`/super-admin`)
1. Operador preenche: email, senha, nome da loja, slug
2. POST `/api/clientes` → cria auth user → cria `lojas` → cria `configuracoes` → seed de 22 produtos e 6 categorias
3. Rollback manual se qualquer etapa falhar

---

## Componentes Principais

| Componente | Responsabilidade |
|---|---|
| `ProductCard` | Card do catálogo: imagem/vídeo autoplay, badge frescor, oferta, botão +carrinho |
| `ProductGrid` | Grid 2 colunas de ProductCards |
| `CartDrawer` | Drawer lateral: lista itens, subtotal+entrega, coleta nome/endereço, finaliza no WhatsApp |
| `CameraModal` | Modal fullscreen para gravar vídeo: MediaRecorder API, zoom, troca câmera, max 15s |
| `AdminProductList` | Lista admin de produtos para gerenciar vídeos |
| `ProductManagement` | CRUD de produtos com modal de formulário |
| `CategoryManagement` | CRUD de categorias |
| `OrdersManagement` | Dashboard de pedidos com status e baixa de estoque |
| `AdminDashboard` | Métricas + link da loja |
| `SettingsForm` | Configurações da loja + troca de senha |
| `StoreHeader` | Header do catálogo com logo, cor primária, contador do carrinho |
| `SearchAndFilters` | Barra de busca + filtros por categoria (pills) |
| `FullScreenVideoPlayer` | Player fullscreen ao clicar no vídeo do produto |
| `ProductDetailsModal` | Modal com detalhes do produto e botão adicionar |
| `AppFooter` | Footer com branding "Vertyx Tureta e Santos SA" |

---

## Utilitários (`lib/`)

**`lib/product-utils.ts`**
- `getProductImage(name)` — mapeia nome → imagem local (6 mapeamentos fixos: tomate, alface, banana, morango, brócolis, manga). Fallback: 6 URLs do Unsplash com hash determinístico do nome.
- `formatFreshTimestamp(raw)` — converte `ultimo_video_em` em label ("AO VIVO" se < 5min, "Há X min", "Hoje às HH:MM", "Ontem", "Há X dias") + flag `isLive`
- `getVideoStatus(raw)` — retorna `"updated"` (< 24h), `"outdated"` (24-72h), `"old"` (> 72h ou null)

**`lib/supabase.ts`**
- Anon key hardcoded (intencional para o escopo atual)
- Client único para todo o app client-side

---

## Features Existentes

- [x] Catálogo multi-tenant com white-label (cor, logo)
- [x] Vídeo de frescor por produto (gravação via câmera, badge "AO VIVO")
- [x] Carrinho com entrega ou retirada
- [x] Checkout via WhatsApp (mensagem pré-formatada)
- [x] Registro de pedidos no banco
- [x] Dashboard de pedidos com status
- [x] Baixa automática de estoque ao concluir pedido
- [x] CRUD de produtos e categorias
- [x] Upload de imagem de produto
- [x] Upload de logo da loja
- [x] Configurações white-label (cor primária)
- [x] Troca de senha do lojista
- [x] Produtos em oferta com preço promocional
- [x] Filtro por categoria + busca por nome
- [x] Seed automático de produtos/categorias para novos lojistas
- [x] Super admin para criar lojistas
- [x] Dashboard admin com métricas básicas

---

## Limitações e Problemas Conhecidos

### Técnicos
- **Sem RLS no Supabase** — segurança multi-tenant feita apenas no código (risco se alguém acessar diretamente a API)
- **4 queries sequenciais** no carregamento do catálogo (`/[slug]`) em vez de paralelas com `Promise.all`
- **`alert()` e `window.confirm()`** usados para feedback em vez de toasts/modals — UX ruim no mobile
- **`console.log` em produção** no `CartDrawer` (linha 121: "Pacote enviado para o Supabase")
- **Ratings falsos** — `rating` e `reviewCount` gerados por hash do nome, não são dados reais
- **Imagens por nome** — mapeamento limitado a 6 produtos conhecidos; resto vai para Unsplash
- **Sem paginação** — todos os produtos carregados de uma vez
- **Sem debounce** na busca por texto
- **`estoque` não exibido no catálogo** — cliente não sabe se produto está disponível
- **`itens_pedido` não usada** — itens ficam em JSONB dentro de `pedidos`
- **Configurações com possível duplicata** — busca `configArray[configArray.length - 1]` no catálogo (workaround para duplicatas antigas)
- **Erro de case no status** — query de pedidos pendentes busca `"Pendente"` (maiúsculo) mas inserts gravam `"pendente"` (minúsculo) — dashboard pode mostrar 0 pendentes incorretamente

### UX / Produto
- Sem notificação para o lojista de novos pedidos (precisa atualizar manualmente)
- Sem suporte a pagamento online — apenas WhatsApp
- Sem histórico de compras do cliente
- Sem busca de produto por voz ou código
- Sem modo escuro diferenciado por loja
- Sem suporte a múltiplas fotos por produto
- Sem gestão de horário de funcionamento
- Sem área de cupons/descontos
- Sem relatórios de vendas/faturamento
- Sem integração com sistema de delivery (iFood, etc.)
- Mobile-first mas sem PWA / instalação no homescreen

---

## Estrutura de Arquivos

```
app/
  layout.tsx
  page.tsx                     # Catálogo legado
  [slug]/page.tsx              # Catálogo multi-tenant
  admin/page.tsx               # Painel lojista
  login/page.tsx
  super-admin/page.tsx
  api/
    clientes/route.ts          # Criação de tenant
    change-password/route.ts   # Troca de senha
    super-admin/
      auth/route.ts
      lojas/route.ts
      cleanup/route.ts

components/
  product-card.tsx
  product-grid.tsx
  product-form-modal.tsx
  product-management.tsx
  admin-product-list.tsx
  admin-dashboard.tsx
  admin-header.tsx
  admin-sidebar.tsx
  admin-status-panel.tsx
  camera-modal.tsx
  cart-drawer.tsx
  category-management.tsx
  orders-management.tsx
  settings-form.tsx
  store-header.tsx
  search-and-filters.tsx
  product-details-modal.tsx
  fullscreen-video-player.tsx
  app-footer.tsx
  theme-provider.tsx
  ui/                          # shadcn/ui components (accordion, button, dialog, etc.)

lib/
  supabase.ts
  product-utils.ts
  utils.ts

hooks/
  use-mobile.ts
  use-toast.ts
```

---

## O que gostaria de melhorar

Estou aberto a sugestões em qualquer área:

1. **Produto/Funcionalidades** — o que adicionar para aumentar o valor para o lojista?
2. **UX** — onde a experiência do lojista ou do cliente pode ser melhorada?
3. **Performance** — o que otimizar no carregamento, queries, imagens, vídeos?
4. **Arquitetura/Código** — padrões melhores, refatorações que valem a pena?
5. **Segurança** — o que é crítico corrigir (especialmente o RLS)?
6. **Monetização** — como estruturar planos/limites para escalar como SaaS?

Por favor, seja específico e priorize as sugestões pelo impacto real no produto.
