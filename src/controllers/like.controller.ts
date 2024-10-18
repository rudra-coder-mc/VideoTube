import { Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { Like } from '../models/like.models'
import { CustomUser } from '../type'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'

// toggle video like
const toggleVideoLink = asyncHandler(async (req: CustomUser, res: Response) => {
  const { videoId } = req.params

  const findLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  })

  if (!findLike) {
    const like = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    })

    if (!like) throw new ApiError(400, 'Error while creating like')

    return res
      .status(201)
      .json(new ApiResponse(201, like, 'video liked successfully'))
  }

  const unlike = await Like.findByIdAndDelete(findLike._id)

  if (!unlike) throw new ApiError(400, 'Error while unlike video')

  return res
    .status(200)
    .json(new ApiResponse(200, unlike, 'video unliked successfully'))
})

// toggle comment like
const toggleCommentLink = asyncHandler(
  async (req: CustomUser, res: Response) => {
    const { commentId } = req.params

    const findLike = await Like.findOne({
      comment: commentId,
      likedBy: req.user._id,
    })

    if (!findLike) {
      const like = await Like.create({
        comment: commentId,
        likedBy: req.user._id,
      })

      if (!like) throw new ApiError(400, 'Error while creating like')

      return res
        .status(201)
        .json(new ApiResponse(201, like, 'comment liked successfully'))
    }
    const unlike = await Like.findByIdAndDelete(findLike._id)

    if (!unlike) throw new ApiError(400, 'Error while unlike comment')

    return res
      .status(200)
      .json(new ApiResponse(200, unlike, 'comment unliked successfully'))
  },
)

// toogle tweet like
const toggleTweetLink = asyncHandler(async (req: CustomUser, res: Response) => {
  const { tweetId } = req.params

  const findLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  })

  if (!findLike) {
    const like = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    })
    if (!like) throw new ApiError(400, 'Error while creating like')

    return res
      .status(201)
      .json(new ApiResponse(201, like, 'tweet liked successfully'))
  }

  const unlike = await Like.findByIdAndDelete(findLike._id)

  if (!unlike) throw new ApiError(400, 'Error while unlike tweet')

  return res
    .status(200)
    .json(new ApiResponse(200, unlike, 'tweet unliked successfully'))
})

// get liked videos
const getLikedVideos = asyncHandler(async (req: CustomUser, res: Response) => {
  const likedVideo = await Like.aggregate([
    {
      $match: {
        likedBy: req.user._id,
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video',
        pipeline: [
          {
            $lookup: {
              from: 'users',
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
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              owner: 1,
            },
          },
        ],
      },
    },
  ])

  if (!likedVideo) throw new ApiError(400, 'Error while fetching liked videos')

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideo, 'all liked videos fetched successfully'),
    )
})

export { toggleVideoLink, toggleCommentLink, toggleTweetLink, getLikedVideos }
