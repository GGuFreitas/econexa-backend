import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

export const descurtirPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'ID do post é obrigatório' })
    }

    const [jaCurtiu] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM POST_CURTIDAS WHERE POST_ID = ? AND USER_ID = ?`,
      [id, usuarioId]
    )

    if (!jaCurtiu.length) {
      return responseBadRequest({ response: res, message: 'Você ainda não curtiu este post' })
    }

    await mySqlConn.query(
      `DELETE FROM POST_CURTIDAS WHERE POST_ID = ? AND USER_ID = ?`,
      [id, usuarioId]
    )

    await mySqlConn.query(
      `UPDATE POSTS SET CONT_CURTIDAS = CONT_CURTIDAS - 1 WHERE ID = ?`,
      [id]
    )

    return responseSuccess({ response: res, payload: { message: 'Post descurtido com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}