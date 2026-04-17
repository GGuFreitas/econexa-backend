import { Router, RequestHandler } from 'express'

import auth from '@middleware/auth'
import permissao from '@middleware/permissao'
import { 
  criarProblema, 
  listarProblemas, 
  listarProximos, 
  apoiarProblema, 
  removerApoio,
  deletarProblema 
} from '@modules/mapa/service'

const router = Router()

// Públicas (qualquer um pode ver)
router.get('/', listarProblemas as RequestHandler)
router.get('/proximos', listarProximos as RequestHandler)

// Protegidas (requer login)
router.post('/', auth, criarProblema as RequestHandler)
router.delete('/:id', auth, deletarProblema as RequestHandler)

// Apoiar/remover apoio (requer permissão)
router.post('/:id/apoiar', auth, apoiarProblema as RequestHandler)
router.delete('/:id/apoiar', auth, removerApoio as RequestHandler)

export default router