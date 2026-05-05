const permissao = (nome: string) => {
  return (req: any, res: any, next: any) => {
    const key = nome.toUpperCase()
    if (!req.conta.permissoes?.[key]) {
      return res.status(403).json({ message: 'Sem permissão' })
    }
    next()
  }
}

export default permissao
