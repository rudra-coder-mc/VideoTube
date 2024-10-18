import { Router } from 'express'
import healthcheck from '../controllers/healthcheck.controler'

const router = Router()

router.route('/').get(healthcheck)

export default router
