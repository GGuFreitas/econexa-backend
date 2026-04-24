import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseError, responseSuccess } from '@utils/response'

interface FiltrosQuery {
  STATUS?: string
  CATEGORIA?: string
}

const STATUS_PERMITIDOS = ['pendente', 'em_tratamento', 'resolvido']
const CATEGORIAS_VALIDAS = ['rua', 'escola', 'saude', 'transporte', 'meio_ambiente', 'outro']

export const listarRegistros = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { STATUS, CATEGORIA } = req.query as FiltrosQuery

    let query = `-- sql
      SELECT * FROM PROBLEMAS WHERE STATUS != 'arquivado'
    `
    const params: string[] = []

    if (!isEmpty(STATUS as any) && STATUS_PERMITIDOS.includes(STATUS)) {
      query += ' AND STATUS = ?'
      params.push(STATUS)
    }

    if (!isEmpty(CATEGORIA as any) && CATEGORIAS_VALIDAS.includes(CATEGORIA)) {
      query += ' AND CATEGORIA = ?'
      params.push(CATEGORIA)
    }

    query += ' ORDER BY CRIADO_EM DESC'

    const [problemas] = await mySqlConn.query<RowDataPacket[]>(query, params)

    return responseSuccess({ response: res, payload: { problemas } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
