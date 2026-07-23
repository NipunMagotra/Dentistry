"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    // ⚡ INSTANT THEME SWITCHING FIX:
    // Prevent browser layout thrashing & backdrop-filter GPU lag by temporarily 
    // suppressing transitions during the class mutation.
    const css = document.createElement('style')
    css.appendChild(
      document.createTextNode(
        '*, *::before, *::after { transition: none !important; }'
      )
    )
    document.head.appendChild(css)

    const nextTheme = theme === "light" ? "dark" : "light"
    setTheme(nextTheme)
    localStorage.setItem("theme", nextTheme)

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Force computed style update and remove transition suppression in next frame
    window.getComputedStyle(css).opacity
    requestAnimationFrame(() => {
      document.head.removeChild(css)
    })
  }

  if (!mounted) {
    return <div className="size-10 rounded-full glass-panel border border-black/10 dark:border-white/10" />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-10 rounded-full glass-panel border border-black/10 dark:border-white/10 text-foreground hover:bg-accent/80 transition-transform duration-200 active:scale-95 cursor-pointer shadow-xs"
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
    >
      {theme === "light" ? (
        <Moon className="size-5 text-slate-700 transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="size-5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
