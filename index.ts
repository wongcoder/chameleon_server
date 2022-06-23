import express from 'express'
import cors from 'cors'
import { startGame } from './game/game'
import { GameClient, Game, GameMessage } from './models/gameModels'
import { notifyAllHandleChameleon, notifyAllListeners } from './helpers/notifiers'
import { EVENT_STREAM_HEADERS, SERVER_PORT } from './constants/expressConstants'
import { getClientIds } from './helpers/clientId'

const app = express()

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
    notifyAllListeners(tempGame, "return to lobby")
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
    notifyAllHandleChameleon(tempGame, gameObject, gameResponse.chameleon)
    tempGame.isActive = true

    activeGames.set(sessionId, tempGame)
  }
})

// Event stream that broadcasts users joined. If it sends a game start message, the eventstream will be forcefully closed.
// Clients are expected to join the game id.
app.get('/join-lobby/:id', (req, res) => {
  let sessionId = req.params.id
  let tempGame = activeGames.get(sessionId)
  let clientId = Date.now()
  res.writeHead(200, EVENT_STREAM_HEADERS)

  if (tempGame != null) {
    tempGame.clients.push({clientId: clientId, response: res})

    req.on('close', () => {
      if (tempGame != null) {
        tempGame.clients = tempGame.clients.filter(client => client.clientId != clientId)

        // if game is empty, remove it
        if (tempGame.clients.length == 0) {
          activeGames.delete(sessionId)
        } else {
          activeGames.set(sessionId, tempGame)
          notifyAllListeners(tempGame, JSON.stringify(getClientIds(tempGame.clients)))
        }
      }
    })

    activeGames.set(sessionId, tempGame)
    notifyAllListeners(tempGame, JSON.stringify(getClientIds(tempGame.clients)))
  }
  else {
    res.write("event: game_error\ndata: Attempted to join invalid session.\n\n")
    res.send()
  }
})


app.post('/create-game/:id', (req, res) => {
  let game = { 
    clients: [],
    hostKey: 'ABC',
    isActive: false
  }

  let sessionId = req.params.id
  if (activeGames.has(sessionId)) {
    res.sendStatus(401)
  } else {
    activeGames.set(sessionId, game)
    console.log(activeGames)
    // Ideally, host should provide a handshake with create-game, generating a UUID that's stored on the server.
    // At the moment, the server provides the host a UUID.
    res.json({hostKey: game.hostKey, sessionId})
  }

})

app.listen(SERVER_PORT, () => {
  console.log('Chameleon server is now running.')
})

