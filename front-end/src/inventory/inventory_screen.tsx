import { useEffect, useState, type ComponentType } from "react";
import "../styles/inventory.css";
import ItemsTool from "./tools/items_tool";

type ToolProps = {
  inventoryId: string;
};

type InventoryTool = {
  name: string;
  label: string;
  component: ComponentType<ToolProps>;
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
    // const data = inventory_controller.getInventoryData(inventory_id);

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
      component: ItemsTool,
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
            <selectedTool.component inventoryId={inventory_id} />
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
