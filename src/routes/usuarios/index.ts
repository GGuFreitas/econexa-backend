import { Router, RequestHandler } from 'express'

import auth from '@middleware/auth'
import { login, refreshToken, logout } from '@modules/usuarios/login'
import { register } from '@modules/usuarios/register'
import { atualizarUsuario, buscarUsuario } from '@modules/usuarios/atualizarUsuario'

const router = Router()

router.post('/login', login as RequestHandler)
router.post('/register', register as RequestHandler)
router.post('/refresh', refreshToken as RequestHandler)
router.post('/logout', auth as RequestHandler, logout as RequestHandler)

router.get('/:id', buscarUsuario as RequestHandler<any>)
router.put('/:id', auth as RequestHandler, atualizarUsuario as RequestHandler<any>)

export default router