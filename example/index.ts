import express, { Request, Response as ExpressResponse } from "express"
import axios from 'axios'
import expressQueueMiddleware from "../index"

const app = express()
const port = 3000

app.use(expressQueueMiddleware({concurrency: 1}))

app.get('/', (req: Request, res: ExpressResponse) => {
  setTimeout(() => {
    res.send('Hello World!')
  }, 1000);
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

setInterval(() => {
  axios.get(`http://localhost:${port}`).then((res) => {
    console.log(res.data);
  })
}, 100)