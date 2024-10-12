import express from 'express';
import cors from 'cors'

const app = express();

// Middleware
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN!,
  credentials: true
}))


export { app }
