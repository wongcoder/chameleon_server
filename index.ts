import express from 'express'
import ws from 'ws'


const app = express()
const port = 3000

app.get('/' , (_req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
  console.log('Express app now fully operational')
})