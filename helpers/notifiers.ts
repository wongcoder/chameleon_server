import { Game, GameMessage } from "../models/gameModels"

export const GAME_ERROR = "game_error"
export const LOBBY_MESSAGE = "lobby_message"
export const GAME_START = "game_start"

type EventStreamEventType = "game_error" | "lobby_message" | "game_start"

export function notifyAllListeners(game: Game, message: string, type: EventStreamEventType = LOBBY_MESSAGE) {
  console.log("Pushing the following message out to game particpants in: ", game, "Message: ", message, "Type: ", type)

  let eventType = `event: ${type}\n`
  let data = "data: " + message + "\n\n"

  game.clients.forEach(client => client.response.write(eventType + data))
}

export function notifyAllHandleChameleon(game: Game, message: GameMessage, chameleonIndex: number) {
  console.log("Starting game with chameleonIndex: ", chameleonIndex, "with client length of: ", game.clients.length)
  let chameleonMessage = {...message}
  chameleonMessage.chosenWord = ''

  let eventType = `event: ${GAME_START}\n`
  let data = "data: " + JSON.stringify(message) + "\n\n"

  let chameleonData = "data: " + JSON.stringify(chameleonMessage) + "\n\n"

  game.clients.forEach((client, index) => {
    if (index != chameleonIndex) {
      client.response.write(eventType + data)
    }
    else {
      console.log("sending message to chameleon")
      client.response.write(eventType + chameleonData)
    }
  })
}