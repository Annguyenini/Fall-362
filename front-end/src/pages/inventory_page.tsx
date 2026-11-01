import { useSearchParams } from "react-router-dom";
import InventoryScreen from "../inventory/inventory_screen";

export default function InventoryPage() {
  const [searchParams] = useSearchParams();

  const inventoryId = searchParams.get("inventory_id");

  if (!inventoryId) {
    return <div>Missing inventory_id</div>;
  }

  return (
    <InventoryScreen
      inventory_id={inventoryId}
    />
  );
}
