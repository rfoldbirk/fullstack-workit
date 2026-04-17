import 'dotenv/config'
import express, { application, Router } from 'express'
import usersRouter from './routes/users'


const app = express()
app.use(express.json())


// api endpoints :)
const api = Router()
api.use('/users', usersRouter)


app.use('/api', api);

app.listen(process.env.PORT, () =>
  console.log(`Server ready at: http://localhost:${process.env.PORT}`))
