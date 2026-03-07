/**
 * Shared utilities for mapping Supabase `produtos` rows to front-end models.
 * Used by both the client catalog and the admin panel.
 */

/**
 * Returns an image path based on the product name.
 * Matches known names to local images, falls back to Unsplash.
 */
export function getProductImage(name: string): string {
  const lower = name.toLowerCase()
  const imageMap: Record<string, string> = {
    tomate: "/images/tomate.jpg",
    alface: "/images/alface.jpg",
    banana: "/images/banana.jpg",
    morango: "/images/morango.jpg",
    brocolis: "/images/brocolis.jpg",
    manga: "/images/manga.jpg",
  }

  for (const [key, url] of Object.entries(imageMap)) {
    if (lower.includes(key)) return url
  }

  const unsplashFallbacks = [
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=500&fit=crop",
  ]
  const idx = Math.abs(
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  ) % unsplashFallbacks.length

  return unsplashFallbacks[idx]
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
