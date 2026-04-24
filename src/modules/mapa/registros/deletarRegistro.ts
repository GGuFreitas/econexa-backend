import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

export const deletarRegistro = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'Erro de parâmetro ausente.' })
    }

    const [problemas] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT USUARIO_ID FROM PROBLEMAS WHERE ID = ?
      `,
      [id],
    )

    if (!problemas.length) {
      return responseBadRequest({ response: res, message: 'Registro não encontrado' })
    }

    if (problemas[0].USUARIO_ID !== usuarioId) {
      return responseBadRequest({ response: res, message: 'Apenas o criador pode deletar' })
    }

    await mySqlConn.query(
      `-- sql
        DELETE FROM PROBLEMAS WHERE ID = ?
      `,
      [id],
    )

    return responseSuccess({ response: res, payload: { message: 'Registro deletado com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
