import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import './App.css'
import Home from './pages/Home';
import InventoryPage from './pages/inventory_page';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App