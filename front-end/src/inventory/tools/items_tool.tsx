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
  const [itemsLoading, setItemsLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<number | null>(null);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [removingSku, setRemovingSku] = useState<number | null>(null);
  const [discountingSku, setDiscountingSku] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setItemsLoading(true);

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
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    };

    loadItems();

    return () => {
      cancelled = true;
    };
  }, [inventoryId, refreshKey]);

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

  async function removeItem(sku: number) {
    if (!window.confirm(`Remove SKU ${sku} from this inventory?`)) return;
    setActionError(null);
    setActionSuccess(null);
    setRemovingSku(sku);
    try {
      await inventory_controller.removeStockFromInventory(inventoryId, sku);
      setResult((current) => current?.data
        ? { ...current, data: current.data.filter((item) => item.sku !== sku) }
        : current,
      );
      setOpenMenuId(null);
      if (selectedSku === sku) setSelectedSku(null);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Could not remove item from this inventory.");
    } finally {
      setRemovingSku(null);
    }
  }

  async function setDiscount(item: InventoryStock) {
    const input = window.prompt(
      "Enter a whole-number discount percent from 1 to 100:",
      item.discount_percent ? String(item.discount_percent) : "",
    );
    if (input === null) return;

    const value = input.trim();
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100) {
      setActionError("Discount must be a whole number from 1 to 100.");
      setActionSuccess(null);
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    setDiscountingSku(item.sku);
    try {
      await inventory_controller.setInventoryDiscount(inventoryId, item.sku, Number(value));
      setActionSuccess(`Discount updated for SKU ${item.sku}.`);
      setOpenMenuId(null);
      setRefreshKey((current) => current + 1);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Could not set item discount.");
    } finally {
      setDiscountingSku(null);
    }
  }

  if (itemsLoading && !result) {
    return <p role="status">Loading inventory items…</p>;
  }

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
      {actionError && <p className="item-action-error" role="alert">{actionError}</p>}
      {actionSuccess && <p className="item-action-success" role="status">{actionSuccess}</p>}
      <div className="items-table-scroll">
        <table className="items-table">
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Price</th>
              <th scope="col">Discounted price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Shelf</th>
              <th scope="col">Added</th>
              <th scope="col">Alert</th>
              <th scope="col"><span className="visually-hidden">Tools</span></th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((item) => {
              const rowId = `${item.inventory_id}-${item.sku}`;
              return (
                <tr key={rowId}>
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
                  <td>{item.original_price == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(item.original_price))}</td>
                  <td>{item.discount_price == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(item.discount_price))}</td>
                  <td>{item.quantity}</td>
                  <td>{item.shelf ?? "—"}</td>
                  <td>{item.time_added ?? "—"}</td>
                  <td>{item.time_alert ?? "—"}</td>
                  <td className="items-actions-cell">
                    <button
                      className="item-tools-trigger"
                      type="button"
                      aria-label={`Tools for SKU ${item.sku}`}
                      aria-haspopup="menu"
                      aria-expanded={openMenuId === rowId}
                      onClick={() => setOpenMenuId((current) => current === rowId ? null : rowId)}
                    >
                      ⋯
                    </button>
                    {openMenuId === rowId && (
                      <div className="item-tools-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="item-tools-action"
                          disabled={discountingSku === item.sku || removingSku === item.sku}
                          onClick={() => void setDiscount(item)}
                        >
                          {discountingSku === item.sku ? "Setting discount…" : "Set discount"}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="item-tools-remove"
                          disabled={removingSku === item.sku || discountingSku === item.sku}
                          onClick={() => void removeItem(item.sku)}
                        >
                          {removingSku === item.sku ? "Removing…" : "Remove item"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
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
