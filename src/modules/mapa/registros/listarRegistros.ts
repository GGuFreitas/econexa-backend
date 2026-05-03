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
      querySql.push(`p.STATUS IN (${formatSqlInValues(STATUS)})`)
    }

    if (isArrayAndNotEmpty(CATEGORIA)) {
      querySql.push(`p.CATEGORIA IN (${formatSqlInValues(CATEGORIA)})`)
    }

    const querySqlString = querySql.length > 0 ? `WHERE ${querySql.join(' AND ')} AND p.STATUS != 'arquivado'` : `WHERE p.STATUS != 'arquivado'`

    const [problemas] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        p.*,
        u.NOME as USUARIO_NOME,
        u.FOTO as USUARIO_FOTO,
        GROUP_CONCAT(pi.URL ORDER BY pi.ORDEM) as IMAGENS
      FROM PROBLEMAS p
      LEFT JOIN USERS u ON p.USUARIO_ID = u.ID
      LEFT JOIN PROBLEMA_IMAGENS pi ON p.ID = pi.PROBLEMA_ID
      ${querySqlString}
      GROUP BY p.ID
      ORDER BY p.CRIADO_EM DESC
    `)

    return responseSuccess({ response: res, payload: { problemas } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
