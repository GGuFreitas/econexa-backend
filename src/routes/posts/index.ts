import { Router, RequestHandler } from 'express'

import auth from '@middleware/auth'
import permissao from '@middleware/permissao'
import { listarPosts } from '@modules/posts/listarPosts'
import { criarPost } from '@modules/posts/criarPost'
import { atualizarPost } from '@modules/posts/atualizarPost'
import { deletarPost } from '@modules/posts/deletarPost'
import { curtirPost } from '@modules/posts/interacoes/curtirPost'
import { descurtirPost } from '@modules/posts/interacoes/descurtirPost'
import { salvarPost } from '@modules/posts/interacoes/salvarPost'
import { desSalvarPost } from '@modules/posts/interacoes/desSalvarPost'
import { listarPostsSalvos } from '@modules/posts/interacoes/listarPostsSalvos'

const router = Router()

router.get('/', listarPosts as RequestHandler)
router.get('/salvos', auth as RequestHandler, listarPostsSalvos as RequestHandler)

router.post('/', auth as RequestHandler, permissao('allow_post') as RequestHandler, criarPost as RequestHandler)
router.put('/:id', auth as RequestHandler, atualizarPost as RequestHandler<any>)
router.delete('/:id', auth as RequestHandler, deletarPost as RequestHandler<any>)

router.post('/:id/curtir', auth as RequestHandler, permissao('allow_curtir') as RequestHandler, curtirPost as RequestHandler)
router.delete('/:id/curtir', auth as RequestHandler, descurtirPost as RequestHandler)

router.post('/:id/salvar', auth as RequestHandler, salvarPost as RequestHandler)
router.delete('/:id/salvar', auth as RequestHandler, desSalvarPost as RequestHandler)

export default router