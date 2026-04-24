import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'

export const removerApoio = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'Erro de parâmetro ausente.' })
    }

    const [apoio] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT ID FROM APOIADORES WHERE PROBLEMA_ID = ? AND USER_ID = ?
      `,
      [id, usuarioId],
    )

    if (!apoio.length) {
      return responseBadRequest({ response: res, message: 'Apoio não encontrado' })
    }

    await mySqlConn.query(
      `-- sql
        DELETE FROM APOIADORES WHERE PROBLEMA_ID = ? AND USER_ID = ?
      `,
      [id, usuarioId],
    )

    await mySqlConn.query(
      `-- sql
        UPDATE PROBLEMAS SET CONT_APOIOS = GREATEST(CONT_APOIOS - 1, 0) WHERE ID = ?
      `,
      [id],
    )

    await mySqlConn.query(
      `-- sql
        UPDATE USERS SET CONT_APOIOS_DADOS = GREATEST(CONT_APOIOS_DADOS - 1, 0) WHERE ID = ?
      `,
      [usuarioId],
    )

    return responseSuccess({ response: res, payload: { message: 'Apoio removido com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}