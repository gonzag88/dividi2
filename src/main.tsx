import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

// Precachea todo al primer load y se actualiza solo cuando hay versión nueva.
registerSW({ immediate: true })

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el contenedor raíz.')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
