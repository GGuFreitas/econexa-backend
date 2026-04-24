import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isArrayAndNotEmpty from '@utils/isArrayAndNotEmpty'
import { responseError, responseSuccess } from '@utils/response'

import type { IFiltrosQuery } from '../types'
import { formatSqlInValues } from '@utils/formatSqlInValues'

export const listarRegistros = async (req: Request<{}, {}, {}, IFiltrosQuery>, res: Response): Promise<Response> => {
  try {
    const { STATUS, CATEGORIA } = req.query

    const querySql = []

    if (isArrayAndNotEmpty(STATUS)) {
      querySql.push(`STATUS IN (${formatSqlInValues(STATUS)})`)
    }

    if (isArrayAndNotEmpty(CATEGORIA)) {
      querySql.push(`CATEGORIA IN (${formatSqlInValues(CATEGORIA)})`)
    }

    const querySqlString = querySql.length > 0 ? `WHERE ${querySql.join(' AND ')} AND STATUS != 'arquivado'` : `WHERE STATUS != 'arquivado'`

    const [problemas] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT * FROM PROBLEMAS
      ${querySqlString}
      ORDER BY CRIADO_EM DESC
    `)

    return responseSuccess({ response: res, payload: { problemas } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
