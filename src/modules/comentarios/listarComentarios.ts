import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseError, responseSuccess } from '@utils/response'

import type { IFiltrosComentariosQuery } from './types'

export const listarComentarios = async (req: Request<{}, {}, {}, IFiltrosComentariosQuery>, res: Response): Promise<Response> => {
  try {
    const { tipo, referenciaId } = req.query

    if (!tipo || !referenciaId) {
      return responseSuccess({ response: res, payload: { comentarios: [] } })
    }

    const [comentarios] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        c.*,
        u.NOME as USER_NOME,
        u.FOTO as USER_FOTO
      FROM COMENTARIOS c
      LEFT JOIN USERS u ON c.USER_ID = u.ID
      WHERE c.REFERENCIA_TIPO = ? AND c.REFERENCIA_ID = ?
      ORDER BY c.CRIADO_EM ASC
    `, [tipo, referenciaId])

    return responseSuccess({ response: res, payload: { comentarios } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}