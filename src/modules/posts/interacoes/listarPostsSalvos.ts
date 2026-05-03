import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseError, responseSuccess } from '@utils/response'

export const listarPostsSalvos = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioId = req.conta.usuario.ID

    const [posts] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        p.*,
        u.NOME as USUARIO_NOME,
        u.FOTO as USUARIO_FOTO,
        c.NOME as CAUSA_NOME,
        GROUP_CONCAT(pi.URL ORDER BY pi.ORDEM) as IMAGENS
      FROM POST_SALVOS ps
      INNER JOIN POSTS p ON ps.POST_ID = p.ID
      LEFT JOIN USERS u ON p.USUARIO_ID = u.ID
      LEFT JOIN CAUSAS c ON p.CAUSA_ID = c.ID
      LEFT JOIN POST_IMAGENS pi ON p.ID = pi.POST_ID
      WHERE ps.USER_ID = ?
      GROUP BY p.ID
      ORDER BY ps.CRIADO_EM DESC
    `, [usuarioId])

    return responseSuccess({ response: res, payload: { posts } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}