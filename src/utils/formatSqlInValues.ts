export const formatSqlInValues = (values: string | string[]): string => {
  const arr = Array.isArray(values) ? values : [values]
  return arr.map((v) => `'${v}'`).join(',')
}

export default formatSqlInValues