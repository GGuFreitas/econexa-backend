import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import isEmpty from '@utils/isEmpty'
import { responseBadRequest, responseError, responseSuccess } from '@utils/response'

interface ProximosQuery {
  LATITUDE?: string
  LONGITUDE?: string
  RAIO?: string
}

const RAIO_MAX_KM = 50

export const listarProximos = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { LATITUDE, LONGITUDE, RAIO = '10' } = req.query as ProximosQuery

    if (isEmpty(req.query, ['LATITUDE', 'LONGITUDE'])) {
      return responseBadRequest({ response: res, message: 'Latitude e longitude são obrigatórios' })
    }

    const lat = parseFloat(LATITUDE as string)
    const lng = parseFloat(LONGITUDE as string)
    const raio = Math.min(parseFloat(RAIO as string), RAIO_MAX_KM)

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
