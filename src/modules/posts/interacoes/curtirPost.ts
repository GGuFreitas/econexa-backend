import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { getIO } from '@socket/index'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

export const curtirPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'ID do post é obrigatório' })
    }

    const [permissoes] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ALLOW_CURTIR FROM USER_PERMISSOES WHERE USER_ID = ?`,
      [usuarioId]
    )

    if (!permissoes.length || !permissoes[0].ALLOW_CURTIR) {
      return responseBadRequest({ response: res, message: 'Sem permissão para curtir' })
    }

    const [jaCurtiu] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM POST_CURTIDAS WHERE POST_ID = ? AND USER_ID = ?`,
      [id, usuarioId]
    )

    if (jaCurtiu.length) {
      return responseBadRequest({ response: res, message: 'Você já curtiu este post' })
    }

    await mySqlConn.query(
      `INSERT INTO POST_CURTIDAS (POST_ID, USER_ID) VALUES (?, ?)`,
      [id, usuarioId]
    )

    await mySqlConn.query(
      `UPDATE POSTS SET CONT_CURTIDAS = CONT_CURTIDAS + 1 WHERE ID = ?`,
      [id]
    )

    const [post] = await mySqlConn.query<RowDataPacket[]>(`SELECT USUARIO_ID FROM POSTS WHERE ID = ?`, [id])

    if (post.length && post[0].USUARIO_ID !== usuarioId) {
      await mySqlConn.query(
        `INSERT INTO NOTIFICACOES (USER_ID, TIPO, REFERENCIA_ID, MENSAGEM) VALUES (?, 'curtida_post', ?, ?)`,
        [post[0].USUARIO_ID, id, 'Alguém curtiu seu post']
      )

      const io = getIO()
      io.emit('nova_notificacao', { userId: post[0].USUARIO_ID })
    }

    return responseSuccess({ response: res, payload: { message: 'Post curtido com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}