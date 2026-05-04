import bcrypt from 'bcryptjs'
import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'

import type { IAlterarSenha } from './types'

export const alterarSenha = async (req: Request<{}, {}, IAlterarSenha>, res: Response): Promise<Response> => {
  try {
    if (isEmpty(req.body, ['SENHA_ATUAL', 'NOVA_SENHA'])) {
      return responseBadRequest({ response: res, message: 'Senha atual e nova senha são obrigatórios' })
    }

    const usuarioId = req.conta.usuario.ID
    const { SENHA_ATUAL, NOVA_SENHA } = req.body

    const [usuarios] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT SENHA FROM USERS WHERE ID = ? AND STATUS = 'ATIVO'
      `,
      [usuarioId]
    )

    if (!usuarios.length) {
      return responseBadRequest({ response: res, message: 'Usuário não encontrado' })
    }

    const usuario = usuarios[0]
    const senhaValida = await bcrypt.compare(SENHA_ATUAL, usuario.SENHA)

    if (!senhaValida) {
      return responseBadRequest({ response: res, message: 'Senha atual incorreta' })
    }

    const novaSenhaHash = await bcrypt.hash(NOVA_SENHA, 10)

    await mySqlConn.query(`UPDATE USERS SET SENHA = ? WHERE ID = ?`, [novaSenhaHash, usuarioId])

    await mySqlConn.query(`DELETE FROM REFRESH_TOKENS WHERE USER_ID = ?`, [usuarioId])

    return responseSuccess({ response: res, payload: { message: 'Senha alterada com sucesso. Faça login novamente.' } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
