import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'
import { getIO } from '@socket/index'

export const apoiarProblema = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params
    const usuarioId = req.conta.usuario.ID

    if (isEmpty(req.params, ['id'])) {
      return responseBadRequest({ response: res, message: 'Erro de parâmetro ausente.' })
    }

    const [permissoes] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT ALLOW_APOIAR_PROBLEMA FROM USER_PERMISSOES WHERE USER_ID = ?
      `,
      [usuarioId],
    )

    if (!permissoes.length || !permissoes[0].ALLOW_APOIAR_PROBLEMA) {
      return responseBadRequest({ response: res, message: 'Sem permissão para apoiar' })
    }

    const [jaApoiou] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT ID FROM APOIADORES WHERE PROBLEMA_ID = ? AND USER_ID = ?
      `,
      [id, usuarioId],
    )

    if (jaApoiou.length) {
      return responseBadRequest({ response: res, message: 'Você já apoiou este problema' })
    }

    await mySqlConn.query(
      `-- sql
        INSERT INTO APOIADORES (PROBLEMA_ID, USER_ID) VALUES (?, ?)
      `,
      [id, usuarioId],
    )

    await mySqlConn.query(
      `-- sql
        UPDATE PROBLEMAS SET CONT_APOIOS = CONT_APOIOS + 1 WHERE ID = ?
      `,
      [id],
    )

    await mySqlConn.query(
      `-- sql
        UPDATE USERS SET CONT_APOIOS_DADOS = CONT_APOIOS_DADOS + 1 WHERE ID = ?
      `,
      [usuarioId],
    )

    const io = getIO()
    io.emit('novo_apoio', { problemaId: id })

    return responseSuccess({ response: res, payload: { message: 'Apoio registrado com sucesso' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}