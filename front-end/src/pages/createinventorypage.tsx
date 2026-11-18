import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import inventoryController from "../core/inventory_controller";
import "../styles/home.css";
import "../styles/createinventory.css";

export default function CreateInventoryPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!location.trim()) {
      setError("Enter a location for the inventory.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await inventoryController.createInventory(location.trim());
      navigate("/home#inventories");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Could not create inventory.");
      setSaving(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/home">Inventory</Link>
        <nav aria-label="Main">
          <NavLink to="/home">Home</NavLink>
          <NavLink to="/create-inventory">Create inventory</NavLink>
        </nav>
      </header>

      <main className="inv-main">
        <h1>Create inventory</h1>

        <form className="create-form" onSubmit={handleSubmit}>
          <label htmlFor="inv-location">Location</label>
          <input
            id="inv-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Main warehouse"
            autoFocus
          />

          <p className="status-msg" role="alert">{error}</p>

          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create inventory"}
            </button>
            <Link className="btn btn-secondary" to="/home">Cancel</Link>
          </div>
        </form>
      </main>
    </>
  );
}