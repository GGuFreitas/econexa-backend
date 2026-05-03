import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseError, responseSuccess, responseNotFound } from '@utils/response'

export const deletarCausa = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params

    const [existe] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM CAUSAS WHERE ID = ?`,
      [id]
    )

    if (!existe.length) {
      return responseNotFound({ response: res, message: 'Causa nao encontrada' })
    }

    await mySqlConn.query(`DELETE FROM CAUSAS WHERE ID = ?`, [id])

    return responseSuccess({ response: res, payload: { message: 'Causa deletada com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}