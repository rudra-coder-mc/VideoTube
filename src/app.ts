import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import healthcheckRoute from './routes/healthcheck.routes'
import usetRoute from './routes/user.routes'
import cookieParser from 'cookie-parser'
import errorHandler from './middlewares/error.middleware'

const app = express()

dotenv.config({
  path: './.env',
})

// Middleware
app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true, limit: '16kb' }))
app.use(express.static('public'))
app.use(cookieParser())

app.use(
  cors({
    origin: process.env.CORS_ORIGIN!,
    credentials: true,
  }),
)

app.use('/api/v1/healthcheck', healthcheckRoute)

app.use('/api/v1/users', usetRoute)

app.use(errorHandler)
export { app }
