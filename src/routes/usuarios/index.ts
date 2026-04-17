import { Router, RequestHandler } from 'express'

import auth from '@middleware/auth'
import { login, refreshToken, logout } from '@modules/usuarios/login'
import { register } from '@modules/usuarios/register'

const router = Router()

router.post('/login', login as RequestHandler)
router.post('/register', register as RequestHandler)
router.post('/refresh', refreshToken as RequestHandler)
router.post('/logout', auth, logout as RequestHandler)

export default router