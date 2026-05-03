import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseBadRequest, responseError, responseSuccess, responseNotFound } from '@utils/response'
import isEmpty from '@utils/isEmpty'

import type { IAtualizarCausa } from './types'

export const atualizarCausa = async (req: Request<{ id: string }, {}, IAtualizarCausa>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params

    if (isEmpty(req.body, Object.keys(req.body))) {
      return responseBadRequest({ response: res, message: 'Nenhum campo para atualizar' })
    }

    const [existe] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT ID FROM CAUSAS WHERE ID = ?`,
      [id]
    )

    if (!existe.length) {
      return responseNotFound({ response: res, message: 'Causa não encontrada' })
    }

    const { NOME, DESCRICAO, COR, ICONE, TIPO, ATIVO } = req.body

    if (NOME !== undefined) {
      await mySqlConn.query(`UPDATE CAUSAS SET NOME = ? WHERE ID = ?`, [NOME, id])
    }
    if (DESCRICAO !== undefined) {
      await mySqlConn.query(`UPDATE CAUSAS SET DESCRICAO = ? WHERE ID = ?`, [DESCRICAO, id])
    }
    if (COR !== undefined) {
      await mySqlConn.query(`UPDATE CAUSAS SET COR = ? WHERE ID = ?`, [COR, id])
    }
    if (ICONE !== undefined) {
      await mySqlConn.query(`UPDATE CAUSAS SET ICONE = ? WHERE ID = ?`, [ICONE, id])
    }
    if (TIPO !== undefined) {
      await mySqlConn.query(`UPDATE CAUSAS SET TIPO = ? WHERE ID = ?`, [TIPO, id])
    }
    if (ATIVO !== undefined) {
      await mySqlConn.query(`UPDATE CAUSAS SET ATIVO = ? WHERE ID = ?`, [ATIVO, id])
    }

    return responseSuccess({ response: res, payload: { message: 'Causa atualizada com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

export const buscarCausa = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
  try {
    const { id } = req.params

    const [causas] = await mySqlConn.query<RowDataPacket[]>(
      `SELECT * FROM CAUSAS WHERE ID = ?`,
      [id]
    )

    if (!causas.length) {
      return responseNotFound({ response: res, message: 'Causa não encontrada' })
    }

    return responseSuccess({ response: res, payload: { causa: causas[0] } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}