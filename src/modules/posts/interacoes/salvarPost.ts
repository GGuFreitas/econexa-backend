import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

export const salvarPost = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'ID do post é obrigatório' })
    }

    const [jaSalvo] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM POST_SALVOS WHERE POST_ID = ? AND USER_ID = ?`,
      [id, usuarioId]
    )

    if (jaSalvo.length) {
      return responseBadRequest({ response: res, message: 'Post já está salvo' })
    }

    await mySqlConn.query(
      `INSERT INTO POST_SALVOS (POST_ID, USER_ID) VALUES (?, ?)`,
      [id, usuarioId]
    )

    return responseSuccess({ response: res, payload: { message: 'Post salvo com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}