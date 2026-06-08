import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import './index.css'

// Apply saved theme before first paint (prevents flash)
const savedTheme = localStorage.getItem('appTheme') || 'light'
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = savedTheme === 'dark' || (savedTheme === 'auto' && prefersDark)
const root = document.documentElement
root.classList.remove('dark')
if (isDark) root.classList.add('dark')
root.setAttribute('data-theme', isDark ? 'dark' : 'light')
root.style.colorScheme = isDark ? 'dark' : 'light'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)