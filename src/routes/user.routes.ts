
import { Router } from "express";
import { registerUser } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middlewares";

const router = Router();


router.route('/register').get(upload.fields([
  {
    name: "avtare",
    maxCount: 1
  },
  {
    name: "coverImage",
    maxCount: 1
  }
]), registerUser)

export default router
