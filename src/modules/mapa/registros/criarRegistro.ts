import { Request, Response } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { getIO } from '@socket/index'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'

import isEmpty from '@utils/isEmpty'
import type { ICriarProblema } from '../types'

const CATEGORIAS_VALIDAS = ['rua', 'escola', 'saude', 'transporte', 'meio_ambiente', 'outro']

export const criarRegistro = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { TITULO, DESCRICAO, CATEGORIA, ENDERECO, LATITUDE, LONGITUDE, IMAGEM, IMAGENS } = req.body as ICriarProblema
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.body, ['TITULO', 'DESCRICAO', 'CATEGORIA'])) {
      return responseBadRequest({ response: res, message: 'Dados incompletos' })
    }

    if (isEmpty(LATITUDE) || isEmpty(LONGITUDE)) {
      return responseBadRequest({ response: res, message: 'Latitude e longitude são obrigatórios' })
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
      [usuarioId]
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
      [TITULO, DESCRICAO, CATEGORIA, ENDERECO ?? null, LATITUDE, LONGITUDE, IMAGEM ?? null, usuarioId]
    )

    const problemaId = result.insertId

    if (IMAGENS && IMAGENS.length > 0) {
      for (let i = 0; i < IMAGENS.length; i++) {
        await mySqlConn.query(
          `INSERT INTO PROBLEMA_IMAGENS (PROBLEMA_ID, URL, ORDEM, TIPO) VALUES (?, ?, ?, 'IMAGEM')`,
          [problemaId, IMAGENS[i], i]
        )
      }
    }

    await mySqlConn.query(
      `-- sql
        UPDATE USERS SET CONT_PROBLEMAS = CONT_PROBLEMAS + 1 WHERE ID = ?
      `,
      [usuarioId]
    )

    const io = getIO()
    io.emit('novo_problema', { id: result.insertId, categoria: CATEGORIA })

    return responseSuccess({ response: res, payload: { id: result.insertId } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
