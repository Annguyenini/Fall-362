import { Link, NavLink } from "react-router-dom";
import "./home.css";

// Sample data for now. Swap for backend data later.
const lowStock = [
  { id: 1, name: "Item 1", category: "category 1", quantity: 0, reorderLevel: 25 },
  { id: 2, name: "Item 2", category: "category 2", quantity: 4, reorderLevel: 20 },
  { id: 3, name: "Item 3", category: "category 3", quantity: 6, reorderLevel: 15 },
  { id: 4, name: "Item 4", category: "category 4", quantity: 9, reorderLevel: 12 },
];

const summary = { total: 0, low: 0, out: 0, categories: 0 };

export default function Home() {
  return (
    <>
<header className="site-header">
  <Link className="brand" to="/home">Inventory</Link>
  <nav aria-label="Main">
    <NavLink to="/home">Home</NavLink>
    <NavLink to="/inventory">Inventory</NavLink>
  </nav>
</header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>Inventory Management</h1>
            <p>Track stock levels, catch low items early, and keep every count in one place.</p>
            <div className="actions">
              <Link className="btn btn-primary" to="/inventory">View inventory</Link>
              <Link className="btn btn-secondary" to="/add-item">Add an item</Link>
            </div>
          </div>

          <aside className="stock-board" aria-labelledby="board-title">
            <h2 id="board-title">Needs restocking</h2>
            <ul className="board-list">
              {lowStock.map((item) => (
                <li key={item.id}>
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-meta">{item.category} - reorder at {item.reorderLevel}</div>
                  </div>
                  <div className={`qty${item.quantity === 0 ? " out" : ""}`}>
                    {item.quantity === 0 ? "Out" : `${item.quantity} left`}
                  </div>
                </li>
              ))}
            </ul>
            <Link className="board-link" to="/inventory?filter=low">See all low stock</Link>
          </aside>
        </section>

        <section className="summary" aria-label="Inventory summary">
          <dl>
            <div><dt>Total items</dt><dd>{summary.total}</dd></div>
            <div><dt>Low stock</dt><dd>{summary.low}</dd></div>
            <div><dt>Out of stock</dt><dd>{summary.out}</dd></div>
            <div><dt>Categories</dt><dd>{summary.categories}</dd></div>
          </dl>
        </section>
      </main>

      <footer className="site-footer"><p>StockRoom inventory system</p></footer>
    </>
  );
}
