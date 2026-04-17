import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import db from '@config/database'
import { responseError, responseSuccess } from '@utils/response'

export const register = async (req: Request, res: Response) => {
  try {
    const { NOME, EMAIL, SENHA } = req.body

    const hash = await bcrypt.hash(SENHA, 10)

    const [result]: any = await db.query(
      `INSERT INTO USERS (NOME, EMAIL, SENHA, TIPO)
      VALUES (?, ?, ?, ?)`,
      [NOME, EMAIL, hash, 'COMUM']
    )

    await db.query(
      `INSERT INTO USER_PERMISSOES (USER_ID) VALUES (?)`,
      [result.insertId]
    )

    return responseSuccess({ response: res, payload: { message: 'Usuário criado' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}