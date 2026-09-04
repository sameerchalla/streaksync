import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App.tsx'

// Initialize theme from localStorage before React mounts to prevent flash
const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null
if (savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light')
}

createRoot(document.getElementById('root')!).render(<App />)