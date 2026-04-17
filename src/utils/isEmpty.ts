export default (body: any, fields: string[]) => {
  return fields.some(field => !body[field])
}