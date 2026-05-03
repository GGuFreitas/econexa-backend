# ECONEXA - Documentação de Arquitetura e Desenvolvimento

##Índice
1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Diretórios](#2-estrutura-de-diretórios)
3. [Banco de Dados - Schema Atual](#3-banco-de-dados---schema-atual)
4. [Sistema de Autenticação e Permissões](#4-sistema-de-autenticação-e-permissões)
5. [Todas as Rotas Implementadas](#5-todas-as-rotas-implementadas)
6. [Como Criar Novos Módulos](#6-como-criar-novos-módulos)
7. [Padrões de Código](#7-padrões-de-código)
8. [Próximas Funcionalidades Planejadas](#8-próximas-funcionalidades-planejadas)
9. [Configuração do Supabase](#9-configuração-do-supabase)
10. [Melhorias com Redis](#10-melhorias-com-redis)

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Stack Tecnológico
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: MySQL (sem FK para performance)
- **Autenticação**: JWT (Access Token + Refresh Token)
- **Tempo Real**: Socket.IO
- **Frontend**: React + MUI (futuro)

### 1.2 Arquitetura de Monolito Modular
O projeto segue uma arquitetura de monolito modular onde:
- Cada domínio tem seus próprios módulos
- Rotas são automaticamente registradas
- Comunicação via API REST
- Tempo real via Socket.IO

---

## 2. ESTRUTURA DE DIRETÓRIOS

```
econexa-backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # Conexão MySQL
│   │   └── routes.ts         # Auto-register de rotas
│   │
│   ├── middleware/
│   │   ├── auth.ts           # Verificação de JWT
│   │   └── permissao.ts      # Verificação de permissões
│   │
│   ├── modules/               # Módulos por domínio
│   │   ├── causas/           # CRUD Causas
│   │   ├── comentarios/     # Comentários (POST/PROBLEMA)
│   │   ├── mapa/            # Problemas geolocalizados
│   │   │   ├── registros/    # CRUD Problemas
│   │   │   ├── apoio/        # Apoios a problemas
│   │   │   └── types.ts
│   │   ├── posts/           # Feed social
│   │   │   ├── interacoes/  # Curtidas, salvamentos
│   │   │   └── types.ts
│   │   ├── seguidores/      # Sistema de seguidores
│   │   └── usuarios/        # Auth, perfil
│   │
│   ├── routes/              # Definição de rotas (Express)
│   │   ├── causas/
│   │   ├── comentarios/
│   │   ├── mapa/
│   │   ├── posts/
│   │   ├── seguidores/
│   │   ├── usuarios/
│   │   └── health/
│   │
│   ├── socket/              # Socket.IO
│   ├── utils/               # Utilitários
│   │   ├── response.ts      # Respostas padronizadas
│   │   ├── jwt.ts           # JWT helper
│   │   ├── isEmpty.ts       # Validação de objetos
│   │   └── cache.ts         # Cache em memória
│   │
│   ├── app.ts               # Configuração Express
│   └── server.ts            # Entry point
│
├── package.json
├── tsconfig.json
└── .eslintrc.json
```

---

## 3. BANCO DE DADOS - SCHEMA ATUAL

### 3.1 Philosophie du Design

**Sem Foreign Keys** - Para:
- Melhor performance
- Menos acoplamento
- Facilidade de sharding futuro

**Contadores Pré-calculados** - Para evitar:
- Queries `COUNT(*)` em tempo real
- JOINs pesados

**Índices Estratégicos** - Para:
- Mapa (lat/lng)
- Feed (usuário, causa)
- Seguidores

### 3.2 Tabelas do Banco

```sql
-- =========================
-- USERS
-- =========================
CREATE TABLE USERS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  NOME VARCHAR(120) NOT NULL,
  EMAIL VARCHAR(180) NOT NULL UNIQUE,
  SENHA VARCHAR(255) NOT NULL,
  FOTO VARCHAR(500),
  BIO TEXT,
  TIPO ENUM('COMUM','ADMIN','MODERADOR') DEFAULT 'COMUM',
  STATUS VARCHAR(20) DEFAULT 'ATIVO',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONT_POSTS INT DEFAULT 0,
  CONT_SEGUIDORES INT DEFAULT 0,
  CONT_SEGUINDO INT DEFAULT 0,
  CONT_PROBLEMAS INT DEFAULT 0
) ENGINE=InnoDB;

-- =========================
-- PERMISSÕES
-- =========================
CREATE TABLE USER_PERMISSOES (
  USER_ID INT PRIMARY KEY,
  ALLOW_POST BOOLEAN DEFAULT TRUE,
  ALLOW_COMENTAR BOOLEAN DEFAULT TRUE,
  ALLOW_PROBLEMA BOOLEAN DEFAULT TRUE,
  ALLOW_ADMIN BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- =========================
-- CAUSAS
-- =========================
CREATE TABLE CAUSAS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  NOME VARCHAR(120) NOT NULL,
  DESCRICAO TEXT,
  COR VARCHAR(20),
  ICONE VARCHAR(100),
  TIPO VARCHAR(20) DEFAULT 'LOCAL',
  ATIVO BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- =========================
-- PROBLEMAS
-- =========================
CREATE TABLE PROBLEMAS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  TITULO VARCHAR(255) NOT NULL,
  DESCRICAO TEXT NOT NULL,
  CATEGORIA VARCHAR(50) NOT NULL,
  ENDERECO VARCHAR(500),
  LATITUDE DECIMAL(10,8),
  LONGITUDE DECIMAL(11,8),
  IMAGEM VARCHAR(500),
  USUARIO_ID INT,
  STATUS VARCHAR(20) DEFAULT 'pendente',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CONT_APOIOS INT DEFAULT 0,
  CONT_VISUALIZACOES INT DEFAULT 0,
  CONT_COMENTARIOS INT DEFAULT 0
) ENGINE=InnoDB;

CREATE INDEX idx_problema_local ON PROBLEMAS(LATITUDE, LONGITUDE);
CREATE INDEX idx_problema_status ON PROBLEMAS(STATUS);

-- =========================
-- IMAGENS PROBLEMA
-- =========================
CREATE TABLE PROBLEMA_IMAGENS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  PROBLEMA_ID INT,
  URL VARCHAR(500) NOT NULL,
  ORDEM INT DEFAULT 0,
  TIPO VARCHAR(20) DEFAULT 'IMAGEM',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- APOIOS (Curtidas Problema)
-- =========================
CREATE TABLE APOIADORES (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  PROBLEMA_ID INT,
  USER_ID INT,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_apoio (PROBLEMA_ID, USER_ID)
) ENGINE=InnoDB;

-- =========================
-- POSTS
-- =========================
CREATE TABLE POSTS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  TITULO VARCHAR(255),
  CONTEUDO TEXT NOT NULL,
  USUARIO_ID INT,
  TIPO VARCHAR(20) DEFAULT 'POST',
  CAUSA_ID INT,
  STATUS VARCHAR(20) DEFAULT 'PUBLICADO',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CONT_CURTIDAS INT DEFAULT 0,
  CONT_COMENTARIOS INT DEFAULT 0,
  CONT_COMPARTILHAMENTOS INT DEFAULT 0
) ENGINE=InnoDB;

-- =========================
-- IMAGENS POST
-- =========================
CREATE TABLE POST_IMAGENS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  POST_ID INT,
  URL VARCHAR(500) NOT NULL,
  ORDEM INT DEFAULT 0,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- CURTIDAS POST
-- =========================
CREATE TABLE POST_CURTIDAS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  POST_ID INT,
  USER_ID INT,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_post_like (POST_ID, USER_ID)
) ENGINE=InnoDB;

-- =========================
-- SALVOS
-- =========================
CREATE TABLE POST_SALVOS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  POST_ID INT,
  USER_ID INT,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_post_salvo (POST_ID, USER_ID)
) ENGINE=InnoDB;

-- =========================
-- COMENTARIOS
-- =========================
CREATE TABLE COMENTARIOS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  USER_ID INT,
  REFERENCIA_TIPO VARCHAR(20),
  REFERENCIA_ID INT,
  CONTEUDO TEXT NOT NULL,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_comentario_ref ON COMENTARIOS(REFERENCIA_TIPO, REFERENCIA_ID);

-- =========================
-- IMAGENS COMENTARIO
-- =========================
CREATE TABLE COMENTARIO_IMAGENS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  COMENTARIO_ID INT,
  URL VARCHAR(500) NOT NULL,
  TIPO VARCHAR(20) DEFAULT 'IMAGEM',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- SEGUIDORES
-- =========================
CREATE TABLE SEGUIDORES (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  USER_ID INT,
  SEGUIDO_ID INT,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_follow (USER_ID, SEGUIDO_ID)
) ENGINE=InnoDB;

-- =========================
-- NOTIFICACOES
-- =========================
CREATE TABLE NOTIFICACOES (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  USER_ID INT,
  TIPO VARCHAR(50),
  REFERENCIA_ID INT,
  MENSAGEM TEXT,
  LIDO BOOLEAN DEFAULT FALSE,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_not_user ON NOTIFICACOES(USER_ID);

-- =========================
-- INTERACOES (Analytics)
-- =========================
CREATE TABLE INTERACOES (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  USER_ID INT,
  TIPO VARCHAR(50),
  REFERENCIA_TIPO VARCHAR(20),
  REFERENCIA_ID INT,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- REFRESH TOKENS
-- =========================
CREATE TABLE REFRESH_TOKENS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  USER_ID INT,
  TOKEN VARCHAR(500) NOT NULL,
  EXPIRA_EM DATETIME NOT NULL,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

---

## 4. SISTEMA DE AUTENTICAÇÃO E PERMISSÕES

### 4.1 Fluxo de Autenticação

```
1. Usuário faz login com email/senha
2. Servidor verifica credenciais
3. Busca permissões do usuário na tabela USER_PERMISSOES
4. Gera Access Token (1 dia) + Refresh Token (7 dias)
5. Access Token contém: { usuario: {ID, NOME}, permissoes: {...} }
6. Refresh Token armazena no banco para invalidação
```

### 4.2 Middleware de Auth

**Arquivo:** `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import { responseUnauthorized } from '@utils/response'
import { verifyAccessToken } from '@utils/jwt'

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-access-token'] as string

  if (!token) {
    return responseUnauthorized({ response: res, message: 'Token não informado' })
  }

  try {
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return responseUnauthorized({ response: res, message: 'Token inválido ou expirado' })
    }
    req.conta = decoded
    return next()
  } catch {
    return responseUnauthorized({ response: res, message: 'Token inválido' })
  }
}

export default auth
```

### 4.3 Middleware de Permissão

**Arquivo:** `src/middleware/permissao.ts`

```typescript
const permissao = (nome: string) => {
  return (req: any, res: any, next: any) => {
    if (!req.conta.permissoes?.[nome]) {
      return res.status(403).json({ message: 'Sem permissão' })
    }
    next()
  }
}

export default permissao
```

### 4.4 Permissões Disponíveis

| Permissão | Descrição | Uso |
|-----------|-----------|-----|
| `allow_post` | Criar posts | POST /posts |
| `allow_comentar` | Comentar | POST /comentarios |
| `allow_criar_problema` | Criar problemas | POST /mapa |
| `allow_apoiar_problema` | Apoiar problemas | POST /mapa/:id/apoiar |
| `allow_curtir` | Curtir posts | POST /posts/:id/curtir |
| `allow_admin` | Acesso administrativo | CRUD Causas |

### 4.5 Como Usar nas Rotas

```typescript
import { Router, RequestHandler } from 'express'
import auth from '@middleware/auth'
import permissao from '@middleware/permissao'

const router = Router()

// Rota pública
router.get('/', listarPosts as RequestHandler)

// Rota com autenticação
router.post('/', auth as RequestHandler, criarPost as RequestHandler)

// Rota com permissão específica
router.post('/', auth as RequestHandler, permissao('allow_post') as RequestHandler, criarPost as RequestHandler)

export default router
```

---

## 5. TODAS AS ROTAS IMPLEMENTADAS

### 5.1 /usuarios

| Método | Rota | Auth | Permissão | Descrição |
|--------|------|------|-----------|-----------|
| POST | `/login` | ❌ | - | Login |
| POST | `/register` | ❌ | - | Registro |
| POST | `/refresh` | ❌ | - | Refresh token |
| POST | `/logout` | ✅ | - | Logout |
| GET | `/:id` | ❌ | - | Buscar usuário |
| PUT | `/:id` | ✅ | - | Atualizar usuário |

### 5.2 /mapa

| Método | Rota | Auth | Permissão | Descrição |
|--------|------|------|-----------|-----------|
| GET | `/` | ❌ | - | Listar problemas |
| GET | `/proximos` | ❌ | - | Problemas próximos |
| POST | `/` | ✅ | `allow_criar_problema` | Criar problema |
| DELETE | `/:id` | ✅ | - | Deletar (owner) |
| POST | `/:id/apoiar` | ✅ | `allow_apoiar_problema` | Apoiar |
| DELETE | `/:id/apoiar` | ✅ | - | Remover apoio |

### 5.3 /causas

| Método | Rota | Auth | Permissão | Descrição |
|--------|------|------|-----------|-----------|
| GET | `/` | ❌ | - | Listar causas |
| POST | `/` | ✅ | `allow_admin` | Criar causa |
| PUT | `/:id` | ✅ | `allow_admin` | Atualizar causa |
| DELETE | `/:id` | ✅ | `allow_admin` | Deletar causa |

### 5.4 /posts

| Método | Rota | Auth | Permissão | Descrição |
|--------|------|------|-----------|-----------|
| GET | `/` | ❌ | - | Listar posts |
| GET | `/salvos` | ✅ | - | Posts salvos |
| POST | `/` | ✅ | `allow_post` | Criar post |
| PUT | `/:id` | ✅ | - | Atualizar (owner) |
| DELETE | `/:id` | ✅ | - | Deletar (owner) |
| POST | `/:id/curtir` | ✅ | `allow_curtir` | Curtir |
| DELETE | `/:id/curtir` | ✅ | - | Descurtir |
| POST | `/:id/salvar` | ✅ | - | Salvar |
| DELETE | `/:id/salvar` | ✅ | - | Remover salvo |

### 5.5 /comentarios

| Método | Rota | Auth | Permissão | Descrição |
|--------|------|------|-----------|-----------|
| GET | `/?tipo=...&referenciaId=...` | ❌ | - | Listar comentários |
| POST | `/` | ✅ | `allow_comentar` | Criar comentário |

### 5.6 /seguidores

| Método | Rota | Auth | Permissão | Descrição |
|--------|------|------|-----------|-----------|
| POST | `/:id/seguir` | ✅ | - | Seguir |
| DELETE | `/:id/seguir` | ✅ | - | Deixar de seguir |
| GET | `/:id/seguidores` | ❌ | - | Lista seguidores |
| GET | `/:id/seguindo` | ❌ | - | Lista seguindo |

### 5.7 /health

| Método | Rota | Auth | Permissão | Descrição |
|--------|------|------|-----------|-----------|
| GET | `/` | ❌ | - | Health check |

---

## 6. COMO CRIAR NOVOS MÓDULOS

### 6.1 Estrutura de um Módulo

Para criar um novo módulo (ex: `notificacoes`), siga esta estrutura:

```
src/modules/notificacoes/
├── types.ts           # Interfaces TypeScript
├── listarNotificacoes.ts
├── criarNotificacao.ts
├── marcarLida.ts
└── deletarNotificacao.ts

src/routes/notificacoes/
└── index.ts
```

### 6.2 Exemplo: types.ts

```typescript
export interface INotificacao {
  ID: number
  USER_ID: number
  TIPO: string
  REFERENCIA_ID: number
  MENSAGEM: string
  LIDO: boolean
  CRIADO_EM: Date
}

export interface ICriarNotificacao {
  TIPO: string
  REFERENCIA_ID: number
  MENSAGEM: string
}
```

### 6.3 Exemplo: função CRUD

```typescript
// src/modules/notificacoes/listarNotificacoes.ts
import { Request, Response } from 'express'
import type { RowDataPacket } from 'mysql2'

import mySqlConn from '@config/database'
import { responseError, responseSuccess } from '@utils/response'

export const listarNotificacoes = async (req: Request, res: Response): Promise<Response> => {
  try {
    const usuarioId = req.conta.usuario.ID
    const { lido } = req.query

    let query = `-- sql
      SELECT * FROM NOTIFICACOES 
      WHERE USER_ID = ?
    `
    const valores: any[] = [usuarioId]

    if (lido !== undefined) {
      query += ` AND LIDO = ?`
      valores.push(lido === 'true')
    }

    query += ` ORDER BY CRIADO_EM DESC`

    const [notificacoes] = await mySqlConn.query<RowDataPacket[]>(query, valores)

    return responseSuccess({ response: res, payload: { notificacoes } })
  } catch (err) {
    return responseError({ response: res, error: err })
  }
}
```

### 6.4 Exemplo: arquivo de rotas

```typescript
// src/routes/notificacoes/index.ts
import { Router, RequestHandler } from 'express'
import auth from '@middleware/auth'
import { listarNotificacoes } from '@modules/notificacoes/listarNotificacoes'
import { criarNotificacao } from '@modules/notificacoes/criarNotificacao'

const router = Router()

router.get('/', auth as RequestHandler, listarNotificacoes as RequestHandler)
router.post('/', auth as RequestHandler, criarNotificacao as RequestHandler)

export default router
```

### 6.5 Padrão de Nomenclatura

- **Módulo**: singular (ex: `causas`, `posts`)
- **Arquivos de função**: verbos (ex: `listar`, `criar`, `atualizar`, `deletar`)
- **Tipos**: `I` + nome (ex: `IUsuario`, `ICriarPost`)
- **Interfaces de corpo**: `I` + verbo (ex: `ICriarPost`, `IAtualizarCausa`)

---

## 7. PADRÕES DE CÓDIGO

### 7.1 Validação com isEmpty

Sempre use `isEmpty` para validar dados obrigatórios:

```typescript
import isEmpty from '@utils/isEmpty'
import { responseBadRequest } from '@utils/response'

// No corpo da requisição
if (isEmpty(req.body, ['CAMPO_OBRIGATORIO'])) {
  return responseBadRequest({ response: res, message: 'Campo obrigatório' })
}

// Nos parâmetros
if (isEmpty(req.params, ['id'])) {
  return responseBadRequest({ response: res, message: 'ID é obrigatório' })
}
```

### 7.2 Respostas Padronizadas

```typescript
import { 
  responseSuccess, 
  responseBadRequest, 
  responseError, 
  responseUnauthorized,
  responseNotFound 
} from '@utils/response'

// Sucesso
return responseSuccess({ response: res, payload: { id: 1 } })

// Erro de validação
return responseBadRequest({ response: res, message: 'Dados inválidos' })

// Não autorizado
return responseUnauthorized({ response: res, message: 'Token inválido' })

// Não encontrado
return responseNotFound({ response: res, message: 'Item não encontrado' })

// Erro interno
return responseError({ response: res, error: err })
```

### 7.3 Queries SQL - Boas Práticas

**Use:**
```typescript
const [result] = await mySqlConn.query<RowDataPacket[]>(`-- sql
  SELECT 
    p.*,
    u.NOME as USUARIO_NOME,
    GROUP_CONCAT(pi.URL) as IMAGENS
  FROM POSTS p
  LEFT JOIN USERS u ON p.USUARIO_ID = u.ID
  LEFT JOIN POST_IMAGENS pi ON p.ID = pi.POST_ID
  WHERE p.STATUS = ?
  GROUP BY p.ID
  ORDER BY p.CRIADO_EM DESC
`, ['PUBLICADO'])
```

**Evite:**
- Subqueries desnecessárias
- COUNT(*) em tempo real (use contadores pré-calculados)
- JOINs sem necessidade (cache dados relevantes)

### 7.4 Atualização de Contadores

Ao criar/apagar itens que afetam contadores, atualize atomicamente:

```typescript
// Ao criar post
await mySqlConn.query(
  `UPDATE USERS SET CONT_POSTS = CONT_POSTS + 1 WHERE ID = ?`,
  [usuarioId]
)

// Ao deletar post
await mySqlConn.query(
  `UPDATE USERS SET CONT_POSTS = CONT_POSTS - 1 WHERE ID = ?`,
  [usuarioId]
)
```

### 7.5 Socket.IO

Para notificações em tempo real:

```typescript
import { getIO } from '@socket/index'

const io = getIO()
io.emit('novo_post', { id: postId })
io.emit('nova_notificacao', { userId: usuarioId })
```

---

## 8. PRÓXIMAS FUNCIONALIDADES PLANEJADAS

### 8.1 Prioridade Alta
- [ ] Upload de imagens (S3/Cloudinary)
- [ ] Sistema de notificações completo
- [ ] Paginação com cursor
- [ ] Rate limiting

### 8.2 Prioridade Média
- [ ] Sistema de busca
- [ ] Geohash para otimização de mapa
- [ ] Cache em memória
- [ ] Refresh token rotativo

### 8.3 Prioridade Baixa
- [ ] Chat entre usuários
- [ ] Compartilhamento de posts
- [ ] Sistema de denúncia
- [ ] Painel admin

### 8.4 Melhorias de Performance
- [ ] Índices compostos para filtros
- [ ] Query de proximidade otimizada
- [ ] Paginação cursor-based
- [ ] Cache de consultas frequentes

---

## 9. CONFIGURAÇÃO DO SUPABASE

### 9.1 Plano Gratuito do Supabase

O Supabase oferece:
- **Banco PostgreSQL** (não MySQL, precisa de adaptação)
- **500MB armazenamento**
- **2GB bandwidth**
- **Limitação**: 500MB RAM, 1vCPU

### 9.2 Alternativas para MySQL Remoto

Para manter MySQL (recomendado para este projeto):

| Serviço | Plano Free | Limites |
|---------|-----------|---------|
| PlanetScale | Starter | 1 banco, 500MB |
| TiDB | Free Tier | 500MB |
| Oracle Cloud | Always Free | 2 DBs |
| AWS RDS | Free Tier | 750h/mês |
| Google Cloud SQL | Free Tier | 1 instância |

### 9.3 Configuração Recomendada (Supabase com PostgreSQL)

Se optar por migrar para PostgreSQL/Supabase:

1. **Criar projeto no Supabase**
   - Acesse supabase.com
   - Novo projeto → nome, senha, região

2. **Obter string de conexão**
   - Settings → Database → Connection string
   - Formato: `postgresql://user:pass@host:5432/db`

3. **Adaptar o código** (src/config/database.ts):
   ```typescript
   import mysql from 'mysql2/promise' // manter mysql2
   // ou migrar para postgres:
   import { Pool } from 'pg'
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   })
   ```

4. **Variáveis de ambiente** (.env):
   ```
   DATABASE_URL=postgresql://[user]:[password]@db.[project-ref].supabase.co:5432/postgres
   ```

### 9.4 Migrando de MySQL para PostgreSQL

Principais diferenças a ajustar:
- `AUTO_INCREMENT` → `SERIAL`
- `ENUM` → `CHECK` ou tipo nativo
- `LIMIT` → funciona igual
- `GROUP_CONCAT` → `STRING_AGG`
- Backticks `` ` `` → aspas duplas `"`

---

## 10. MELHORIAS COM REDIS

### 10.1 Quando Usar Redis

- **Cache de consultas frequentes**: causas, categorias
- **Session store**: substituir refresh tokens em banco
- **Rate limiting**: contagem de requisições
- **Filas de trabalho**: processamentos assíncronos
- **Pub/Sub**: notificações em escala

### 10.2 Implementação de Cache Simples

**Arquivo:** `src/utils/cache.ts` (atualmente básico)

```typescript
// Cache em memória (sem Redis)
// Funciona para um único servidor

const cache = new Map<string, { value: any; expiry: number }>()

export const cacheGet = (key: string): any | null => {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() > item.expiry) {
    cache.delete(key)
    return null
  }
  return item.value
}

export const cacheSet = (key: string, value: any, ttlSeconds = 300): void => {
  cache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  })
}

export const cacheDelete = (key: string): void => {
  cache.delete(key)
}

export const cacheClear = (): void => {
  cache.clear()
}
```

### 10.3 Com Redis (Futuro)

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export const cacheGet = async (key: string): Promise<any | null> => {
  const value = await redis.get(key)
  return value ? JSON.parse(value) : null
}

export const cacheSet = async (key: string, value: any, ttlSeconds = 300): Promise<void> => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}
```

### 10.4 Casos de Uso Recomendados

| Dado | TTL Sugerido | Justificativa |
|------|--------------|---------------|
| Causas ativas | 1 hora | Raramente mudam |
| Lista de problemas | 30 segundos | Atualizações frequentes |
| Perfil de usuário | 5 minutos | Pode mudar |
| Contadores | 0 (sem cache) | Atualização imediata |

---

## 11. RESUMO DE IMPLEMENTAÇÃO

### O que já está implementado:
✅ Autenticação JWT (access + refresh)
✅ Sistema de permissões
✅ CRUD Problemas (mapa)
✅ Apoios a problemas
✅ CRUD Posts
✅ Curtidas e salvamentos
✅ Comentários (POST/PROBLEMA)
✅ Sistema de seguidores
✅ CRUD Causas (admin)
✅ Atualização de usuário
✅ Rotas automáticas
✅ Socket.IO básico

### O que precisa implementar:
🔲 Upload de imagens
🔲 Sistema de notificações completo
🔲 Rate limiting
🔲 Cache em memória/Redis
🔲 Paginação cursor-based
🔲 Busca e filtros avançados

---

## 12. VARIÁVEIS DE AMBIENTE

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=econexa

# JWT
SECRET_KEY=seu_secret_access_token
REFRESH_SECRET=seu_secret_refresh_token

# Servidor
PORT=3000
NODE_ENV=development

# Socket.IO
SOCKET_PORT=3001
```

---

## 13. COMANDOS ÚTEIS

```bash
# Instalação de dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint

# TypeScript check
npm run typecheck
```

---

*Documento gerado automaticamente em: 2026-05-01*
*Versão do projeto: 1.0.0*