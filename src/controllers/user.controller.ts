import { Request, Response, NextFunction } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiError } from '../utils/ApiError'
import { User } from '../models/user.models'
import {
  deleteImageFromCloudinary,
  extractPublicId,
  uploadOnCloudinary,
} from '../utils/cloudinary'
import { ApiResponse } from '../utils/ApiResponse'
import { isValidEmail, isValidPassword } from '../utils/validation'
import jwt from 'jsonwebtoken'
import mongoose, { ObjectId } from 'mongoose'
import { generateTokens } from '../utils/geretateTken'
import { CustomUser, FileRequest } from '../type'

// validation checks
const validateUserInput = (
  username: string,
  email: string,
  password: string,
) => {
  if (!username || !email || !password)
    throw new ApiError(400, 'All fields are required')
  if (!isValidEmail(email)) throw new ApiError(400, 'Invalid email format')
  if (!isValidPassword(password)) {
    throw new ApiError(
      400,
      'Password must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character',
    )
  }
}

// Registration controller
const registerUser = asyncHandler(async (req: FileRequest, res: Response) => {
  const { username, email, fullName, password } = req.body

  validateUserInput(username, email, password)

  const existingUser = await User.findOne({ $or: [{ username }, { email }] })
  if (existingUser) throw new ApiError(400, 'User already exists')

  const avatarPath = req.files?.avatar?.[0]?.path
  const coverImagePath = req.files?.coverImage?.[0]?.path
  if (!avatarPath) throw new ApiError(400, 'Avatar is required')

  const avatarResponse = await uploadOnCloudinary(avatarPath)
  const coverImageResponse = coverImagePath
    ? await uploadOnCloudinary(coverImagePath)
    : null

  if (!avatarResponse) throw new ApiError(400, 'fail to upload on cloudinary ')

  const user = await User.create({
    username,
    email,
    fullName,
    password,
    avatar: avatarResponse.url,
    coverImage: coverImageResponse?.url || '',
  })

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken',
  )
  if (!createdUser) {
    await deleteImageFromCloudinary(avatarResponse.public_id)
    if (coverImageResponse)
      await deleteImageFromCloudinary(coverImageResponse.public_id)
    throw new ApiError(500, 'Error while registering user')
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'))
})

// Login controller
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body
  validateUserInput(username, email, password)

  const user = await User.findOne({ $or: [{ username }, { email }] })
  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(400, 'Invalid credentials')
  }

  const { accessToken, refreshToken } = await generateTokens(user._id)

  res
    .status(200)
    .cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .json(
      new ApiResponse(
        200,
        { username: user.username, email: user.email },
        'Login successful',
      ),
    )
})

// Logout controller
const logoutUser = asyncHandler(async (req: CustomUser, res: Response) => {
  try {
    const userId = req.user._id

    if (!userId) {
      throw new ApiError(401, 'User is not logged in')
    }

    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } })

    res
      .status(200)
      .clearCookie('accessToken', { secure: true, httpOnly: true })
      .clearCookie('refreshToken', { secure: true, httpOnly: true })
      .json({ message: 'User logged out successfully' })
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ message: error.message })
    } else {
      console.error(error)
      res.status(500).json({ message: 'Error logging out user' })
    }
  }
})

// Refresh token controller
const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken = req.cookies.refreshToken
  if (!incomingRefreshToken)
    throw new ApiError(401, 'Refresh token is required')

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET!,
  ) as { _id: ObjectId }
  const user = await User.findById(decodedToken._id)
  if (!user || incomingRefreshToken !== user.refreshToken)
    throw new ApiError(401, 'Invalid refresh token')

  const { accessToken, refreshToken } = await generateTokens(user._id)

  res
    .status(200)
    .cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
    .json(
      new ApiResponse(
        200,
        { accessToken },
        'Access token refreshed successfully',
      ),
    )
})

// change password
const changePassword = asyncHandler(async (req: CustomUser, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, 'user not logedin')
  }

  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user._id)

  if (!user) {
    throw new ApiError(502, ' user not found')
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError(400, 'wrong old password')
  }

  user.password = newPassword

  await user.save()

  res
    .status(200)
    .json(new ApiResponse(200, {}, 'password changed successfully'))
})

// update user details

const updateUserDetails = asyncHandler(
  async (req: CustomUser, res: Response) => {
    const { fullName, username, email } = req.body

    if (!fullName || !username || !email) {
      throw new ApiError(400, 'all fields are required')
    }

    if (!isValidEmail(email)) {
      throw new ApiError(400, 'invalid email')
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      throw new ApiError(502, 'user not found')
    }

    const newUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { fullName, username, email } },
      { new: true },
    ).select('-password -refreshToken')

    res
      .status(200)
      .json(new ApiResponse(200, newUser, 'user details updated successfully'))
  },
)

// update user avatar
const updateUserAvatar = asyncHandler(
  async (req: CustomUser, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'image is required')
    }

    const avatatLocalPath = req.file?.path

    if (!avatatLocalPath) {
      throw new ApiError(400, 'avatar fill is missing')
    }

    const avatar = await uploadOnCloudinary(avatatLocalPath)

    if (!avatar) {
      throw new ApiError(400, 'error while uploading avatar')
    }

    const publicId = extractPublicId(req.user.avatar)
    const deleteImage = await deleteImageFromCloudinary(publicId)

    if (!deleteImage) {
      throw new ApiError(400, 'error while deleting avatar')
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar } },
      { new: true },
    ).select('-password -refreshToken')

    res
      .status(200)
      .json(new ApiResponse(200, { avatar }, 'avatar updated successfully'))
  },
)

// update user cover image

const updateUserCoverImage = asyncHandler(
  async (req: CustomUser, res: Response) => {
    if (!req.file) {
      throw new ApiError(400, 'image is required')
    }

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
      throw new ApiError(400, 'cover image fill is missing')
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage) {
      throw new ApiError(400, 'error while uploading cover image')
    }

    if (req.user.coverImage) {
      const publicId = extractPublicId(req.user.coverImage)
      const deleteImage = await deleteImageFromCloudinary(publicId)

      if (!deleteImage) {
        throw new ApiError(400, 'error while deleting cover image')
      }
    }

    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { coverImage } },
      { new: true },
    ).select('-password -refreshToken')

    res
      .status(200)
      .json(new ApiResponse(200, {}, 'cover image updated successfully'))
  },
)

// get current user

const getCurrentUser = asyncHandler(async (req: CustomUser, res: Response) => {
  if (!req.user) {
    throw new ApiError(400, 'user not logedin')
  }

  res
    .status(200)
    .json(new ApiResponse(200, req.user, 'user fetched successfully'))
})

// get user channel profile

const getUserChannelProfile = asyncHandler(
  async (req: CustomUser, res: Response) => {
    const { username } = req.params

    if (!username) {
      throw new ApiError(400, 'username is required')
    }

    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLocaleLowerCase(),
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'channel',
          as: 'subscribers',
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'subscriber',
          as: 'subscribeTo',
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: '$subscribers',
          },
          channelsSubscribedToCount: {
            $size: '$subscribedTo',
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, '$subscribers.subscriber'] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ])

    if (!channel?.length) {
      throw new ApiError(404, 'channel does not exists')
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, channel[0], 'User channel fetched successfully'),
      )
  },
)

// get wachHistory

const getWatchHistory = asyncHandler(async (req: CustomUser, res: Response) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'user',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
        ],
      },
    },
  ])
})

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changePassword,
  updateUserAvatar,
  updateUserDetails,
  updateUserCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
}
