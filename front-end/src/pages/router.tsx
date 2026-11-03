import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../home/home";
import InventoryPage from "../inventory/inventory_page";
import ItemsManagementPage from "../items/items_management_page";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/items" element={<ItemsManagementPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
