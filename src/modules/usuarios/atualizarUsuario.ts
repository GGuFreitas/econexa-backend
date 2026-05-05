import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import isEmpty from '@utils/isEmpty'

import type { IAtualizarUsuario } from './types'

export const atualizarUsuario = async (req: Request<{ id: string }, {}, IAtualizarUsuario>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioIdLogado = req.conta.usuario.ID
    const { NOME, FOTO, BIO } = req.body

    if (isEmpty(req.body, Object.keys(req.body))) {
      return responseBadRequest({ response: res, message: 'Nenhum campo para atualizar' })
    }

    if (Number(id) !== usuarioIdLogado) {
      return responseBadRequest({ response: res, message: 'Você não pode atualizar outro usuário' })
    }

    const [existe] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM USERS WHERE ID = ?`,
      [id]
    )

    if (!existe.length) {
      return responseBadRequest({ response: res, message: 'Usuário não encontrado' })
    }

    if (NOME !== undefined) {
      await mySqlConn.query(`UPDATE USERS SET NOME = ? WHERE ID = ?`, [NOME, id])
    }
    if (FOTO !== undefined) {
      await mySqlConn.query(`UPDATE USERS SET FOTO = ? WHERE ID = ?`, [FOTO, id])
    }
    if (BIO !== undefined) {
      await mySqlConn.query(`UPDATE USERS SET BIO = ? WHERE ID = ?`, [BIO, id])
    }

    return responseSuccess({ response: res, payload: { message: 'Usuário atualizado com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const buscarUsuario = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params

    const [usuarios] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        ID, NOME, EMAIL, FOTO, BIO, TIPO, STATUS, CRIADO_EM,
        CONT_POSTS, CONT_SEGUIDORES, CONT_SEGUINDO, CONT_PROBLEMAS
      FROM USERS 
      WHERE ID = ? AND STATUS = 'ATIVO'
    `, [id])

    if (!usuarios.length) {
      return responseBadRequest({ response: res, message: 'Usuário não encontrado' })
    }

    const usuarioIdLogado = req.conta?.usuario?.ID

    if (usuarioIdLogado && Number(id) !== usuarioIdLogado) {
      const [seguindo] = await mySqlConn.query<RowDataPacket[]>(
        `SELECT ID FROM SEGUIDORES WHERE USER_ID = ? AND SEGUIDO_ID = ?`,
        [usuarioIdLogado, id]
      )

      return responseSuccess({ response: res, payload: { usuario: usuarios[0], EU_SEGUE: seguindo.length > 0 } })
    }

    return responseSuccess({ response: res, payload: { usuario: usuarios[0] } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const buscarMeuUsuario = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioId = req.conta.usuario.ID

    const [usuarios] = await mySqlConn.query<RowDataPacket[]>(`-- sql
      SELECT 
        ID, NOME, EMAIL, FOTO, BIO, TIPO, STATUS, CRIADO_EM,
        CONT_POSTS, CONT_SEGUIDORES, CONT_SEGUINDO, CONT_PROBLEMAS
      FROM USERS 
      WHERE ID = ? AND STATUS = 'ATIVO'
    `, [usuarioId])

    if (!usuarios.length) {
      return responseBadRequest({ response: res, message: 'Usuário não encontrado' })
    }

    return responseSuccess({ response: res, payload: { usuario: usuarios[0], permissoes: req.conta.permissoes || {} } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}