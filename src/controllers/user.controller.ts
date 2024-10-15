import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";



const registerUser = asyncHandler(async (req: Request, res: Response) => {

  if (!req.body) {
    res.status(400).json(new ApiError(400, "request body is undefine"))
  }

  const { username, email, fullName, password } = req.body

  if (username == "") {
    res.status(400).json(new ApiError(400, "username is require, it shoud not ne emty"))
  } else if (username == "") {
    res.status(400).json(new ApiError(400, "username is require, it shoud not ne emty"))
  }

})


export {
  registerUser
}
