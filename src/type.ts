import { Request } from "express";
import mongoose, { ObjectId } from "mongoose";

interface user {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  watchHistory: ObjectId[];
}


interface IUser extends Document {
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  watchHistory: mongoose.Types.ObjectId[];
  password: string;
  refreshToken?: string;

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

interface CustomUser extends Request {
  user: user;
}


interface FileRequest extends Request {
  files: {
    avatar: Express.Multer.File[];
    coverImage?: Express.Multer.File[];
  };
}


export { IUser, CustomUser, FileRequest, user }
