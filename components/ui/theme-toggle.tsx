"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "./button"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])
    if (!mounted) return (
        <Button variant="outline" size="icon" aria-label="Toggle theme" className="transition-all">
            <Sun className="h-4 w-4" />
        </Button>
    )

    const isDark = (resolvedTheme ?? theme) === "dark"
    return (
        <Button
            variant="outline"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="transition-all"
        >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
    )
}
