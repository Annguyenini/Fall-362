export const BASE_API ="http://localhost:8000"

export const GET_INVENTORIES_API = () => `${BASE_API}/inventories`;

export const GET_ITEM_API = (sku: number) => `${BASE_API}/item/${sku}`;

export const GET_ALL_ITEMS_API = () => `${BASE_API}/items`;

export const CREATE_ITEM_API = () => `${BASE_API}/item`;

export const DELETE_ITEM_API = (sku: number) => `${BASE_API}/item/${sku}`;

export const GET_ITEMS_FROM_INVENTORY_API = (inventory_id:string) => {
  return `${BASE_API}/inventory/${inventory_id}/items`
}
export const INSERT_ITEM_TO_INVENTORY_API = () => {
  return `${BASE_API}/inventory`
}
