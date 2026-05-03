import { Router, RequestHandler } from 'express'

import auth from '@middleware/auth'
import permissao from '@middleware/permissao'
import { listarComentarios } from '@modules/comentarios/listarComentarios'
import { criarComentario } from '@modules/comentarios/criarComentario'

const router = Router()

router.get('/', listarComentarios as RequestHandler)
router.post('/', auth as RequestHandler, permissao('allow_comentar') as RequestHandler, criarComentario as RequestHandler)

export default router