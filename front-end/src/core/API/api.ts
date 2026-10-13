export const BASE_API ="http://localhost:8000"

export const GET_ITEMS_FROM_INVENTORY_API = (inventory_id:string) => {
  return `${BASE_API}/inventory/${inventory_id}/items`
}
