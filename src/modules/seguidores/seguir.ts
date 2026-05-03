import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

export const seguirUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'ID do usuário é obrigatório' })
    }

    if (Number(id) === usuarioId) {
      return responseBadRequest({ response: res, message: 'Você não pode seguir a si mesmo' })
    }

    const [existeUsuario] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM USERS WHERE ID = ? AND STATUS = 'ATIVO'`,
      [id]
    )

    if (!existeUsuario.length) {
      return responseBadRequest({ response: res, message: 'Usuário não encontrado' })
    }

    const [jaSegue] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM SEGUIDORES WHERE USER_ID = ? AND SEGUIDO_ID = ?`,
      [usuarioId, id]
    )

    if (jaSegue.length) {
      return responseBadRequest({ response: res, message: 'Você já segue este usuário' })
    }

    await mySqlConn.query(
      `INSERT INTO SEGUIDORES (USER_ID, SEGUIDO_ID) VALUES (?, ?)`,
      [usuarioId, id]
    )

    await mySqlConn.query(
      `UPDATE USERS SET CONT_SEGUINDO = CONT_SEGUINDO + 1 WHERE ID = ?`,
      [usuarioId]
    )

    await mySqlConn.query(
      `UPDATE USERS SET CONT_SEGUIDORES = CONT_SEGUIDORES + 1 WHERE ID = ?`,
      [id]
    )

    return responseSuccess({ response: res, payload: { message: 'Usuário seguido com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const dejarDeSeguir = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'ID do usuário é obrigatório' })
    }

    const [jaSegue] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM SEGUIDORES WHERE USER_ID = ? AND SEGUIDO_ID = ?`,
      [usuarioId, id]
    )

    if (!jaSegue.length) {
      return responseBadRequest({ response: res, message: 'Você ainda não segue este usuário' })
    }

    await mySqlConn.query(
      `DELETE FROM SEGUIDORES WHERE USER_ID = ? AND SEGUIDO_ID = ?`,
      [usuarioId, id]
    )

    await mySqlConn.query(
      `UPDATE USERS SET CONT_SEGUINDO = CONT_SEGUINDO - 1 WHERE ID = ?`,
      [usuarioId]
    )

    await mySqlConn.query(
      `UPDATE USERS SET CONT_SEGUIDORES = CONT_SEGUIDORES - 1 WHERE ID = ?`,
      [id]
    )

    return responseSuccess({ response: res, payload: { message: 'Você deixou de seguir o usuário' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const listarSeguidores = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params

    const [seguidores] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        u.ID, u.NOME, u.FOTO, u.BIO
      FROM SEGUIDORES s
      INNER JOIN USERS u ON s.USER_ID = u.ID
      WHERE s.SEGUIDO_ID = ?
      ORDER BY s.CRIADO_EM DESC
    `, [id])

    return responseSuccess({ response: res, payload: { seguidores } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const listarSeguindo = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params

    const [seguindo] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        u.ID, u.NOME, u.FOTO, u.BIO
      FROM SEGUIDORES s
      INNER JOIN USERS u ON s.SEGUIDO_ID = u.ID
      WHERE s.USER_ID = ?
      ORDER BY s.CRIADO_EM DESC
    `, [id])

    return responseSuccess({ response: res, payload: { seguindo } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}