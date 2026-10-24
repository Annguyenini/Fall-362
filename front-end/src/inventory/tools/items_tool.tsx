import { useEffect, useState } from "react";
import inventory_controller from "../../core/inventory_controller";
import {InventoryStock} from "../../data-shapes/inventory-stock"
type ItemsResult = {
  data: InventoryStock[] | null;
  error: string | null;
};

type ItemsToolProps = {
  inventoryId: string;
};

export default function ItemsTool({ inventoryId }: ItemsToolProps) {
  const [result, setResult] = useState<ItemsResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);

    const loadItems = async () => {
      try {
        const items = await inventory_controller.getInventoryItems(inventoryId);
        if (!cancelled) setResult(items);
      } catch (error: unknown) {
        if (!cancelled) {
          setResult({
            data: null,
            error: error instanceof Error ? error.message : "Failed to get items",
          });
        }
      }
    };

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [inventoryId]);

  if (!result?.data || result.error) {
    return (
      <div>
        <h2>Items</h2>
        <p>Inventory ID: {inventoryId}</p>
        <p role="alert">{result?.error ?? "Failed to get items"}</p>
      </div>
    );
  }

  return (
    <div className="items-tool">
      <h2>Items</h2>
      <p>Inventory ID: {inventoryId}</p>
      <p>Count: {result.data.length}</p>
      <div className="items-table-scroll">
        <table className="items-table">
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Batch</th>
              <th scope="col">Quantity</th>
              <th scope="col">Shelf</th>
              <th scope="col">Added</th>
              <th scope="col">Alert</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((item) => (
              <tr key={`${item.inventory_id}-${item.sku}-${item.batch_id}`}>
                <td>{item.sku}</td>
                <td>{item.batch_id}</td>
                <td>{item.quantity}</td>
                <td>{item.shelf ?? "—"}</td>
                <td>{item.time_added ?? "—"}</td>
                <td>{item.time_alert ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
