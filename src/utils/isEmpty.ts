export const isEmpty = (payload: any, fields: string[]): boolean => {
  const res = fields.find((atributo) => payload[atributo] == null || payload[atributo] === '')
  return res !== undefined
}

