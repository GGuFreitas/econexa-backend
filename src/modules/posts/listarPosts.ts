import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseError, responseSuccess } from '@utils/response'

import type { IFiltrosPostsQuery, IPost } from './types'

export const listarPosts = async (req: Request<{}, {}, {}, IFiltrosPostsQuery>, res: Response): Promise<Response> => {
  try {
    const { tipo, causa, usuario, status } = req.query
    const usuarioIdLogado = req.conta?.usuario?.ID

    const filtros: string[] = []
    const valores: any[] = []

    if (tipo) {
      filtros.push('p.TIPO = ?')
      valores.push(tipo)
    }
    if (causa) {
      filtros.push('p.CAUSA_ID = ?')
      valores.push(causa)
    }
    if (usuario) {
      filtros.push('p.USUARIO_ID = ?')
      valores.push(usuario)
    }
    if (status) {
      filtros.push('p.STATUS = ?')
      valores.push(status)
    } else {
      filtros.push('p.STATUS = ?')
      valores.push('PUBLICADO')
    }

    const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : ''

    const [posts] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        p.*,
        u.NOME as USUARIO_NOME,
        u.FOTO as USUARIO_FOTO,
        c.NOME as CAUSA_NOME,
        GROUP_CONCAT(pi.URL ORDER BY pi.ORDEM) as IMAGENS
      FROM POSTS p
      LEFT JOIN USERS u ON p.USUARIO_ID = u.ID
      LEFT JOIN CAUSAS c ON p.CAUSA_ID = c.ID
      LEFT JOIN POST_IMAGENS pi ON p.ID = pi.POST_ID
      ${whereClause}
      GROUP BY p.ID
      ORDER BY p.CRIADO_EM DESC
    `, valores)

    if (usuarioIdLogado) {
      for (const post of posts as IPost[]) {
        const [curtida] = await mySqlConn.query<RowDataPacket[]>(
          `SELECT ID FROM POST_CURTIDAS WHERE POST_ID = ? AND USER_ID = ?`,
          [post.ID, usuarioIdLogado]
        )
        const [salvo] = await mySqlConn.query<RowDataPacket[]>(
          `SELECT ID FROM POST_SALVOS WHERE POST_ID = ? AND USER_ID = ?`,
          [post.ID, usuarioIdLogado]
        )
        post.EU_CURTI = curtida.length > 0
        post.EU_SALVEI = salvo.length > 0
      }
    }

    return responseSuccess({ response: res, payload: { posts } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}