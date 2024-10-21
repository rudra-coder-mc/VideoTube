import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { CustomUser } from '../type'
import { Response } from 'express'
import { Tweet } from '../models/tweet.models'

// create tweet
const createTweet = asyncHandler(async (req: CustomUser, res: Response) => {
  const { content } = req.body

  if (!content) throw new ApiError(400, 'content is required')

  if (!req.user) throw new ApiError(400, 'user not logedin')

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  })

  if (!tweet) throw new ApiError(400, 'Error while creating tweet')

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, 'tweet created successfully'))
})

// get user tweets
const getUserTweets = asyncHandler(async (req: CustomUser, res: Response) => {
  if (!req.user) throw new ApiError(400, 'user not logedin')

  const tweets = await Tweet.find({ owner: req.user._id })

  if (!tweets) throw new ApiError(400, 'tweets not found')

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, 'tweets found successfully'))
})

// update tweet
const updateTweet = asyncHandler(async (req: CustomUser, res: Response) => {
  const { content } = req.body

  if (!content) throw new ApiError(400, 'content is required')

  if (!req.params.tweetId) throw new ApiError(400, 'tweetId is required')

  const tweet = await Tweet.findById(req.params.tweetId)

  if (!tweet) throw new ApiError(400, 'tweet not found')

  if (tweet.owner.toString() !== req.user._id.toString())
    throw new ApiError(400, 'You are not authorized to update this tweet')

  const UpdatedTweet = await Tweet.findByIdAndUpdate(req.params.tweetId, {
    content,
  })

  if (!UpdatedTweet) throw new ApiError(400, 'Error while updating tweet')

  return res
    .status(200)
    .json(new ApiResponse(200, UpdatedTweet, 'tweet updated successfully'))
})

// delete tweet
const deleteTweet = asyncHandler(async (req: CustomUser, res: Response) => {
  if (!req.params.tweetId) throw new ApiError(400, 'tweetId is required')

  const tweet = await Tweet.findById(req.params.tweetId)

  if (!tweet) throw new ApiError(400, 'tweet not found')

  if (tweet.owner.toString() !== req.user._id.toString())
    throw new ApiError(400, 'You are not authorized to delete this tweet')

  const deletedTweet = await Tweet.findByIdAndDelete(req.params.tweetId)

  if (!deletedTweet) throw new ApiError(400, 'Error while deleting tweet')

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, 'tweet deleted successfully'))
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
