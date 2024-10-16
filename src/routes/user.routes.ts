
import { Router } from "express";
import { loginUser, refreshAccessToken, registerUser } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middlewares";

const router = Router();


router.route('/register').post(upload.fields([
  {
    name: "avatar",
    maxCount: 1
  },
  {
    name: "coverImage",
    maxCount: 1
  }
]), registerUser)

router.route('/login').post(loginUser)


router.route('refreshTokon').get(refreshAccessToken)

export default router
