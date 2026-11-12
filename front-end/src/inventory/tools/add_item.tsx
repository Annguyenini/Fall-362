import { useEffect, useState } from "react";
import type { CatalogItem } from "../../core/inventory_controller";
import inventory_controller from "../../core/inventory_controller";
import type { InventoryStock } from "../../data-shapes/inventory-stock";

type AddItemProps = {
  inventoryId: string;
};

const shelfOptions = [
  "Unassigned",
  "A-01", "A-02", "A-03", "A-04", "A-05",
  "B-01", "B-02", "B-03", "B-04",
  "C-01", "C-02", "C-03", "C-04",
  "D-01", "D-02", "D-03", "D-04",
  "E-01", "E-02", "E-03",
];

export default function AddItem({ inventoryId }: AddItemProps) {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedSku, setSelectedSku] = useState("");
  const [requestAddItime,setRequestAddItem]= useState<CatalogItem|null>(null)
  const [quantity, setQuantity] = useState("0");
  const [shelf, setShelf] = useState("Unassigned");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    inventory_controller.getAllItems()
      .then((items) => { if (!cancelled) setCatalogItems(items); })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load catalog items.");
        }
      })
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function addItem(item: CatalogItem) {
    const quantityNumber = Number(quantity);
    if (!shelf || shelf === "Unassigned") {
      const confirm = window.confirm(
        `shelf wasn't set, the default will be set to: ${shelf}`,
      );
      if (!confirm) {
        setSelectedSku("");
        return;
      }
    }
    if (!Number.isSafeInteger(quantityNumber) || quantityNumber < 1) {
      setError("Quantity must be a positive whole number.");
      setSelectedSku("");
      return;
    }

    const confirmed = window.confirm(
      `Add ${quantityNumber} ${item.title} (SKU ${item.sku}) to this inventory on shelf ${shelf}? If it is already here, its quantity will increase by ${quantityNumber}.`,
    );
    if (!confirmed) {
      setSelectedSku("");
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);
    const stock: InventoryStock = {
      inventory_id: inventoryId,
      sku: item.sku,
      quantity: quantityNumber,
      shelf,
      time_alert: null,
    };

    try {
      const response = await inventory_controller.insertItemToInventory(stock);
      if (response.error || !response.data) {
        setError(response.error ?? "Could not add item.");
        return;
      }
      setSuccess(`${item.title} was added to this inventory.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setLoading(false);
      setSelectedSku("");
    }
  }

  function handleSelection(skuValue: string) {
    setSelectedSku(skuValue);
    const item = catalogItems.find((catalogItem) => catalogItem.sku === Number(skuValue));
    if (item) {
      setRequestAddItem(item)
    }
    else {
      setRequestAddItem(null)
      setSelectedSku("");
    }
  }
  function handleSubmition() {
    if (requestAddItime)void addItem(requestAddItime);
  }
  return (
    <main className="add-item-page">
      <div className="add-item-card">
        <header className="add-item-header">
          <h1>Add Inventory Item</h1>
          <p>Choose a catalog item, quantity, and shelf for this inventory.</p>
          <p><strong>Inventory ID:</strong> {inventoryId}</p>
        </header>

        <div className="add-item-form-content">
          <div className="add-stock-options">
            <label htmlFor="inventory-item-quantity">
              Quantity
              <input
                id="inventory-item-quantity"
                type="number"
                min="0"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={loading}
              />
            </label>
            <label htmlFor="inventory-item-shelf">
              Shelf
              <input onChange={(e)=>setShelf(e.target.value)}>

              </input>
            </label>
          </div>

          <label className="catalog-item-select-label" htmlFor="catalog-item-select">
            Catalog item
          </label>
          <select
            id="catalog-item-select"
            className="catalog-item-select"
            value={selectedSku}
            onChange={(event) => handleSelection(event.target.value)}
            disabled={catalogLoading || loading || catalogItems.length === 0}
          >
            <option value="">
              {catalogLoading ? "Loading catalog…" : catalogItems.length ? "Select an item…" : "No catalog items available"}
            </option>
            {catalogItems.map((item) => (
              <option key={item.sku} value={item.sku}>
                {item.title} · SKU {item.sku} · {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(item.price)}
              </option>
            ))}
          </select>
          <p className="catalog-item-hint">
            Selecting an item asks you to confirm the quantity and shelf before adding it.
          </p>

          {loading && <p role="status" className="form-status">Adding item…</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {success && <p className="form-success" role="status">{success}</p>}
          <div className="add-item-actions">
            <button
              type="button"
              onClick={handleSubmition}
              disabled={catalogLoading || loading || !requestAddItime}
            >
              {loading ? "Adding…" : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
