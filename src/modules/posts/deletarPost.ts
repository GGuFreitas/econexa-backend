import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseError, responseSuccess, responseNotFound } from '@utils/response'

export const deletarPost = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    const [existe] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM POSTS WHERE ID = ? AND USUARIO_ID = ?`,
      [id, usuarioId]
    )

    if (!existe.length) {
      return responseNotFound({ response: res, message: 'Post não encontrado ou não pertence ao usuário' })
    }

    await mySqlConn.query(`DELETE FROM POST_IMAGENS WHERE POST_ID = ?`, [id])
    await mySqlConn.query(`DELETE FROM POST_CURTIDAS WHERE POST_ID = ?`, [id])
    await mySqlConn.query(`DELETE FROM POST_SALVOS WHERE POST_ID = ?`, [id])
    await mySqlConn.query(`DELETE FROM COMENTARIOS WHERE REFERENCIA_TIPO = 'POST' AND REFERENCIA_ID = ?`, [id])
    await mySqlConn.query(`DELETE FROM POSTS WHERE ID = ?`, [id])

    await mySqlConn.query(`UPDATE USERS SET CONT_POSTS = CONT_POSTS - 1 WHERE ID = ?`, [usuarioId])

    return responseSuccess({ response: res, payload: { message: 'Post deletado com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}