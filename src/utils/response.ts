export const responseSuccess = ({ response, payload }: any) =>
  response.status(200).json(payload)

export const responseBadRequest = ({ response, message }: any) =>
  response.status(400).json({ message })

export const responseError = ({ response, error }: any) => {
  console.error(error)
  return response.status(500).json({ message: 'Erro interno' })
}

export const responseUnauthorized = ({ response, message }: any) =>
  response.status(401).json({ message })