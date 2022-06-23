export interface GameResponseObject {
  word: string,
  chameleon: number,
  wordList: Array<string>,
  errorMessage?: string,
}

// replace this with a database in the future but i'm fuckiing lazy
const topics = new Map()
const foodTestWords = ["pizza", "potatoes", "fish"]
topics.set("food", foodTestWords)

export function startGame(topic: string, numPlayers: number): GameResponseObject {
  let wordList = topics.get(topic)

  return {
    word: selectWord(wordList),
    chameleon: Math.floor(Math.random() * numPlayers),
    wordList
  }
}

export function selectWord(topicWordList: Array<string>): string {
  return topicWordList[Math.floor(Math.random() * topicWordList.length)]
}