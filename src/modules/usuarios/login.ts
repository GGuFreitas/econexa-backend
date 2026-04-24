import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseBadRequest, responseError, responseSuccess, responseUnauthorized } from '@utils/response'
import { getIO } from '@socket/index'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@utils/jwt'

export const login = async (req: Request, res: Response) => {
  try {
    if (isEmpty(req.body, ['EMAIL', 'SENHA'])) {
      return responseBadRequest({ response: res, message: 'Email e senha são obrigatórios' })
    }

    const { EMAIL, SENHA } = req.body

    const [users] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT * FROM USERS WHERE EMAIL = ? AND STATUS = 'ATIVO'
      `,
      [EMAIL]
    )

    if (!users.length) {
      return responseBadRequest({ response: res, message: 'Usuário não encontrado' })
    }

    const user = users[0]

    const valid = await bcrypt.compare(SENHA, user.SENHA)

    if (!valid) {
      return responseBadRequest({ response: res, message: 'Senha inválida' })
    }

    const [permissoes]: any = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT * FROM USER_PERMISSOES WHERE USER_ID = ?
      `,
      [user.ID]
    )

    const payload = {
      usuario: {
        ID: user.ID,
        NOME: user.NOME
      },
      permissoes: permissoes[0] || {}
    }

    // Gera access token (1 dia) e refresh token (7 dias)
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // Armazena refresh token no banco
    await mySqlConn.query(
      `-- sql
        INSERT INTO REFRESH_TOKENS (USER_ID, TOKEN, EXPIRA_EM) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `,
      [user.ID, refreshToken]
    )

    const io = getIO()

    io.emit('user_logged', {
      userId: user.ID,
      nome: user.NOME
    })

    return responseSuccess({ response: res, payload: { accessToken, refreshToken, user: payload.usuario } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body

    if (!token) {
      return responseBadRequest({ response: res, message: 'Refresh token é obrigatório' })
    }

    // Verifica se o token existe e é válido
    const [tokens]: any = await mySqlConn.query(
      `-- sql
        SELECT * FROM REFRESH_TOKENS WHERE TOKEN = ? AND EXPIRA_EM > NOW()
      `,
      [token]
    )

    if (!tokens.length) {
      return responseUnauthorized({ response: res, message: 'Refresh token inválido ou expirado' })
    }

    // Verifica o token
    const payload = verifyRefreshToken(token)

    if (!payload) {
      return responseUnauthorized({ response: res, message: 'Refresh token inválido' })
    }

    // Busca permissões atualizadas
    const [permissoes]: any = await mySqlConn.query(
      `-- sql
        SELECT * FROM USER_PERMISSOES WHERE USER_ID = ?
      `,
      [payload.usuario.ID]
    )

    const newPayload = {
      usuario: payload.usuario,
      permissoes: permissoes[0] || {}
    }

    // Gera novos tokens
    const accessToken = generateAccessToken(newPayload)
    const newRefreshToken = generateRefreshToken(newPayload)

    // Remove token antigo e insere novo
    await mySqlConn.query(
      `-- sql
        DELETE FROM REFRESH_TOKENS WHERE TOKEN = ?
      `,
      [token]
    )
    await mySqlConn.query(
      `-- sql
        INSERT INTO REFRESH_TOKENS (USER_ID, TOKEN, EXPIRA_EM) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `,
      [payload.usuario.ID, newRefreshToken]
    )

    return responseSuccess({ response: res, payload: { accessToken, refreshToken: newRefreshToken } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body
    const userId = req.conta?.usuario?.ID

    if (token) {
      await mySqlConn.query(
        `-- sql
          DELETE FROM REFRESH_TOKENS WHERE TOKEN = ?
        `,
        [token]
      )
    }

    if (userId) {
      await mySqlConn.query(
        `-- sql
          DELETE FROM REFRESH_TOKENS WHERE USER_ID = ?
        `,
        [userId]
      )
    }

    return responseSuccess({ response: res, payload: { message: 'Logout realizado' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}