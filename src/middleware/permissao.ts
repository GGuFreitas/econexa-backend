const permissao = (nome: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.conta.permissoes?.[nome]) {
      return res.status(403).json({ message: 'Sem permissão' })
    }
    next()
  }
}

export default permissao