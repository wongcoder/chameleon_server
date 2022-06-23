import { GameClient } from "../models/gameModels"

export function getClientIds(clients: Array<GameClient>): Array<number> {

  let clientArray: Array<number> = []

  clients.forEach((client) => {
    clientArray.push(client.clientId)
  })

  return clientArray
}