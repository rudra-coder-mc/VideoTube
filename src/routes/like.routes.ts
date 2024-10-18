import { Router } from 'express'
import {
  getLikedVideos,
  toggleCommentLink,
  toggleVideoLink,
  toggleTweetLink,
} from '../controllers/like.controller'
import { verifyJWT } from '../middlewares/auth.middleware'

const router = Router()

router.use(verifyJWT) // Apply verifyJWT middleware to all routes in this file

router.route('/toggle/v/:videoId').post(toggleVideoLink)
router.route('/toggle/c/:commentId').post(toggleCommentLink)
router.route('/toggle/t/:tweetId').post(toggleTweetLink)
router.route('/videos').get(getLikedVideos)

export default router
