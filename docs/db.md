
```sql
  CREATE DATABASE IF NOT EXISTS econexa;
  USE econexa;

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

  CAUSA_ID INT,
  CAUSA_NOME VARCHAR(120),

  LAT DECIMAL(10,8),
  LNG DECIMAL(11,8),
  LOCALIZACAO_NOME VARCHAR(255),

  ESCOPO VARCHAR(20) DEFAULT 'LOCAL',

  STATUS VARCHAR(20) DEFAULT 'ATIVO',
  USUARIO_ID INT,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONT_APOIOS INT DEFAULT 0,
  CONT_COMENTARIOS INT DEFAULT 0,
  CONT_VISUALIZACOES INT DEFAULT 0
) ENGINE=InnoDB;

CREATE INDEX idx_problema_local ON PROBLEMAS(LAT, LNG);
CREATE INDEX idx_problema_causa ON PROBLEMAS(CAUSA_ID);
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

CREATE INDEX idx_img_problema ON PROBLEMA_IMAGENS(PROBLEMA_ID);

-- =========================
-- APOIOS
-- =========================
CREATE TABLE PROBLEMA_APOIOS (
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
  CAUSA_NOME VARCHAR(120),

  REFERENCIA_TIPO VARCHAR(20),
  REFERENCIA_ID INT,

  STATUS VARCHAR(20) DEFAULT 'PUBLICADO',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONT_CURTIDAS INT DEFAULT 0,
  CONT_COMENTARIOS INT DEFAULT 0,
  CONT_COMPARTILHAMENTOS INT DEFAULT 0
) ENGINE=InnoDB;

CREATE INDEX idx_post_user ON POSTS(USUARIO_ID);
CREATE INDEX idx_post_causa ON POSTS(CAUSA_ID);
CREATE INDEX idx_post_ref ON POSTS(REFERENCIA_TIPO, REFERENCIA_ID);

-- =========================
-- IMAGENS POST
-- =========================
CREATE TABLE POST_IMAGENS (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  POST_ID INT,
  URL VARCHAR(500) NOT NULL,
  ORDEM INT DEFAULT 0,
  TIPO VARCHAR(20) DEFAULT 'IMAGEM',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_img_post ON POST_IMAGENS(POST_ID);

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

CREATE INDEX idx_img_comentario ON COMENTARIO_IMAGENS(COMENTARIO_ID);

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
-- INTERACOES
-- =========================
CREATE TABLE INTERACOES (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  USER_ID INT,
  TIPO VARCHAR(50),
  REFERENCIA_TIPO VARCHAR(20),
  REFERENCIA_ID INT,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


```

---

# 📄 DATABASE.md — ECONEXA

## 📌 Visão geral

O banco do ECONEXA foi projetado para:

* escalar com baixo custo (sem foreign keys)
* evitar queries pesadas (`COUNT`, `JOIN`)
* permitir flexibilidade (posts vinculados sem FK)
* suportar:

  * mapa (problemas geográficos)
  * rede social (posts, seguidores)
  * mobilização (causas e movimentos)

---

## 👤 USERS

```sql
USERS
```

Armazena os usuários da plataforma.

### Responsabilidades:

* autenticação (login)
* perfil do usuário
* tipo de acesso (admin, comum)

### Campos importantes:

* `CONT_*` → contadores pré-calculados (evita queries pesadas)

  * posts
  * seguidores
  * problemas criados

### Observação:

Esses contadores devem ser atualizados no backend (não via query dinâmica).

---

## 🔐 USER_PERMISSOES

```sql
USER_PERMISSOES
```

Controla o que o usuário pode fazer no sistema.

### Uso:

* bloquear ações sem precisar mudar lógica no frontend
* controle fino de acesso

### Exemplo:

* impedir usuário de postar
* bloquear criação de problemas
* dar acesso admin

---

## 🌱 CAUSAS

```sql
CAUSAS
```

Lista de causas oficiais da plataforma.

### Exemplo:

* saneamento
* educação
* segurança

### Regra:

* usuário NÃO cria causa diretamente
* causas são controladas pelo sistema/admin

---

## 💡 CAUSA_SUGESTOES

```sql
CAUSA_SUGESTOES
```

Sugestões de novas causas feitas pelos usuários.

### Lógica:

* usuários sugerem causas
* outros votam
* quando atingir relevância → pode virar uma causa oficial

---

## 🌍 MOVIMENTOS

```sql
MOVIMENTOS
```

Representa mobilizações maiores.

### Exemplo:

* protesto nacional
* campanha social
* movimento político/social

### Diferença:

| Tipo      | Escala            |
| --------- | ----------------- |
| Problema  | Local             |
| Movimento | Regional/Nacional |

---

## 📍 PROBLEMAS

```sql
PROBLEMAS
```

Entidade principal do mapa.

### Representa:

* problemas reais do dia a dia

### Exemplo:

* buraco na rua
* falta de iluminação
* lixo acumulado

### Campos importantes:

* `LAT / LNG` → posição no mapa
* `CAUSA_ID` → categoria
* `ESCOPO`:

  * `local`
  * `nacional`
  * `global`

### Contadores:

* `CONT_APOIOS`
* `CONT_COMENTARIOS`
* `CONT_VISUALIZACOES`

### Observação:

Esses valores evitam `COUNT(*)` em tempo real.

---

## 👍 PROBLEMAS_APOIOS

```sql
PROBLEMAS_APOIOS
```

Registra quem apoiou (curtiu) um problema.

### Regra importante:

```sql
UNIQUE (USER_ID, PROBLEMA_ID)
```

Impede:

* múltiplos likes do mesmo usuário

---

## 📝 POSTS

```sql
POSTS
```

Sistema de feed (tipo rede social).

### Pode representar:

* post comum
* evento
* campanha

### Relacionamentos:

* pode estar ligado a:

  * `CAUSA_ID`
  * `PROBLEMA_ID`

### Importante:

Não usa FK → flexível e escalável.

---

## ❤️ POST_LIKES

```sql
POST_LIKES
```

Curtidas dos posts.

### Regra:

```sql
UNIQUE (USER_ID, POST_ID)
```

Evita duplicidade.

---

## 🔖 POST_SALVOS

```sql
POST_SALVOS
```

Posts salvos pelo usuário.

### Uso:

* “favoritos”
* revisar depois
* base para recomendação futura

---

## 🔁 POST_REPOST

```sql
POST_REPOST
```

Compartilhamento de posts.

### Pode ser usado para:

* viralização
* alcance
* ranking de conteúdo

---

## 💬 COMENTARIOS

```sql
COMENTARIOS
```

Comentários dos posts.

### Observação:

Hoje está ligado apenas a posts.

### Melhoria futura:

Permitir:

```sql
REFERENCIA_TIPO (POST / PROBLEMA)
```

---

## 👥 USER_FOLLOWERS

```sql
USER_FOLLOWERS
```

Sistema de seguidores.

### Estrutura:

* `USER_ID` → quem é seguido
* `FOLLOWER_ID` → quem segue

### Regra:

```sql
UNIQUE (USER_ID, FOLLOWER_ID)
```

---

## 🔔 NOTIFICACOES

```sql
NOTIFICACOES
```

Sistema de notificações.

### Exemplos:

* alguém curtiu seu post
* alguém comentou
* novo problema próximo

---

## ⚡ INTERACOES (Recomendado adicionar futuramente)

```sql
INTERACOES
```

### Uso:

* analytics
* recomendação de conteúdo
* IA futura

### Registra:

* visualizações
* cliques
* curtidas

---

## 🧠 DECISÕES IMPORTANTES DO PROJETO

### ❌ Sem Foreign Key

Motivo:

* mais performance
* menos acoplamento
* melhor para escalar

---

### ✅ Contadores no banco

Motivo:

* evitar:

```sql
COUNT(*)
```

---

### ✅ Relacionamento flexível

```sql
PROBLEMA_ID no POST
```

ou

```sql
REFERENCIA_TIPO + ID (futuro)
```

---

### ✅ Indexação

Usada para:

* mapa (lat/lng)
* feed (user, causa)
* seguidores

---

## 🚀 MELHORIAS FUTURAS (IMPORTANTE)

* sistema de denúncia (moderação)
* ranking de posts (relevância)
* geolocalização otimizada (GeoHash)
* sistema de tags (multi-causa)
* cache (Redis)
* Area de artigos para postar artigos cientificos e facilitar divulgação
* area para voltada a estudos separada por areas de conhecimento social e ambiental, foco em entender a estrutura da sociedade
formar pensamento critico, entendimento de politicas publicas, planejamento urbano, racismo ambiental, entender problema de privatizaçãoo
* migrar para outro banco que nao seja local, supabase por enquanto algo do tipo
* PostGis migrar para postgres e melhorar a arquyitetura
---

## 📌 RESUMO FINAL

Esse banco já suporta:

* mapa interativo
* rede social
* mobilização social
* crescimento sem travar

👉 Isso aqui já é arquitetura de produto real, não só projeto de estudo.

---

Se quiser, o próximo nível agora é:

* queries prontas (feed estilo Instagram)
* endpoints Node.js baseados nisso
* ou integração direta com seu React Query

Só falar qual você quer seguir.
