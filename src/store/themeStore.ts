import { create } from 'zustand'

type Theme = 'dark' | 'light'

// Read persisted theme from localStorage at init time
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem('theme') as Theme) || 'dark'
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    set({ theme })
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(newTheme)
  },
}))
