import { useState } from 'react'

import { BrowserRouter, Routes, Route } from "react-router-dom";

import './App.css'
import InventoryScreen from './inventory/inventory_screen';
import InventoryPage from './pages/inventory_page';

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
          <Routes>
            <Route path="/inventory" element={<InventoryPage/>} />
          </Routes>
        </BrowserRouter>
  )
}

export default App
