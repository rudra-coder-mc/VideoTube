import { log } from "console";
import { app } from "./app";
import connectDB from "./db";


connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
  })
  .catch((err: Error) => {
    console.log("MONGO db connection failed !!! ", err);
  })
