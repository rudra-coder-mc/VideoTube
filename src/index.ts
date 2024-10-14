import { log } from "console";
import { app } from "./app";
import dotenv from 'dotenv'
import connectDB from "./db";

dotenv.config({
  path: "./.env"
})

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
  })
  .catch((err: Error) => {
    console.log("MONGO db connection failed !!! ", err);
  })
