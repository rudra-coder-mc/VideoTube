import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.models";
import { deleteImageFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { isValidEmail, isValidPassword } from "../utils/validation";


type MulterFile = Express.Multer.File

interface FileRequest extends Request {
  files: {
    avatar: MulterFile[]; // Use the MulterFile type
    coverImage?: MulterFile[]; // Optional
  };
}

// Your registerUser function remains unchanged
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  // Type assertion for req
  const typedReq = req as FileRequest; // Assert the type of req

  const { username, email, fullName, password } = typedReq.body;

  // Validate request body
  if (!username || !email || !fullName || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // Validate email
  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  // Validate password
  if (!isValidPassword(password)) {
    throw new ApiError(400, "Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character");
  }

  // Check for existing user
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    throw new ApiError(400, "User with the same username or email already exists");
  }

  if (!typedReq.files?.avatar) {
    throw new ApiError(400, "avater is required")
  }

  console.log(typedReq.files?.avatar[0]?.path)
  console.log(typedReq.files?.coverImage?.[0]?.path)
  // Access files safely
  const avatarLocalPath = typedReq.files?.avatar[0]?.path; // Accessing files with typedReq
  const coverImageLocalPath = typedReq.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  let coverImageUrl = "";
  let coverImageResponse;
  if (coverImageLocalPath) {
    coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

    coverImageUrl = coverImageResponse?.url || "";
  }

  const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
  const avatarUrl = avatarResponse?.url;

  // Create the user
  const user = await User.create({
    username,
    email,
    fullName,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl,
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    if (avatarResponse) await deleteImageFromCloudinary(avatarResponse.public_id)
    if (coverImageResponse) await deleteImageFromCloudinary(coverImageResponse.public_id)

    throw new ApiError(500, "Something went wrong while registering the user and imags were deleted");
  }

  res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };
