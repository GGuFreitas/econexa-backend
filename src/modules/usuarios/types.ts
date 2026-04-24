export interface IRegister {
  NOME: string
  EMAIL: string
  SENHA: string
}

export interface IUsuario {
  ID: number
  NOME: string
}

export interface IPermissoes {
  [key: string]: boolean
}

export interface IConta {
  usuario: IUsuario
  permissoes: IPermissoes
}