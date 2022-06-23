import { Response } from 'express'

export interface GameClient {
  clientId: number,
  response: Response
}

export interface Game {
  clients: Array<GameClient>,
  hostKey: string,
  isActive: boolean
}

export interface GameMessage {
  wordList: Array<string>,
  chosenWord: string
}