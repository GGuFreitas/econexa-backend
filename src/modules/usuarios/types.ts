export interface IRegister {
  NOME: string
  EMAIL: string
  SENHA: string
}

export interface IAtualizarUsuario {
  NOME?: string
  FOTO?: string
  BIO?: string
}

export interface IAlterarSenha {
  SENHA_ATUAL: string
  NOVA_SENHA: string
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
