import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { CustomUser } from '../type'
import { Response } from 'express'
import { Comment } from '../models/comment.models'

const getVideoComments = asyncHandler(
  async (req: CustomUser, res: Response) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const comments = await Comment.aggregate([
      {
        $match: { video: new mongoose.Types.ObjectId(videoId) },
      },
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
        $project: {
          content: 1,
          createdAt: 1,
          owner: { $arrayElemAt: ['$owner', 0] },
        },
      },
      {
        $skip: (Number(page) - 1) * Number(limit),
      },
      {
        $limit: Number(limit),
      },
    ])

    if (!comments) throw new ApiError(404, 'No comments found')

    if (comments.length > 0) {
      const totalComments = await Comment.countDocuments({
        video: new mongoose.Types.ObjectId(videoId),
      })
      const totalPages = Math.ceil(totalComments / Number(limit))
      return res
        .status(200)
        .json(new ApiResponse(200, { comments, totalComments, totalPages }))
    }
  },
)

const addComment = asyncHandler(async (req: CustomUser, res: Response) => {
  const { content } = req.body

  if (!content) throw new ApiError(400, 'content is required')
  if (!req.params.videoId) throw new ApiError(400, 'videoId is required')

  const newComment = await Comment.create({
    content,
    video: req.params.videoId,
    owner: req.user._id,
  })

  if (!newComment) throw new ApiError(400, 'Error while creating comment')

  return res
    .status(201)
    .json(new ApiResponse(201, newComment, 'comment created successfully'))
})

const updateComment = asyncHandler(async (req: CustomUser, res: Response) => {
  const { content } = req.body

  if (!content) throw new ApiError(400, 'content is required')

  if (!req.params.commentId) throw new ApiError(400, 'commentId is required')

  const newComment = await Comment.findByIdAndUpdate(req.params.commentId, {
    content,
  })

  if (!newComment) throw new ApiError(400, 'Error while updating comment')

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, 'comment updated successfully'))
})

const deleteComment = asyncHandler(async (req: CustomUser, res: Response) => {
  if (!req.params.commentId) throw new ApiError(400, 'commentId is required')

  const comment = await Comment.findById(req.params.commentId)

  if (!comment) throw new ApiError(400, 'comment not found')

  if (comment.owner.toString() !== req.user._id.toString())
    throw new ApiError(400, 'You are not authorized to delete this comment')

  const deletedComment = await Comment.findByIdAndDelete(comment._id)

  if (!deletedComment) throw new ApiError(400, 'Error while deleting comment')

  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, 'comment deleted successfully'))
})

export { getVideoComments, addComment, updateComment, deleteComment }
