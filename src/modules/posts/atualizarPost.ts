import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess, responseNotFound } from '@utils/response'

import type { IAtualizarPost } from './types'

export const atualizarPost = async (req: Request<{ id: string }, {}, IAtualizarPost>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const { TITULO, CONTEUDO, STATUS } = req.body
    const usuarioId = req.conta.usuario.ID

    const [existe] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM POSTS WHERE ID = ? AND USUARIO_ID = ?`,
      [id, usuarioId]
    )

    if (!existe.length) {
      return responseNotFound({ response: res, message: 'Post não encontrado ou não pertence ao usuário' })
    }

    const campos: string[] = []
    const valores: any[] = []

    if (TITULO !== undefined) { campos.push('TITULO = ?'); valores.push(TITULO) }
    if (CONTEUDO !== undefined) { campos.push('CONTEUDO = ?'); valores.push(CONTEUDO) }
    if (STATUS !== undefined) { campos.push('STATUS = ?'); valores.push(STATUS) }

    if (campos.length === 0) {
      return responseBadRequest({ response: res, message: 'Nenhum campo para atualizar' })
    }

    valores.push(id)

    await mySqlConn.query(`UPDATE POSTS SET ${campos.join(', ')} WHERE ID = ?`, valores)

    return responseSuccess({ response: res, payload: { message: 'Post atualizado com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}