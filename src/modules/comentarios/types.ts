export interface IComentario {
  ID: number
  USER_ID: number
  USER_NOME?: string
  USER_FOTO?: string
  REFERENCIA_TIPO: string
  REFERENCIA_ID: number
  CONTEUDO: string
  CRIADO_EM: Date
}

export interface ICriarComentario {
  CONTEUDO: string
  REFERENCIA_TIPO: string
  REFERENCIA_ID: number
}

export interface IFiltrosComentariosQuery {
  tipo?: string
  referenciaId?: string
}