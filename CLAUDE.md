# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build (TypeScript errors are ignored — see next.config.mjs)
npm run lint     # Run ESLint
npm run start    # Start production server
```

There are no automated tests in this project.

## Architecture Overview

This is a **multi-tenant SaaS** for Brazilian produce stores ("hortifrutis"), built with Next.js 16 (App Router), Tailwind CSS v4, and Supabase as the backend.

### Routing

| Route | Description |
|---|---|
| `/` | Default store catalog (legacy single-tenant, reads from `produtos` without `dono_id` filter) |
| `/[slug]` | Multi-tenant store catalog — resolves `slug` → `lojas.dono_id` → fetches that store's products/settings/categories |
| `/admin` | Store owner dashboard (protected by Supabase Auth session) |
| `/login` | Login page, redirects to `/admin` on success |
| `/super-admin` | Platform operator panel to create new client stores |
| `/api/clientes` | POST endpoint — creates a new tenant (Supabase auth user + `lojas` row + `configuracoes` row) |

### Supabase Tables

- **`produtos`** — products, scoped to `dono_id` (store owner user ID)
- **`categorias`** — product categories, scoped to `dono_id`
- **`configuracoes`** — store settings (name, WhatsApp, delivery fee, logo, primary color), scoped to `dono_id`
- **`lojas`** — store registry with `slug` and `dono_id`, used by multi-tenant routing
- **`pedidos`** / **`itens_pedido`** — order records created at checkout

### Storage Buckets

- **`videos_produtos`** — product freshness videos uploaded via the admin camera modal (`.webm`)
- **`logos_lojas`** — store logo images uploaded via settings form
- **`imagens_produtos`** — product images

### Key Design Patterns

**Multi-tenancy security**: Every Supabase query in admin context includes `.eq("dono_id", user.id)` as a Row-Level Security guard. Do not remove these filters.

**`lib/supabase.ts`** — exports a single anon-key client used client-side everywhere. The API route (`/api/clientes`) uses a separate `supabaseAdmin` client initialized with `SUPABASE_SERVICE_ROLE_KEY` (server-side only).

**`lib/product-utils.ts`** — shared utilities: `getProductImage()` (name → image path), `formatFreshTimestamp()` (timestamp → human label + `isLive` bool), `getVideoStatus()` (timestamp → `"updated" | "outdated" | "old"`). Used by both the catalog and admin pages.

**White-label**: `cor_primaria` (hex string) is passed as a prop through `StoreHeader`, `ProductGrid`, `CartDrawer`, and `ProductDetailsModal` and applied via inline `style` overrides. Default is `#2d8a4e`.

**Admin tabs** (`AdminSidebar`): `"videos"` | `"products"` | `"categories"` | `"customers"` | `"settings"`. Each tab renders a distinct management component inside `app/admin/page.tsx`.

**Video freshness flow**: Admin taps a product → `CameraModal` opens (MediaRecorder API) → records `.webm` → uploads to `videos_produtos` bucket → updates `produtos.video_url` and `produtos.ultimo_video_em` → `isLive` flag shown on the catalog card for 5 minutes.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=      # Service role key (server-side only, for /api/clientes)
```

The anon key is hardcoded in `lib/supabase.ts` (intentional for this project's scope).
