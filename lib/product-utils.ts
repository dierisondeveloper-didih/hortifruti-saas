/**
 * Shared utilities for mapping Supabase `produtos` rows to front-end models.
 * Used by both the client catalog and the admin panel.
 */

/**
 * Base do banco de imagens dos produtos (imagens-base geradas por IA).
 * Apontando para a pasta `base/` do bucket público `produtos` no Supabase Storage.
 *
 * As imagens devem ser enviadas para: produtos/base/<nome>.webp
 * com nome minúsculo, sem acento, com hífen (ex: batata-doce.webp).
 *
 * Enquanto uma imagem específica não existir no Storage, o produto cai
 * no placeholder honesto (a UI trata string vazia / 404 graciosamente).
 */
const IMAGE_BASE =
  "https://vkumsusmkyxmhgraqdms.supabase.co/storage/v1/object/public/produtos/base"

/**
 * Mapa de palavra-chave -> arquivo de imagem (.webp).
 * A chave é comparada com `includes` no nome do produto, então
 * "banana nanica" e "banana prata" caem ambas em "banana".
 * Chaves mais específicas devem vir ANTES das genéricas
 * (ex: "batata-doce" antes de "batata", "couve-flor" antes de "couve").
 */
const IMAGE_MAP: Record<string, string> = {
  // Frutas
  banana: "banana.webp",
  maca: "maca.webp",
  "maçã": "maca.webp",
  laranja: "laranja.webp",
  mamao: "mamao.webp",
  "mamão": "mamao.webp",
  manga: "manga.webp",
  abacaxi: "abacaxi.webp",
  melancia: "melancia.webp",
  melao: "melao.webp",
  "melão": "melao.webp",
  uva: "uva.webp",
  morango: "morango.webp",
  limao: "limao.webp",
  "limão": "limao.webp",
  pera: "pera.webp",
  abacate: "abacate.webp",
  goiaba: "goiaba.webp",
  maracuja: "maracuja.webp",
  "maracujá": "maracuja.webp",
  tangerina: "tangerina.webp",
  mexerica: "tangerina.webp",
  kiwi: "kiwi.webp",
  coco: "coco.webp",
  // Legumes (específicos antes dos genéricos)
  "batata-doce": "batata-doce.webp",
  "batata doce": "batata-doce.webp",
  batata: "batata.webp",
  tomate: "tomate.webp",
  cebola: "cebola.webp",
  cenoura: "cenoura.webp",
  abobrinha: "abobrinha.webp",
  abobora: "abobora.webp",
  "abóbora": "abobora.webp",
  chuchu: "chuchu.webp",
  pepino: "pepino.webp",
  pimentao: "pimentao.webp",
  "pimentão": "pimentao.webp",
  beterraba: "beterraba.webp",
  berinjela: "berinjela.webp",
  mandioca: "mandioca.webp",
  aipim: "mandioca.webp",
  inhame: "inhame.webp",
  quiabo: "quiabo.webp",
  vagem: "vagem.webp",
  // Verduras (específicos antes dos genéricos)
  "couve-flor": "couve-flor.webp",
  "couve flor": "couve-flor.webp",
  couve: "couve.webp",
  alface: "alface.webp",
  brocolis: "brocolis.webp",
  "brócolis": "brocolis.webp",
  espinafre: "espinafre.webp",
  rucula: "rucula.webp",
  "rúcula": "rucula.webp",
  repolho: "repolho.webp",
  "cheiro-verde": "cheiro-verde.webp",
  "cheiro verde": "cheiro-verde.webp",
  salsa: "salsa.webp",
  salsinha: "salsa.webp",
  cebolinha: "cebolinha.webp",
  coentro: "coentro.webp",
  // Diversos
  ovo: "ovos.webp",
  ovos: "ovos.webp",
}

/**
 * Retorna a URL da imagem-base de um produto, ou string vazia
 * se não houver correspondência (nesse caso a UI mostra o placeholder).
 *
 * IMPORTANTE: não retorna imagens aleatórias. Foto errada quebra a
 * confiança do cliente — melhor um placeholder honesto.
 */
export function getProductImage(name: string): string {
  const lower = name.toLowerCase().trim()
  if (!lower) return ""

  for (const [key, file] of Object.entries(IMAGE_MAP)) {
    if (lower.includes(key)) return `${IMAGE_BASE}/${file}`
  }

  return ""
}

/**
 * Indica se um produto está sem imagem real (do banco ou enviada pelo lojista).
 * A UI usa isso para decidir entre mostrar a foto ou o placeholder.
 */
export function hasProductImage(imagemUrl: unknown, name: string): boolean {
  if (typeof imagemUrl === "string" && imagemUrl.trim().length > 0) return true
  return getProductImage(name).length > 0
}

/**
 * Resolve a melhor imagem disponível para um produto:
 * 1) imagem real enviada pelo lojista (imagem_url), se houver
 * 2) imagem do banco por palavra-chave, se houver
 * 3) string vazia -> a UI mostra placeholder
 */
export function resolveProductImage(imagemUrl: unknown, name: string): string {
  if (typeof imagemUrl === "string" && imagemUrl.trim().length > 0) return imagemUrl.trim()
  return getProductImage(name)
}

/**
 * Formats a DB timestamp from `ultimo_video_em` into a human-readable
 * freshness label and whether it should be considered "live".
 */
export function formatFreshTimestamp(raw: unknown): {
  label: string
  isLive: boolean
} {
  if (!raw) return { label: "Sem video", isLive: false }

  const date = new Date(String(raw))
  if (isNaN(date.getTime())) return { label: "Sem video", isLive: false }

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 5) return { label: "AO VIVO", isLive: true }
  if (diffMin < 60) return { label: `Ha ${diffMin} min`, isLive: false }

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    const h = String(date.getHours()).padStart(2, "0")
    const m = String(date.getMinutes()).padStart(2, "0")
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) return { label: `Hoje as ${h}:${m}`, isLive: false }
    return { label: `Ha ${diffHours}h`, isLive: false }
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return { label: "Ontem", isLive: false }

  return { label: `Ha ${diffDays} dias`, isLive: false }
}

/**
 * Determines a video status for the admin panel based on the timestamp.
 */
export function getVideoStatus(
  raw: unknown
): "updated" | "outdated" | "old" {
  if (!raw) return "old"

  const date = new Date(String(raw))
  if (isNaN(date.getTime())) return "old"

  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffHours < 24) return "updated"
  if (diffHours < 72) return "outdated"
  return "old"
}
