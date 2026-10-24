
import { useState, type FormEvent } from "react";
import type { InventoryStock } from "../../data-shapes/inventory-stock";
import inventory_controller from "../../core/inventory_controller";

type AddItemProps = {
  inventoryId: string;
};

export default function AddItem({
  inventoryId,
}: AddItemProps) {
  const [sku, setSku] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [shelf, setShelf] = useState("");
  const [timeAlert, setTimeAlert] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setSuccess(false);

    const skuNumber = Number(sku);
    const batchNumber = Number(batchId);
    const quantityNumber = Number(quantity);

    if (
      !Number.isSafeInteger(skuNumber) ||
      skuNumber < 0 ||
      !Number.isSafeInteger(batchNumber) ||
      batchNumber < 0
    ) {
      setError("SKU and batch ID must be valid non-negative integers.");
      return;
    }

    if (
      !Number.isSafeInteger(quantityNumber) ||
      quantityNumber < 0
    ) {
      setError("Quantity must be a non-negative integer.");
      return;
    }

    const item: InventoryStock = {
      inventory_id: inventoryId,
      sku: skuNumber,
      batch_id: batchNumber,
      quantity: quantityNumber,
      shelf: shelf.trim() || null,
      time_added: new Date().toISOString(),
      time_alert: timeAlert
        ? new Date(timeAlert).toISOString()
        : null,
    };

    try {
      setLoading(true);
      const response = await inventory_controller.insertItemToInventory(item)
      console.log(response)
      if (response.error || !response.data) {
        setSuccess(false);
        setError(response.error)
        return
      }
      setError("")
      setSuccess(true);
      setSku("");
      setBatchId("");
      setQuantity("1");
      setShelf("");
      setTimeAlert("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to add item."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="add-item-page">
      <div className="add-item-card">
        <header className="add-item-header">
          <h1>Add Inventory Item</h1>
          <p>Enter the details for the new stock item.</p>
          <p>
            <strong>Inventory ID:</strong> {inventoryId}
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="add-item-grid">
            <label>
              SKU
              <input
                type="number"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                min="0"
                step="1"
                required
                placeholder="Enter SKU"
              />
            </label>

            <label>
              Batch ID
              <input
                type="number"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                min="0"
                step="1"
                required
                placeholder="Enter batch ID"
              />
            </label>

            <label>
              Quantity
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="1"
                required
              />
            </label>

            <label>
              Shelf
              <input
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                placeholder="e.g. A-01"
              />
            </label>

            <label className="full-width">
              Alert Date & Time (optional)
              <input
                type="datetime-local"
                value={timeAlert}
                onChange={(e) => setTimeAlert(e.target.value)}
              />
            </label>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="form-success" role="status">
              Item added successfully!
            </p>
          )}

          <div className="add-item-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
