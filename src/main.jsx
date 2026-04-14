import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('pageshow', (event) => {
  if (event?.persisted) {
    window.location.reload()
  }
})

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
