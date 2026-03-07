"use client"

import { useMemo } from "react"
import { Search, Flame, Tag } from "lucide-react"

export interface CategoryFilter {
  id: string
  nome: string
}

interface SearchAndFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeCategory: string
  onCategoryChange: (category: string) => void
  categories?: CategoryFilter[]
}

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories = [],
}: SearchAndFiltersProps) {
  // Build filter buttons: "Todos" first, then dynamic categories from database
  const filterButtons = useMemo(() => {
    const buttons: { id: string; filterId: string; label: string; icon?: typeof Tag }[] = [
      { id: "btn-all", filterId: "all", label: "Todos" },
    ]

    // Add dynamic categories from database using unique database IDs
    categories.forEach((cat) => {
      buttons.push({
        id: `btn-cat-${cat.id}`,
        filterId: cat.nome.toLowerCase(),
        label: cat.nome,
        icon: Tag,
      })
    })

    return buttons
  }, [categories])

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 pb-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar produtos frescos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {filterButtons.map((btn) => {
          const isActive = activeCategory === btn.filterId
          const Icon = btn.icon
          return (
            <button
              key={btn.id}
              onClick={() => onCategoryChange(btn.filterId)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {btn.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
