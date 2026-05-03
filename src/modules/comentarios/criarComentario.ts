import { Request, Response } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { getIO } from '@socket/index'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

import type { ICriarComentario } from './types'

export const criarComentario = async (req: Request<{}, {}, ICriarComentario>, res: Response): Promise<Response> => {
  try {
    const { CONTEUDO, REFERENCIA_TIPO, REFERENCIA_ID } = req.body
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.body, ['CONTEUDO', 'REFERENCIA_TIPO', 'REFERENCIA_ID'])) {
      return responseBadRequest({ response: res, message: 'Conteúdo, tipo e referência são obrigatórios' })
    }

    const [permissoes] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ALLOW_COMENTAR FROM USER_PERMISSOES WHERE USER_ID = ?`,
      [usuarioId]
    )

    if (!permissoes.length || !permissoes[0].ALLOW_COMENTAR) {
      return responseBadRequest({ response: res, message: 'Sem permissão para comentar' })
    }

    const [result] = await mySqlConn.query<ResultSetHeader>(
      `-- sql
        INSERT INTO COMENTARIOS (USER_ID, REFERENCIA_TIPO, REFERENCIA_ID, CONTEUDO)
        VALUES (?, ?, ?, ?)
      `,
      [usuarioId, REFERENCIA_TIPO, REFERENCIA_ID, CONTEUDO]
    )

    if (REFERENCIA_TIPO === 'POST') {
      await mySqlConn.query(
        `UPDATE POSTS SET CONT_COMENTARIOS = CONT_COMENTARIOS + 1 WHERE ID = ?`,
        [REFERENCIA_ID]
      )

      const [post] = await mySqlConn.query<RowDataPacket[]>(`SELECT USUARIO_ID FROM POSTS WHERE ID = ?`, [REFERENCIA_ID])

      if (post.length && post[0].USUARIO_ID !== usuarioId) {
        await mySqlConn.query(
          `INSERT INTO NOTIFICACOES (USER_ID, TIPO, REFERENCIA_ID, MENSAGEM) VALUES (?, 'comentario_post', ?, ?)`,
          [post[0].USUARIO_ID, REFERENCIA_ID, 'Alguém comentou no seu post']
        )

        const io = getIO()
        io.emit('nova_notificacao', { userId: post[0].USUARIO_ID })
      }
    }

    if (REFERENCIA_TIPO === 'PROBLEMA') {
      await mySqlConn.query(
        `UPDATE PROBLEMAS SET CONT_COMENTARIOS = CONT_COMENTARIOS + 1 WHERE ID = ?`,
        [REFERENCIA_ID]
      )

      const [problema] = await mySqlConn.query<RowDataPacket[]>(`SELECT USUARIO_ID FROM PROBLEMAS WHERE ID = ?`, [REFERENCIA_ID])

      if (problema.length && problema[0].USUARIO_ID !== usuarioId) {
        await mySqlConn.query(
          `INSERT INTO NOTIFICACOES (USER_ID, TIPO, REFERENCIA_ID, MENSAGEM) VALUES (?, 'comentario_problema', ?, ?)`,
          [problema[0].USUARIO_ID, REFERENCIA_ID, 'Alguém comentou no seu problema']
        )

        const io = getIO()
        io.emit('nova_notificacao', { userId: problema[0].USUARIO_ID })
      }
    }

    return responseSuccess({ response: res, payload: { id: result.insertId } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}