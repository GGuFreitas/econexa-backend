import { Router, RequestHandler } from 'express'

import auth from '@middleware/auth'
import { seguirUsuario, dejarDeSeguir, listarSeguidores, listarSeguindo } from '@modules/seguidores/seguir'

const router = Router()

router.post('/:id/seguir', auth as RequestHandler, seguirUsuario as RequestHandler)
router.delete('/:id/seguir', auth as RequestHandler, dejarDeSeguir as RequestHandler)
router.get('/:id/seguidores', listarSeguidores as RequestHandler<any>)
router.get('/:id/seguindo', listarSeguindo as RequestHandler<any>)

export default router