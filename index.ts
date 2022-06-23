import express from 'express'
import ws from 'ws'
import cors from 'cors'


const app = express()
const port = 3000

// state manager
let activeGames = new Map<string, Game>()

interface GameClient {
  clientId: number,
  response?: any
}

// game object
interface Game {
  clients: Array<GameClient>,
  hostKey: string,
  isActive: boolean
}

const EVENT_STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache'
}

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


app.get('/game-start/:id', (req, res) => {
  let sessionId = req.params.id
  let tempGame = activeGames.get(sessionId)

  if (tempGame != null) { 
    notifyAllListeners(sessionId, "gamestart")
    tempGame.isActive = true

    activeGames.set(sessionId, tempGame)
  }
})

function notifyAllListeners(sessionId: string, message: string) {
  let tempGame = activeGames.get(sessionId)
  console.log("attempting to push this message: ", message)

  if (tempGame != null) { 
    console.log("in pushing mode!")
    tempGame.clients.forEach(client => client.response.write("data: "+ message + '\n\n'))
  }
  else {
    console.log('For some odd reason, you were unsafe and you sent a sessionId that does not exist.')
  }
}

function createClientStrings(clients: Array<GameClient>): string {
  let returnString = ''

  clients.forEach((client, index) => {
    returnString += index + " client " + client.clientId + " "
  })

  return returnString
}


// Event stream that broadcasts users joined. If it sends a game start message, the eventstream will be forcefully closed.
// Clients are expected to join the game id.
app.get('/join-lobby/:id', (req, res) => {
  console.log("Join-lobby Session ID: ", req.params.id)

  let sessionId = req.params.id
  let tempGame = activeGames.get(sessionId)
  let clientId = Date.now()

  if (tempGame != null) {
    res.writeHead(200, EVENT_STREAM_HEADERS)
    res.write("data: you joined\n\n")
    tempGame.clients.push({clientId: clientId, response: res})

    req.on('close', () => {
      console.log(`${clientId} user left`)
      // if (req.body.hostKey == tempGame?.hostKey) {
      //   tempGame?.clients.forEach(client => client.response.status(204).send())
      //   activeGames.delete(sessionId)
      // }
      // else {
        if (tempGame != null) {
          console.log('Removing user')
          tempGame.clients = tempGame.clients.filter(client => client.clientId != clientId)
          console.log('Updating active session Id again')
          activeGames.set(sessionId, tempGame)
          notifyAllListeners(sessionId, createClientStrings(tempGame.clients))
        }
      // }
    })

    activeGames.set(sessionId, tempGame)
    notifyAllListeners(sessionId,createClientStrings(tempGame.clients))
  }
  else {
    res.status(404).send("byebye")
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

