'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (t: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  isDark: false,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [isDark, setIsDark] = useState(false)

  const applyTheme = useCallback((activeTheme: Theme) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const shouldBeDark = activeTheme === 'dark' || (activeTheme === 'system' && mediaQuery.matches)
    setIsDark(shouldBeDark)
    const root = document.documentElement
    if (shouldBeDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    try {
      const stored = (localStorage.getItem('homeos-theme') as Theme) || 'system'
      setThemeState(stored)
      applyTheme(stored)

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleMediaChange = () => {
        const currentStored = (localStorage.getItem('homeos-theme') as Theme) || 'system'
        if (currentStored === 'system') {
          applyTheme('system')
        }
      }

      mediaQuery.addEventListener('change', handleMediaChange)
      return () => mediaQuery.removeEventListener('change', handleMediaChange)
    } catch {
      // Fallback for environments without localStorage
    }
  }, [applyTheme])

  const setTheme = (t: Theme) => {
    try {
      localStorage.setItem('homeos-theme', t)
    } catch {
      // Ignore
    }
    setThemeState(t)
    applyTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
