import { ObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { CustomUser, user } from "../type.js";
// import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req: CustomUser, _, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    // console.log(token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { _id: ObjectId }

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken") as user

    if (!user) {

      throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user;
    next()
  } catch (error: unknown) {
    const e = error as Error
    throw new ApiError(401, e?.message || "Invalid access token")
  }

})
