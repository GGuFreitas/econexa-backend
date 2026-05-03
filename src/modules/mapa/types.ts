export interface IProblema {
  ID: number
  TITULO: string
  DESCRICAO: string
  CATEGORIA: 'rua' | 'escola' | 'saude' | 'transporte' | 'meio_ambiente' | 'outro'
  ENDERECO: string
  LATITUDE: number
  LONGITUDE: number
  IMAGEM?: string
  USUARIO_ID: number
  USUARIO_NOME?: string
  USUARIO_FOTO?: string
  STATUS: 'pendente' | 'em_tratamento' | 'resolvido' | 'arquivado'
  CRIADO_EM: Date
  ATUALIZADO_EM: Date
  IMAGENS?: string[]

  // Contadores pré-calculados
  CONT_APOIOS: number
  CONT_VISUALIZACOES: number
  CONT_COMENTARIOS: number
}

export interface ICriarProblema {
  TITULO: string
  DESCRICAO: string
  CATEGORIA: string
  ENDERECO?: string
  LATITUDE: number
  LONGITUDE: number
  IMAGEM?: string
  IMAGENS?: string[]
}

export interface IFiltrosQuery {
  STATUS?: string[]
  CATEGORIA?: string[]
}

export interface IListarProximosQuery {
  LATITUDE?: string
  LONGITUDE?: string
  RAIO?: string
}

export const CATEGORIAS = [
  { value: 'rua', label: 'Rua/Esburacada', icone: '🚧' },
  { value: 'escola', label: 'Escola', icone: '🏫' },
  { value: 'saude', label: 'Saúde', icone: '🏥' },
  { value: 'transporte', label: 'Transporte', icone: '🚆' },
  { value: 'meio_ambiente', label: 'Meio Ambiente', icone: '🌳' },
  { value: 'outro', label: 'Outro', icone: '❓' }
] as const

export const STATUS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_tratamento', label: 'Em Tratamento' },
  { value: 'resolvido', label: 'Resolvido' },
  { value: 'arquivado', label: 'Arquivado' }
] as const
