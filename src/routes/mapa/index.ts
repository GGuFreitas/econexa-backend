import { Router, RequestHandler } from 'express'
import auth from '@middleware/auth'
import permissao from '@middleware/permissao'
import { criarRegistro } from '@modules/mapa/registros/criarRegistro'
import { listarRegistros } from '@modules/mapa/registros/listarRegistros'
import { listarProximos } from '@modules/mapa/registros/listarProximos'
import { deletarRegistro } from '@modules/mapa/registros/deletarRegistro'
import { apoiarProblema } from '@modules/mapa/apoio/apoiarProblema'
import { removerApoio } from '@modules/mapa/apoio/removerApoio'

const router = Router()

router.get('/', listarRegistros as RequestHandler)
router.get('/proximos', listarProximos as RequestHandler)

router.post('/', auth as RequestHandler, permissao('allow_criar_problema') as RequestHandler, criarRegistro as RequestHandler)
router.delete('/:id', auth as RequestHandler, deletarRegistro as RequestHandler)
router.post('/:id/apoiar', auth as RequestHandler, permissao('allow_apoiar_problema') as RequestHandler, apoiarProblema as RequestHandler)
router.delete('/:id/apoiar', auth as RequestHandler, removerApoio as RequestHandler)

export default router
