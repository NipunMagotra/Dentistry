"use client"

import { cn } from "@/lib/utils"

interface ClinicLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function ClinicLogo({ className, size = "md" }: ClinicLogoProps) {
  const badgeSize = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10"
  const iconSize = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5"
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base sm:text-lg"

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Glowing Cyan Tooth Badge */}
      <div className={cn(
        "rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/20 flex items-center justify-center shrink-0 transition-transform hover:scale-105",
        badgeSize
      )}>
        <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[14px] flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "text-cyan-500 dark:text-cyan-400 drop-shadow-xs",
              iconSize
            )}
          >
            {/* Elegant Vector Tooth Path */}
            <path d="M12 2C8 2 6 4 6 7c0 2.5 1 4.5 2 7.5.8 2.4 1.5 5.5 2.5 5.5s1.5-2 1.5-3.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5c0 1.5.5 3.5 1.5 3.5s1.7-3.1 2.5-5.5c1-3 2-5 2-7.5 0-3-2-5-6-5z" />
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <span className={cn("font-extrabold tracking-tight flex items-center", textSize)}>
          <span className="text-cyan-500 dark:text-cyan-400">Happy</span>
          <span className="text-blue-600 dark:text-blue-400">Tooth</span>
        </span>
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/80 uppercase mt-0.5">
          Clinic OS
        </span>
      </div>
    </div>
  )
}
