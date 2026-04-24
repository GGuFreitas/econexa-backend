import { Request, Response } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import { getIO } from '@socket/index'

import type { ICriarProblema } from '../types'

const CATEGORIAS_VALIDAS = ['rua', 'escola', 'saude', 'transporte', 'meio_ambiente', 'outro']

export const criarRegistro = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { TITULO, DESCRICAO, CATEGORIA, ENDERECO, LATITUDE, LONGITUDE, IMAGEM } = req.body as ICriarProblema
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.body, ['TITULO', 'DESCRICAO', 'CATEGORIA'])) {
      return responseBadRequest({ response: res, message: 'Dados incompletos' })
    }

    if (LATITUDE == null || LONGITUDE == null) {
      return responseBadRequest({ response: res, message: 'Coordenadas são obrigatórias' })
    }

    if (!CATEGORIAS_VALIDAS.includes(CATEGORIA)) {
      return responseBadRequest({ response: res, message: 'Categoria inválida' })
    }

    if (LATITUDE < -90 || LATITUDE > 90 || LONGITUDE < -180 || LONGITUDE > 180) {
      return responseBadRequest({ response: res, message: 'Coordenadas inválidas' })
    }

    const [permissoes] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT ALLOW_CRIAR_PROBLEMA FROM USER_PERMISSOES WHERE USER_ID = ?
      `,
      [usuarioId],
    )

    if (!permissoes.length || !permissoes[0].ALLOW_CRIAR_PROBLEMA) {
      return responseBadRequest({ response: res, message: 'Sem permissão para criar registro' })
    }

    const [result] = await mySqlConn.query<ResultSetHeader>(
      `-- sql
        INSERT INTO PROBLEMAS
        (TITULO, DESCRICAO, CATEGORIA, ENDERECO, LATITUDE, LONGITUDE, IMAGEM, USUARIO_ID, STATUS, CONT_APOIOS, CONT_VISUALIZACOES, CONT_COMENTARIOS)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', 0, 0, 0)
      `,
      [TITULO, DESCRICAO, CATEGORIA, ENDERECO ?? null, LATITUDE, LONGITUDE, IMAGEM ?? null, usuarioId],
    )

    await mySqlConn.query(
      `-- sql
        UPDATE USERS SET CONT_PROBLEMAS_CRIADOS = CONT_PROBLEMAS_CRIADOS + 1 WHERE ID = ?
      `,
      [usuarioId],
    )

    const io = getIO()
    io.emit('novo_problema', { id: result.insertId, categoria: CATEGORIA })

    return responseSuccess({ response: res, payload: { id: result.insertId } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
