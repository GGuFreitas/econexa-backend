import { Request, Response } from 'express'
import type { ResultSetHeader } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

import type { ICriarCausa } from './types'

export const criarCausa = async (req: Request<{}, {}, ICriarCausa>, res: Response): Promise<Response> => {
  try {
    const { NOME, DESCRICAO, COR, ICONE, TIPO } = req.body

    if (isEmpty(req.body, ['NOME'])) {
      return responseBadRequest({ response: res, message: 'Nome é obrigatório' })
    }

    const [result] = await mySqlConn.query<ResultSetHeader>(
      `-- sql
        INSERT INTO CAUSAS (NOME, DESCRICAO, COR, ICONE, TIPO, ATIVO)
        VALUES (?, ?, ?, ?, ?, TRUE)
      `,
      [NOME, DESCRICAO ?? null, COR ?? '#4CAF50', ICONE ?? 'leaf', TIPO ?? 'LOCAL']
    )

    return responseSuccess({ response: res, payload: { id: result.insertId } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}