import { Request, Response } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { getIO } from '@socket/index'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

import type { ICriarPost } from './types'

export const criarPost = async (req: Request<{}, {}, ICriarPost>, res: Response): Promise<Response> => {
  try {
    const { TITULO, CONTEUDO, TIPO, CAUSA_ID, CAUSA_NOME, REFERENCIA_TIPO, REFERENCIA_ID, IMAGENS } = req.body
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.body, ['CONTEUDO'])) {
      return responseBadRequest({ response: res, message: 'Conteúdo é obrigatório' })
    }

    const [permissoes] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ALLOW_POST FROM USER_PERMISSOES WHERE USER_ID = ?`,
      [usuarioId]
    )

    if (!permissoes.length || !permissoes[0].ALLOW_POST) {
      return responseBadRequest({ response: res, message: 'Sem permissão para criar post' })
    }

    const [result] = await mySqlConn.query<ResultSetHeader>(
      `-- sql
        INSERT INTO POSTS (TITULO, CONTEUDO, USUARIO_ID, TIPO, CAUSA_ID, CAUSA_NOME, REFERENCIA_TIPO, REFERENCIA_ID, STATUS, CONT_CURTIDAS, CONT_COMENTARIOS, CONT_COMPARTILHAMENTOS)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLICADO', 0, 0, 0)
      `,
      [TITULO ?? null, CONTEUDO, usuarioId, TIPO ?? 'POST', CAUSA_ID ?? null, CAUSA_NOME ?? null, REFERENCIA_TIPO ?? null, REFERENCIA_ID ?? null]
    )

    const postId = result.insertId

    if (IMAGENS && IMAGENS.length > 0) {
      for (let i = 0; i < IMAGENS.length; i++) {
        await mySqlConn.query(
          `INSERT INTO POST_IMAGENS (POST_ID, URL, ORDEM, TIPO) VALUES (?, ?, ?, 'IMAGEM')`,
          [postId, IMAGENS[i], i]
        )
      }
    }

    await mySqlConn.query(
      `UPDATE USERS SET CONT_POSTS = CONT_POSTS + 1 WHERE ID = ?`,
      [usuarioId]
    )

    const io = getIO()
    io.emit('novo_post', { id: postId })

    return responseSuccess({ response: res, payload: { id: postId } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}