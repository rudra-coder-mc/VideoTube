import { Router } from "express";
import healthcheck from "../controllers/healthcheck.controler";


const router = Router();




router.route('/ok').get((req, res) => {
  res.send("pk")
})

router.route('/',).get(healthcheck)

export default router
