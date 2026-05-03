export interface IPost {
  ID: number
  TITULO: string
  CONTEUDO: string
  USUARIO_ID: number
  USUARIO_NOME?: string
  USUARIO_FOTO?: string
  TIPO: string
  CAUSA_ID?: number
  CAUSA_NOME?: string
  REFERENCIA_TIPO?: string
  REFERENCIA_ID?: number
  STATUS: string
  CRIADO_EM: Date
  CONT_CURTIDAS: number
  CONT_COMENTARIOS: number
  CONT_COMPARTILHAMENTOS: number
  IMAGENS?: string[]
  EU_CURTI?: boolean
  EU_SALVEI?: boolean
}

export interface ICriarPost {
  TITULO?: string
  CONTEUDO: string
  TIPO?: string
  CAUSA_ID?: number
  CAUSA_NOME?: string
  REFERENCIA_TIPO?: string
  REFERENCIA_ID?: number
  IMAGENS?: string[]
}

export interface IAtualizarPost {
  TITULO?: string
  CONTEUDO?: string
  STATUS?: string
}

export interface IFiltrosPostsQuery {
  tipo?: string
  causa?: string
  usuario?: string
  status?: string
}