import { Request, Response, NextFunction } from 'express'
import { responseUnauthorized } from '@utils/response'
import { verifyAccessToken } from '@utils/jwt'

// Extende o tipo Request para incluir a propriedade conta
declare global {
  namespace Express {
    interface Request {
      conta?: {
        usuario: {
          ID: number
          NOME: string
        }
        permissoes: Record<string, boolean>
      }
    }
  }
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-access-token'] as string

  if (!token) {
    return responseUnauthorized({ response: res, message: 'Token não informado' })
  }

  try {
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return responseUnauthorized({ response: res, message: 'Token inválido ou expirado' })
    }

    req.conta = decoded

    return next()
  } catch {
    return responseUnauthorized({ response: res, message: 'Token inválido' })
  }
}

export default auth