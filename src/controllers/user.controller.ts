import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.models";
import { deleteImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { isValidEmail, isValidPassword } from "../utils/validation";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";
import { generateTokens } from "../utils/geretateTken";
import { CustomUser, FileRequest } from "../type";



// Middleware for validation checks
const validateUserInput = (username: string, email: string, password: string) => {
  if (!username || !email || !password) throw new ApiError(400, "All fields are required");
  if (!isValidEmail(email)) throw new ApiError(400, "Invalid email format");
  if (!isValidPassword(password)) {
    throw new ApiError(400, "Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character");
  }
};


// Registration controller
const registerUser = asyncHandler(async (req: FileRequest, res: Response) => {
  const { username, email, fullName, password } = req.body;

  validateUserInput(username, email, password);

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) throw new ApiError(400, "User already exists");

  const avatarPath = req.files?.avatar?.[0]?.path;
  const coverImagePath = req.files?.coverImage?.[0]?.path;
  if (!avatarPath) throw new ApiError(400, "Avatar is required");

  const avatarResponse = await uploadOnCloudinary(avatarPath);
  const coverImageResponse = coverImagePath ? await uploadOnCloudinary(coverImagePath) : null;

  if (!avatarResponse) throw new ApiError(400, 'fail to upload on cloudinary ')

  const user = await User.create({
    username,
    email,
    fullName,
    password,
    avatar: avatarResponse.url,
    coverImage: coverImageResponse?.url || "",
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    await deleteImageFromCloudinary(avatarResponse.public_id);
    if (coverImageResponse) await deleteImageFromCloudinary(coverImageResponse.public_id);
    throw new ApiError(500, "Error while registering user");
  }

  res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
});


// Login controller
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  validateUserInput(username, email, password);

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(400, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  res.status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production" })
    .json(new ApiResponse(200, { username: user.username, email: user.email }, "Login successful"));
});


const logoutUser = asyncHandler(async (req: CustomUser, res: Response) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      throw new ApiError(401, 'User is not logged in');
    }

    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } });

    res.status(200)
      .clearCookie('accessToken', { secure: true, httpOnly: true })
      .clearCookie('refreshToken', { secure: true, httpOnly: true })
      .json({ message: 'User logged out successfully' });

  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error(error);
      res.status(500).json({ message: 'Error logging out user' });
    }
  }
});


// Refresh token controller
const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh token is required");

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET!) as { _id: ObjectId };
  const user = await User.findById(decodedToken._id);
  if (!user || incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Invalid refresh token");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  res.status(200)
    .cookie("accessToken", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === "production" })
    .cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production" })
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed successfully"));
});

export { registerUser, loginUser, refreshAccessToken, logoutUser };
