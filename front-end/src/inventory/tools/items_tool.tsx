import { useEffect, useState } from "react";
import inventory_controller from "../../core/inventory_controller";
import type { InventoryStock } from "../../data-shapes/inventory-stock";

type ItemDetails = { sku: number; title: string; price: number };
type ItemsResult = {
  data: InventoryStock[] | null;
  error: string | null;
};

type ItemsToolProps = {
  inventoryId: string;
};

export default function ItemsTool({ inventoryId }: ItemsToolProps) {
  const [result, setResult] = useState<ItemsResult | null>(null);
  const [selectedSku, setSelectedSku] = useState<number | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

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

  useEffect(() => {
    if (selectedSku === null) {
      setItemDetails(null);
      setDetailsError(null);
      return;
    }

    let cancelled = false;
    setDetailsLoading(true);
    setItemDetails(null);
    setDetailsError(null);

    inventory_controller.getItem(selectedSku)
      .then((item) => { if (!cancelled) setItemDetails(item); })
      .catch((error: unknown) => {
        if (!cancelled) {
          setDetailsError(error instanceof Error ? error.message : "Failed to load item details.");
        }
      })
      .finally(() => { if (!cancelled) setDetailsLoading(false); });

    return () => { cancelled = true; };
  }, [selectedSku]);

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
                <td>
                  <button
                    className="item-sku-button"
                    type="button"
                    aria-label={`View details for SKU ${item.sku}`}
                    aria-pressed={selectedSku === item.sku}
                    onClick={() => setSelectedSku((current) => current === item.sku ? null : item.sku)}
                  >
                    {item.sku}
                  </button>
                </td>
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
      {selectedSku !== null && (
        <section className="item-details" aria-live="polite" aria-labelledby="item-details-title">
          <div className="item-details-heading">
            <h3 id="item-details-title">Item details</h3>
            <button type="button" className="item-details-close" onClick={() => setSelectedSku(null)}>
              Close
            </button>
          </div>
          {detailsLoading && <p role="status">Loading item details…</p>}
          {detailsError && <p className="item-details-error" role="alert">{detailsError}</p>}
          {itemDetails && (
            <dl className="item-details-grid">
              <div><dt>SKU</dt><dd>{itemDetails.sku}</dd></div>
              <div><dt>Title</dt><dd>{itemDetails.title}</dd></div>
              <div><dt>Price</dt><dd>{new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(itemDetails.price)}</dd></div>
            </dl>
          )}
        </section>
      )}
    </div>
  );
}
