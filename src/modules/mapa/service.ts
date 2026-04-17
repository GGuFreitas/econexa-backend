import { Request, Response } from 'express'

import db from '@config/database'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import { getIO } from '@socket/index'

interface ProblemaPayload {
  TITULO: string
  DESCRICAO: string
  CATEGORIA: string
  ENDERECO?: string
  LATITUDE: number
  LONGITUDE: number
  IMAGEM?: string
}

interface ProblemaFilter {
  STATUS?: string
  CATEGORIA?: string
  LATITUDE?: string
  LONGITUDE?: string
  RAIO?: string
}

// Criar novo problema
export const criarProblema = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      TITULO,
      DESCRICAO,
      CATEGORIA,
      ENDERECO,
      LATITUDE,
      LONGITUDE,
      IMAGEM,
    } = req.body as ProblemaPayload
    const usuarioId = req.conta?.usuario?.ID

    // Validações básicas
    if (!TITULO || !DESCRICAO || !CATEGORIA || !LATITUDE || !LONGITUDE) {
      return responseBadRequest({ response: res, message: 'Dados incompletos' })
    }

    if (!usuarioId) {
      return responseBadRequest({
        response: res,
        message: 'Usuário não autenticado',
      })
    }

    // Verifica permissão
    const [permissoes] = await db.query(
      'SELECT ALLOW_CRIAR_PROBLEMA FROM USER_PERMISSOES WHERE USER_ID = ?',
      [usuarioId],
    )

    if (!permissoes.length || !permissoes[0].ALLOW_CRIAR_PROBLEMA) {
      return responseBadRequest({
        response: res,
        message: 'Sem permissão para criar problema',
      })
    }

    // Insert com contadores = 0
    const [result] = await db.query(
      `INSERT INTO PROBLEMAS 
       (TITULO, DESCRICAO, CATEGORIA, ENDERECO, LATITUDE, LONGITUDE, IMAGEM, USUARIO_ID, STATUS, CONT_APOIOS, CONT_VISUALIZACOES, CONT_COMENTARIOS)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', 0, 0, 0)`,
      [TITULO, DESCRICAO, CATEGORIA, ENDERECO, LATITUDE, LONGITUDE, IMAGEM, usuarioId],
    )

    // Update contadores do usuário
    await db.query(
      'UPDATE USERS SET CONT_PROBLEMAS_CRIADOS = CONT_PROBLEMAS_CRIADOS + 1 WHERE ID = ?',
      [usuarioId],
    )

    // Notifica via socket
    const io = getIO()
    io.emit('novo_problema', { id: result.insertId, categoria: CATEGORIA })

    return responseSuccess({ response: res, payload: { id: result.insertId } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

// Listar problemas (com filtros)
export const listarProblemas = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { STATUS, CATEGORIA } = req.query as ProblemaFilter

    let query = 'SELECT * FROM PROBLEMAS WHERE STATUS != "arquivado"'
    const params: string[] = []

    if (STATUS) {
      query += ' AND STATUS = ?'
      params.push(STATUS)
    }

    if (CATEGORIA) {
      query += ' AND CATEGORIA = ?'
      params.push(CATEGORIA)
    }

    query += ' ORDER BY CRIADO_EM DESC'

    const [problemas] = await db.query(query, params)

    return responseSuccess({ response: res, payload: { problemas } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

// Buscar problemas por proximidade
export const listarProximos = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { LATITUDE, LONGITUDE, RAIO = '10' } = req.query as ProblemaFilter
    const lat = parseFloat(LATITUDE as string)
    const lng = parseFloat(LONGITUDE as string)
    const raio = parseFloat(RAIO as string)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return responseBadRequest({
        response: res,
        message: 'Latitude e longitude são obrigatórios',
      })
    }

    // Haversine formula
    const query = `
      SELECT *, 
      (6371 * acos(cos(radians(?)) * cos(radians(LATITUDE)) * 
       cos(radians(LONGITUDE) - radians(?)) + 
       sin(radians(?)) * sin(radians(LATITUDE)))) AS distancia
      FROM PROBLEMAS
      WHERE STATUS != 'arquivado'
      HAVING distancia < ?
      ORDER BY distancia
      LIMIT 50
    `

    const [problemas] = await db.query(query, [lat, lng, lat, raio])

    return responseSuccess({ response: res, payload: { problemas } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

// Apoiar problema
export const apoiarProblema = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta?.usuario?.ID

    if (!usuarioId) {
      return responseBadRequest({
        response: res,
        message: 'Usuário não autenticado',
      })
    }

    // Verifica permissão
    const [permissoes] = await db.query(
      'SELECT ALLOW_APOIAR_PROBLEMA FROM USER_PERMISSOES WHERE USER_ID = ?',
      [usuarioId],
    )

    if (!permissoes.length || !permissoes[0].ALLOW_APOIAR_PROBLEMA) {
      return responseBadRequest({
        response: res,
        message: 'Sem permissão para apoiar',
      })
    }

    // Insert na tabela de apoios (ignora se já apoiou)
    await db.query(
      'INSERT IGNORE INTO APOIADORES (PROBLEMA_ID, USER_ID) VALUES (?, ?)',
      [id, usuarioId],
    )

    // Update contador
    await db.query(
      'UPDATE PROBLEMAS SET CONT_APOIOS = CONT_APOIOS + 1 WHERE ID = ?',
      [id],
    )

    // Update contadores do usuário
    await db.query(
      'UPDATE USERS SET CONT_APOIOS_DADOS = CONT_APOIOS_DADOS + 1 WHERE ID = ?',
      [usuarioId],
    )

    // Notifica via socket
    const io = getIO()
    io.emit('novo_apoio', { problemaId: id })

    return responseSuccess({
      response: res,
      payload: { message: 'Apoiado com sucesso' },
    })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

// Remover apoio
export const removerApoio = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta?.usuario?.ID

    await db.query(
      'DELETE FROM APOIADORES WHERE PROBLEMA_ID = ? AND USER_ID = ?',
      [id, usuarioId],
    )

    await db.query(
      'UPDATE PROBLEMAS SET CONT_APOIOS = GREATEST(CONT_APOIOS - 1, 0) WHERE ID = ?',
      [id],
    )

    return responseSuccess({
      response: res,
      payload: { message: 'Apoio removido' },
    })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}

// Deletar problema (apenas owner)
export const deletarProblema = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta?.usuario?.ID

    // Verifica se é o dono
    const [problemas] = await db.query(
      'SELECT USUARIO_ID FROM PROBLEMAS WHERE ID = ?',
      [id],
    )

    if (!problemas.length) {
      return responseBadRequest({
        response: res,
        message: 'Problema não encontrado',
      })
    }

    if (problemas[0].USUARIO_ID !== usuarioId) {
      return responseBadRequest({
        response: res,
        message: 'Apenas o criador pode deletar',
      })
    }

    await db.query('DELETE FROM PROBLEMAS WHERE ID = ?', [id])

    return responseSuccess({
      response: res,
      payload: { message: 'Deletado com sucesso' },
    })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}