import { Router, type RequestHandler } from 'express'

import auth from '@middleware/auth'
import permissao from '@middleware/permissao'
import { listarCausas } from '@modules/causas/listarCausas'
import { criarCausa } from '@modules/causas/criarCausa'
import { atualizarCausa } from '@modules/causas/atualizarCausa'
import { deletarCausa } from '@modules/causas/deletarCausa'

const router = Router()

router.get('/', listarCausas as RequestHandler)
router.post('/', auth as RequestHandler, permissao('allow_admin') as RequestHandler, criarCausa as RequestHandler)
router.put('/:id', auth as RequestHandler, permissao('allow_admin') as RequestHandler, atualizarCausa as RequestHandler<any>)
router.delete('/:id', auth as RequestHandler, permissao('allow_admin') as RequestHandler, deletarCausa as RequestHandler<any>)

export default router