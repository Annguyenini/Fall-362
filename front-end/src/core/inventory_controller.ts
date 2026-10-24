import { InventoryStock } from '../data-shapes/inventory-stock'
import * as API from './API/api'

class InventoryController{
  // this class will manage calling backend feature related to a specific InventoryController
  //
  //
  async getInventoryData(inventory_id: string) {

  }
  async getInventoryItems(inventory_id: string) {
    try {
      const response = await fetch(API.GET_ITEMS_FROM_INVENTORY_API(inventory_id), ({
        method: "GET"
      }))
      const data = await response.json()
      console.log(data)
      if (response.status != 200 || !data) {
        return {
          "data": null,
          "error": "Failed to get items"
        }
      }
      return {
        "data": data,
        "error": null
      }
    }
    catch (err) {
      throw err
    }
  }

  async insertItemToInventory(stock: InventoryStock) {
    if (!stock) throw new Error("Stock could not be null")
    console.log(stock)
    const response = await fetch(API.INSERT_ITEM_TO_INVENTORY_API(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:JSON.stringify(stock)
    })
    const data = await response.json()
    console.log(data)
    if (response.status >= 300 || !data) {
      return {
        "data": null,
        "error":"Failed to insert item"
      }
    }
    return {
      "data": data,
      "error":null
    }
  }

}
export default new InventoryController()
