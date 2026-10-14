export type InventoryStock = {
  inventory_id: string;
  sku: number;
  batch_id: number;
  quantity: number;
  shelf: string | null;
  time_added: string | null;
  time_alert: string | null;
};
