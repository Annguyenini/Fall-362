import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import InventoryScreen from './inventory/inventory_screen.js'

createRoot(document.getElementById('root')).render(
<App/>
  // <StrictMode>
  // </StrictMode>,
)
