export type InventoryStock = {
  inventory_id: string;
  sku: number;
  quantity: number;
  shelf: string;
  time_added?: string | null;
  time_alert: string | null;
  title?: string;
  original_price?: number;
  discount_percent?: number;
  discount_price?: number;
};
