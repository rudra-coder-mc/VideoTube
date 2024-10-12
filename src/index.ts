import { log } from "console";
import { app } from "./app";
import dotenv from 'dotenv'

dotenv.config({
  path: "./.env"
})



const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  console.log("request to /")
  res.send("welcome to my backend")
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

