import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, NavLink } from "react-router-dom";
import inventoryController, { type CatalogItem } from "../core/inventory_controller";
import "../styles/home.css";

export default function ItemsManagementPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSku, setDeletingSku] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    let cancelled = false;
    inventoryController.getAllItems()
      .then((data) => { if (!cancelled) setItems(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load items.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) =>
      item.title.toLowerCase().includes(normalizedQuery) || String(item.sku).includes(normalizedQuery),
    );
  }, [items, query]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const skuNumber = Number(sku);
    const priceNumber = Number(price);
    const itemTitle = title.trim();
    if (!Number.isSafeInteger(skuNumber) || skuNumber < 0) {
      setError("SKU must be a non-negative whole number.");
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("Price must be a non-negative number.");
      return;
    }
    if (!itemTitle) {
      setError("Item name is required.");
      return;
    }

    setSaving(true);
    try {
      const createdItem = await inventoryController.createCatalogItem({
        sku: skuNumber,
        title: itemTitle,
        price: priceNumber,
      });
      setItems((current) => [...current, createdItem].sort((a, b) => a.sku - b.sku));
      setSku("");
      setTitle("");
      setPrice("");
      setNotice(`${createdItem.title} was added.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not add item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: CatalogItem) {
    if (!window.confirm(`Delete ${item.title} (SKU ${item.sku})?`)) return;
    setError(null);
    setNotice(null);
    setDeletingSku(item.sku);
    try {
      await inventoryController.deleteCatalogItem(item.sku);
      setItems((current) => current.filter((currentItem) => currentItem.sku !== item.sku));
      setNotice(`${item.title} was deleted.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not delete item.");
    } finally {
      setDeletingSku(null);
    }
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/home">Inventory</Link>
        <nav aria-label="Main">
          <NavLink to="/home">Home</NavLink>
          <NavLink to="/home#inventories">Inventory</NavLink>
          <NavLink to="/items">Items</NavLink>
        </nav>
      </header>

      <main className="items-management-page">
        <div className="items-management-heading">
          <div>
            <p className="items-eyebrow">CATALOG</p>
            <h1>Items</h1>
            <p>Manage the products available to your inventories.</p>
          </div>
          <span className="items-count">{items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>

        <section className="item-create-card" aria-labelledby="add-catalog-item-title">
          <h2 id="add-catalog-item-title">Add an item</h2>
          <form className="item-create-form" onSubmit={handleAdd}>
            <label>
              SKU
              <input type="number" min="0" step="1" required value={sku} onChange={(event) => setSku(event.target.value)} placeholder="e.g. 100021" />
            </label>
            <label>
              Item name
              <input type="text" required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Wireless Mouse" />
            </label>
            <label>
              Price
              <input type="number" min="0" step="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0.00" />
            </label>
            <button className="items-primary-button" type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add item"}
            </button>
          </form>
        </section>

        {error && <p className="items-feedback items-feedback-error" role="alert">{error}</p>}
        {notice && <p className="items-feedback items-feedback-success" role="status">{notice}</p>}

        <section className="catalog-section" aria-labelledby="catalog-title">
          <div className="catalog-toolbar">
            <div>
              <h2 id="catalog-title">Item catalog</h2>
              <p>Search by item name or SKU.</p>
            </div>
            <label className="catalog-search">
              <span className="visually-hidden">Search items</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search items…" />
            </label>
          </div>

          {loading && <p className="items-empty" role="status">Loading items…</p>}
          {!loading && !error && items.length === 0 && <p className="items-empty">No catalog items yet. Add one above.</p>}
          {!loading && !error && items.length > 0 && visibleItems.length === 0 && <p className="items-empty">No items match “{query}”.</p>}
          {!loading && items.length > 0 && visibleItems.length > 0 && (
            <div className="catalog-table-scroll">
              <table className="catalog-table">
                <thead>
                  <tr><th scope="col">SKU</th><th scope="col">Item</th><th scope="col">Price</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.sku}>
                      <td className="catalog-sku">{item.sku}</td>
                      <td>{item.title}</td>
                      <td>{new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(item.price)}</td>
                      <td className="catalog-actions">
                        <button type="button" className="items-delete-button" onClick={() => void handleDelete(item)} disabled={deletingSku === item.sku}>
                          {deletingSku === item.sku ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

    </>
  );
}
