import { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { asyncHandler } from "../utils/asyncHandler"
import { Playlist } from "../models/playlist.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body

  if (!name || !description) throw new ApiError(400, 'name and description are required')

  const newPlaylist = await Playlist.create({
    name,
    description,
  })

  if (!newPlaylist) throw new ApiError(400, 'Error while creating playlist')

  return res
    .status(201)
    .json(new ApiResponse(201, newPlaylist, 'playlist created successfully'))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if (!userId) throw new ApiError(400, 'userId is required')

  if (!isValidObjectId(userId)) throw new ApiError(400, 'userId is invalid')

  const playlists = await Playlist.find({ owner: userId })

  if (!playlists) throw new ApiError(400, 'Error while fetching playlists')

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, 'playlists fetched successfully'))

})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!playlistId) throw new ApiError(400, 'playlistId is required')
  if (!isValidObjectId(playlistId)) throw new ApiError(400, 'playlistId is invalid')

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) throw new ApiError(400, 'playlist not found')

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, 'playlist fetched successfully'))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!playlistId || !videoId) throw new ApiError(400, 'playlistId and videoId are required')

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400, 'playlistId and videoId are invalid')

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) throw new ApiError(400, 'playlist not found')

  if (playlist.videos.includes(videoId)) throw new ApiError(400, 'video already in playlist')

  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    $push: { videos: videoId }
  })

  if (!updatedPlaylist) throw new ApiError(400, 'Error while updating playlist')

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'video added to playlist successfully'))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params

  if (!playlistId || !videoId) throw new ApiError(400, 'playlistId and videoId are required')

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) throw new ApiError(400, 'playlistId and videoId are invalid')

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) throw new ApiError(400, 'playlist not found')

  if (!playlist.videos.includes(videoId)) throw new ApiError(400, 'video not in playlist')

  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    $pull: { videos: videoId }
  })

  if (!updatedPlaylist) throw new ApiError(400, 'Error while updating playlist')

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'video removed from playlist successfully'))

})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  if (!playlistId) throw new ApiError(400, 'playlistId is required')

  if (!isValidObjectId(playlistId)) throw new ApiError(400, 'playlistId is invalid')

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) throw new ApiError(400, 'playlist not found')

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

  if (!deletedPlaylist) throw new ApiError(400, 'Error while deleting playlist')

  return res
    .status(200)
    .json(new ApiResponse(200, deletedPlaylist, 'playlist deleted successfully'))

})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body

  if (!playlistId) throw new ApiError(400, 'playlistId is required')

  if (!isValidObjectId(playlistId)) throw new ApiError(400, 'playlistId is invalid')

  const playlist = await Playlist.findById(playlistId)

  if (!playlist) throw new ApiError(400, 'playlist not found')

  const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
    name,
    description
  })

  if (!updatedPlaylist) throw new ApiError(400, 'Error while updating playlist')

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, 'playlist updated successfully'))

})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
}
