"use client"

import Image from "next/image"
import { useState } from "react"
import { Leaf } from "lucide-react"

interface LogoProps {
  className?: string
  iconClassName?: string
  width?: number
  height?: number
  priority?: boolean
}

export function Logo({
  className = "w-9 h-9",
  iconClassName = "w-5 h-5",
  width = 40,
  height = 40,
  priority = false,
}: LogoProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-xl bg-primary ${className}`}>
        <Leaf className={`${iconClassName} text-primary-foreground`} />
      </div>
    )
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <Image
        src="/logo-principal.png"
        alt="Hortifruti Online"
        width={width}
        height={height}
        className="w-full h-full object-contain"
        onError={() => setError(true)}
        priority={priority}
      />
    </div>
  )
}
