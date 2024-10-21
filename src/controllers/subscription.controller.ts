import { isValidObjectId } from 'mongoose'
import { ApiError } from '../utils/ApiError'
import { ApiResponse } from '../utils/ApiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { CustomUser } from '../type'
import { Response } from 'express'
import { Subscription } from '../models/subscription.models'

const toggleSubscription = asyncHandler(
  async (req: CustomUser, res: Response) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId))
      throw new ApiError(400, 'Invalid channelId')

    const subscription = await Subscription.findOne({
      channel: channelId,
      subscriber: req.user._id,
    })

    if (!subscription) {
      const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: req.user._id,
      })
      if (!newSubscription) throw new ApiError(400, 'Error while subscribing')

      return res
        .status(201)
        .json(new ApiResponse(201, newSubscription, 'subscribed successfully'))
    }

    const unsubscribe = await Subscription.findByIdAndDelete(subscription._id)

    if (!unsubscribe) throw new ApiError(400, 'Error while unsubscribing')

    return res
      .status(200)
      .json(new ApiResponse(200, unsubscribe, 'unsubscribed successfully'))
  },
)

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(
  async (req: CustomUser, res: Response) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId))
      throw new ApiError(400, 'Invalid channelId')

    // return subscribers list of channel
    // const subscription = await Subscription.find({ channel: channelId })
    const subscription = await Subscription.aggregate([
      { $match: { channel: channelId } },
      { $lookup: { from: 'users', localField: 'subscriber', foreignField: '_id', as: 'subscriber' } },
    ])

    if (!subscription) throw new ApiError(400, 'channel not found')

    return res
      .status(200)
      .json(
        new ApiResponse(200, subscription, 'subscribers fetched successfully'),
      )
  },
)

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(
  async (req: CustomUser, res: Response) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId))
      throw new ApiError(400, 'Invalid subscriberId')

    // const subscription = await Subscription.find({ subscriber: subscriberId })
    const subscription = await Subscription.aggregate([
      { $match: { subscriber: subscriberId } },
      { $lookup: { from: 'users', localField: 'channel', foreignField: '_id', as: 'channel' } },
    ])

    if (!subscription) throw new ApiError(400, 'user not found')

    return res
      .status(200)
      .json(new ApiResponse(200, subscription, 'channels fetched successfully'))
  },
)

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }
