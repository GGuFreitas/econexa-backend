import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'

import type { IListarProximosQuery } from '../types'

const RAIO_MAX_KM = 50

export const listarProximos = async (req: Request<{}, {}, {}, IListarProximosQuery>, res: Response): Promise<Response> => {
  try {
    const LATITUDE = req.query.LATITUDE as string
    const LONGITUDE = req.query.LONGITUDE as string
    const RAIO = req.query.RAIO as string
    if (isEmpty(LATITUDE) || isEmpty(LONGITUDE)) {
      return responseBadRequest({ response: res, message: 'Latitude e longitude são obrigatórios' })
    }

    const lat = parseFloat(LATITUDE)
    const lng = parseFloat(LONGITUDE)
    const raio = Math.min(parseFloat(RAIO || '10'), RAIO_MAX_KM)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return responseBadRequest({ response: res, message: 'Coordenadas inválidas' })
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return responseBadRequest({ response: res, message: 'Coordenadas inválidas' })
    }

    const [problemas] = await mySqlConn.query<RowDataPacket[]>(
      `-- sql
        SELECT *,
        (6371 * acos(
          cos(radians(?)) * cos(radians(LATITUDE)) *
          cos(radians(LONGITUDE) - radians(?)) +
          sin(radians(?)) * sin(radians(LATITUDE))
        )) AS distancia
        FROM PROBLEMAS
        WHERE STATUS != 'arquivado'
        HAVING distancia < ?
        ORDER BY distancia
        LIMIT 50
      `,
      [lat, lng, lat, raio],
    )

    return responseSuccess({ response: res, payload: { problemas } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
