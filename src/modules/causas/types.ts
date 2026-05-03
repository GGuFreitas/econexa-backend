export interface ICausa {
  ID: number
  NOME: string
  DESCRICAO: string
  COR: string
  ICONE: string
  TIPO: string
  ATIVO: boolean
}

export interface ICriarCausa {
  NOME: string
  DESCRICAO?: string
  COR?: string
  ICONE?: string
  TIPO?: string
}

export interface IAtualizarCausa {
  NOME?: string
  DESCRICAO?: string
  COR?: string
  ICONE?: string
  TIPO?: string
  ATIVO?: boolean
}