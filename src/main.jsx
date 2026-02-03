import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const loader = document.getElementById('app-loader')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (loader) {
  loader.style.opacity = '0'
  loader.style.pointerEvents = 'none'
  setTimeout(() => loader.remove(), 300)
}
