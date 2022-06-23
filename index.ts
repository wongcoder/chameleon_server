import express from 'express'
import ws from 'ws'
import cors from 'cors'
import { Response } from 'express'

import { startGame } from './game/game'

// Typing
interface GameClient {
  clientId: number,
  response: Response
}

interface Game {
  clients: Array<GameClient>,
  hostKey: string,
  isActive: boolean
}

interface GameMessage {
  wordList: Array<string>,
  chosenWord: string
}

const GAME_ERROR = "game_error"
const LOBBY_MESSAGE = "lobby_message"
const GAME_START = "game_start"

type EventStreamEventType = "game_error" | "lobby_message" | "game_start"


const EVENT_STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache'
}

function notifyAllListeners(sessionId: string, message: string, type: EventStreamEventType = LOBBY_MESSAGE) {
  let tempGame = activeGames.get(sessionId)

  if (tempGame != null) { 
    console.log("Pushing the following message out to game particpants in: ", tempGame, "Message: ", message, "Type: ", type)

    let eventType = `event: ${type}\n`
    let data = "data: " + message + "\n\n"

    tempGame.clients.forEach(client => client.response.write(eventType + data))
  }
  else {
    console.log('For some odd reason, you were unsafe and you sent a sessionId that does not exist.')
  }
}

function notifyAllHandleChameleon(sessionId: string, message: GameMessage, chameleonIndex: number) {
  let tempGame = activeGames.get(sessionId)

  if (tempGame != null) {
    console.log("Starting game with chameleonIndex: ", chameleonIndex, "with client length of: ", tempGame.clients.length)
    let chameleonMessage = {...message}
    chameleonMessage.chosenWord = ''

    let eventType = `event: ${GAME_START}\n`
    let data = "data: " + JSON.stringify(message) + "\n\n"

    let chameleonData = "data: " + JSON.stringify(chameleonMessage) + "\n\n"

    tempGame.clients.forEach((client, index) => {
      if (index != chameleonIndex) {
        client.response.write(eventType + data)
      }
      else {
        console.log("sending message to chameleon")
        client.response.write(eventType + chameleonData)
      }
    })
  }
}

function createClientStrings(clients: Array<GameClient>): string {
  let clientArray: Array<number> = []
  
  clients.forEach((client, index) => {
    clientArray.push(client.clientId)
  })

  return JSON.stringify(clientArray)
}

const app = express()
const port = 3000

// state manager
let activeGames = new Map<string, Game>()

app.use(cors())

app.get('/status', (_req, res) => {
  activeGames.forEach((game, key) => { 
    console.log("Game: ",  key, "Length: ", game.clients.length)
  })

  res.send(200)
})

app.get('/finish-game/:id', (req, res) => {
  let sessionId = req.params.id
  let tempGame = activeGames.get(sessionId)

  if (tempGame != null) {
    notifyAllListeners(sessionId, "return to lobby")
    tempGame.isActive = false
  }

  res.sendStatus(200)
})

app.get('/game-start/:id', (req, _res) => {
  let sessionId = req.params.id
  let tempGame = activeGames.get(sessionId)

  if (tempGame != null) { 

    let gameResponse = startGame("food", tempGame.clients.length)
    let gameObject: GameMessage = {
      wordList: gameResponse.wordList,
      chosenWord: gameResponse.word
    }
    notifyAllHandleChameleon(sessionId, gameObject, gameResponse.chameleon)
    tempGame.isActive = true

    activeGames.set(sessionId, tempGame)
  }
})

// Event stream that broadcasts users joined. If it sends a game start message, the eventstream will be forcefully closed.
// Clients are expected to join the game id.
app.get('/join-lobby/:id', (req, res) => {
  console.log("Join-lobby Session ID: ", req.params.id)
  let sessionId = req.params.id
  let tempGame = activeGames.get(sessionId)
  let clientId = Date.now()
  res.writeHead(200, EVENT_STREAM_HEADERS)

  if (tempGame != null) {
    res.write("data: you joined\n\n")
    tempGame.clients.push({clientId: clientId, response: res})

    req.on('close', () => {
      console.log(`${clientId} user left`)
      if (tempGame != null) {
        console.log('Removing clientId', clientId)
        tempGame.clients = tempGame.clients.filter(client => client.clientId != clientId)

        if (tempGame.clients.length == 0) {
          console.log("Deleting game")
          activeGames.delete(sessionId)
        } else {
          activeGames.set(sessionId, tempGame)
          notifyAllListeners(sessionId, createClientStrings(tempGame.clients))
        }
      }
    })

    activeGames.set(sessionId, tempGame)
    notifyAllListeners(sessionId,createClientStrings(tempGame.clients))
  }
  else {
    res.write("event: game_error\ndata: Attempted to join invalid session.\n\n")
    res.send()
  }
})

app.post('/create-game', (_req, res) => {
  let game = { 
    clients: [],
    hostKey: 'ABC',
    isActive: false
  }

  // initialize route in map
  // let sessionId = "TEST" + Math.floor(Math.random() * 999)
  let sessionId = 'AMOGUS'
  activeGames.set(sessionId, game)
  console.log(activeGames)
  // should be to return the lobby code that they need to join, along with their given clientId
  res.json({hostKey: game.hostKey, sessionId})
})

app.listen(port, () => {
  console.log('Express app now fully operational')
})

