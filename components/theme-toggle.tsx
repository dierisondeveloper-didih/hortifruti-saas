"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface ThemeToggleProps {
  primaryColor?: string
}

export function ThemeToggle({ primaryColor }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors bg-secondary/50 hover:bg-secondary/80 dark:bg-secondary/30 dark:hover:bg-secondary/50"
      style={primaryColor ? { backgroundColor: "rgba(255,255,255,0.2)" } : {}}
      aria-label="Alternar tema"
    >
      <Sun 
        className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
        style={{ color: primaryColor ? "#fff" : "var(--foreground)" }} 
      />
      <Moon 
        className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
        style={{ color: primaryColor ? "#fff" : "var(--foreground)" }} 
      />
    </button>
  )
}
