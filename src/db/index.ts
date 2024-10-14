import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDB = async () => {
  try {
    const connectionInfo = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`\n MongoDB connected !! DB HOST: ${connectionInfo.connection.host}`);

  } catch (error) {
    console.error("error :: connecting to database", error)
    process.exit(1)
  }
}

export default connectDB
