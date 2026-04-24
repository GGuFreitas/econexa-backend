import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import type { ResultSetHeader } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'

export const register = async (req: Request, res: Response) => {
  try {
    if (isEmpty(req.body, ['NOME', 'EMAIL', 'SENHA'])) {
      return responseBadRequest({ response: res, message: 'Nome, email e senha são obrigatórios' })
    }

    const { NOME, EMAIL, SENHA } = req.body

    const hash = await bcrypt.hash(SENHA, 10)

    const [result] = await mySqlConn.query<ResultSetHeader>(
      `-- sql
        INSERT INTO USERS (NOME, EMAIL, SENHA, TIPO)
        VALUES (?, ?, ?, ?)
      `,
      [NOME, EMAIL, hash, 'COMUM']
    )

    await mySqlConn.query(
      `-- sql
        INSERT INTO USER_PERMISSOES (USER_ID) VALUES (?)
      `,
      [result.insertId]
    )

    return responseSuccess({ response: res, payload: { message: 'Usuário criado com sucesso!' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}