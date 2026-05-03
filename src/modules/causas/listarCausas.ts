import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseError, responseSuccess } from '@utils/response'

export const listarCausas = async (req: Request, res: Response): Promise<Response> => {
  try {
    const [causas] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT * FROM CAUSAS 
      WHERE ATIVO = TRUE 
      ORDER BY NOME ASC
    `)

    return responseSuccess({ response: res, payload: { causas } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}