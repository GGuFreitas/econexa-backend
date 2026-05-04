import { RequestHandler, Router } from 'express'

import auth from '@middleware/auth'
import { alterarSenha } from '@modules/usuarios/alterarSenha'
import { atualizarUsuario, buscarUsuario } from '@modules/usuarios/atualizarUsuario'
import { login, logout, refreshToken } from '@modules/usuarios/login'
import { register } from '@modules/usuarios/register'

const router = Router()

router.post('/login', login as RequestHandler)
router.post('/register', register as RequestHandler)
router.post('/refresh', refreshToken as RequestHandler)
router.post('/logout', auth as RequestHandler, logout as RequestHandler)
router.put('/senha', auth as RequestHandler, alterarSenha as RequestHandler)

router.get('/:id', buscarUsuario as RequestHandler<any>)
router.put('/:id', auth as RequestHandler, atualizarUsuario as RequestHandler<any>)

export default router
