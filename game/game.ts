interface GameResponseObject {
  word: string
  chameleon: number
  errorMessage?: string
}

// replace this with a database in the future but i'm fuckiing lazy
const topics = new Map()
const foodTestWords = ["pizza", "potatoes", "fish"]
topics.set("food", foodTestWords)

function startGame(topic: string, numPlayers: number): GameResponseObject {
  let wordList = topics.get(topic)
  if (wordList == null) {
    return {
      word: "dude",
      chameleon: Math.random() * numPlayers,
      errorMessage: "Wrong topic"
    }
  }
  return {
    word: wordList.selectWord(wordList),
    chameleon: Math.random() * numPlayers
  }
}

function selectWord(topicWordList: Array<string>): string {
  return topicWordList[Math.floor(Math.random() * topicWordList.length)]
}