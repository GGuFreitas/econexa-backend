import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '@config/database'
import { responseBadRequest, responseError, responseSuccess, responseUnauthorized } from '@utils/response'
import { getIO } from '@socket/index'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@utils/jwt'

export const login = async (req: Request, res: Response) => {
  try {
    const { EMAIL, SENHA } = req.body

    if (!EMAIL || !SENHA) {
      return responseBadRequest({ response: res, message: 'Email e senha são obrigatórios' })
    }

    const [users]: any = await db.query(
      `SELECT * FROM USERS WHERE EMAIL = ? AND STATUS = 'ATIVO'`,
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

    const [permissoes]: any = await db.query(
      `SELECT * FROM USER_PERMISSOES WHERE USER_ID = ?`,
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
    await db.query(
      `INSERT INTO REFRESH_TOKENS (USER_ID, TOKEN, EXPIRA_EM) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
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
    const [tokens]: any = await db.query(
      `SELECT * FROM REFRESH_TOKENS WHERE TOKEN = ? AND EXPIRA_EM > NOW()`,
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
    const [permissoes]: any = await db.query(
      `SELECT * FROM USER_PERMISSOES WHERE USER_ID = ?`,
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
    await db.query(`DELETE FROM REFRESH_TOKENS WHERE TOKEN = ?`, [token])
    await db.query(
      `INSERT INTO REFRESH_TOKENS (USER_ID, TOKEN, EXPIRA_EM) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
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
      // Remove refresh token específico
      await db.query(`DELETE FROM REFRESH_TOKENS WHERE TOKEN = ?`, [token])
    }

    if (userId) {
      // Remove todos os refresh tokens do usuário
      await db.query(`DELETE FROM REFRESH_TOKENS WHERE USER_ID = ?`, [userId])
    }

    return responseSuccess({ response: res, payload: { message: 'Logout realizado' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}