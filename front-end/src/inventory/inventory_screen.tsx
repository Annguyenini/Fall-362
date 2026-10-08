import { useEffect, useState } from "react";
import "../styles/inventory.css";
import inventory_controller from "../core/inventory_controller";

type ToolProps = {
  inventoryId: string;
};

type InventoryTool = {
  name: string;
  label: string;
  render: (props: ToolProps) => React.ReactNode;
};

type Inventory = {
  id: string;
  name: string;
  description?: string;
  itemCount?: number;
};

export function InventoryScreen({
  inventory_id,
}: {
  inventory_id: string;
}) {
  const [tools, setTools] = useState<InventoryTool[]>([]);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const [inventory, setInventory] = useState<Inventory | null>(null);

  // Load inventory data
  useEffect(() => {
    const data = inventory_controller.getInventoryData(inventory_id);

  }, [inventory_id]);

  // Universal function for adding tools
  const addTool = (tool: InventoryTool) => {
    setTools((current) => [...current, tool]);
  };

  // Register tools
  useEffect(() => {
    addTool({
      name: "items",
      label: "Items",
      render: ({ inventoryId }) => {
        // const items =
        //   inventory_controller.getInventoryItems(inventoryId);

        return (
          <div>
            <h2>Items</h2>
            <p>Inventory ID: {inventoryId}</p>

            {/*{items.map((item: any) => (
              <div key={item.id}>
                {item.name}
              </div>
            ))}*/}
          </div>
        );
      },
    });
  }, []);

  const selectedTool = tools.find(
    (tool) => tool.name === activeTool
  );

  return (
    <div className="inventory-screen">

      {/* TOP INVENTORY PANEL */}
      <header className="inventory-header">
        <div className="inventory-header-main">
          <div>
            <span className="inventory-label">
              INVENTORY
            </span>

            <h1>
              {inventory?.name ?? "Loading..."}
            </h1>

            {inventory?.description && (
              <p>{inventory.description}</p>
            )}
          </div>

          <div className="inventory-id">
            <span>ID</span>
            <strong>{inventory_id}</strong>
          </div>
        </div>

        <div className="inventory-stats">
          <div className="inventory-stat">
            <span>Items</span>
            <strong>
              {inventory?.itemCount ?? "—"}
            </strong>
          </div>

          <div className="inventory-stat">
            <span>Status</span>
            <strong>Active</strong>
          </div>
        </div>
      </header>

      {/* BOTTOM CONTENT */}
      <div className="inventory-content">

        {/* LEFT */}
        <aside className="inventory-tools">
          {tools.map((tool) => (
            <button
              key={tool.name}
              className={`tool-button ${
                activeTool === tool.name ? "active" : ""
              }`}
              onClick={() => setActiveTool(tool.name)}
            >
              {tool.label}
            </button>
          ))}
        </aside>

        {/* RIGHT */}
        <main className="inventory-result">
          {selectedTool ? (
            selectedTool.render({
              inventoryId: inventory_id,
            })
          ) : (
            <div className="empty-result">
              Select a tool
            </div>
          )}
        </main>

      </div>
    </div>
  );
}

export default InventoryScreen;
