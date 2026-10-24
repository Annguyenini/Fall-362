export const BASE_API ="http://localhost:8000"

export const GET_ITEMS_FROM_INVENTORY_API = (inventory_id:string) => {
  return `${BASE_API}/inventory/${inventory_id}/items`
}
export const INSERT_ITEM_TO_INVENTORY_API = () => {
  return `${BASE_API}/inventory`
}
