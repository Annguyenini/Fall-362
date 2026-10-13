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
}
export default new InventoryController()
