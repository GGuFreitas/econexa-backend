import type { IConta } from '../modules/usuarios/types'

declare global {
  namespace Express {
    interface Request {
      conta: IConta
    }
  }
}

export {}