import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.SECRET_KEY || 'access_secret_econexa'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret_econexa'

interface TokenPayload {
  usuario: {
    ID: number
    NOME: string
  }
  permissoes: Record<string, boolean>
}

// Gera access token (1 dia)
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1d' })
}

// Gera refresh token (7 dias)
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

// Verifica access token
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, ACCESS_SECRET) as TokenPayload
  } catch {
    return null
  }
}

// Verifica refresh token
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as TokenPayload
  } catch {
    return null
  }
}

// Decodifica token sem verificar (para debug)
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload
  } catch {
    return null
  }
}