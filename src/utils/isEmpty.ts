export const isEmpty = (payload: any, fields?: string[]): boolean => {
  if (fields) {
    const res = fields.find((atributo) => payload[atributo] == null || payload[atributo] === '')
    return res !== undefined
  }
  return payload == null || payload === ''
}

export default isEmpty