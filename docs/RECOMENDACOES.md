# ECONEXA - Recomendações de Arquitetura e Melhorias

## Visão Geral do Projeto

Após analisar a estrutura atual do backend (Node.js + Express), frontend (React + MUI), e o projeto original (Java/JSP com Leaflet), apresento abaixo um documento completo de recomendações para o projeto ECONEXA.

---

## 1. RECOMENDAÇÕES DE ARQUITETURA

### 1.1 Arquitetura Dual (App + Admin) - OPÇÃO RECOMENDADA

**Recomendação: OPÇÃO B - Separar App Pública e Painel Admin**

Esta é a recomendação baseada nos critérios solicitados:

| Critério | Opção A (Monolito) | Opção B (Separado) |
|----------|-------------------|-------------------|
| Escalabilidade | Médio | Alto |
| Organização | Baixa | Alta |
| Performance | Média | Alta |
| Segurança | Baixa | Alta |
| Custo inicial | Baixo | Baixo |
| Manutenção | Complexa | Simples |

**Justificativa:**
- O app público vai ter alta demanda de reads (mapa, posts)
- O admin precisa de操作ções de write intensivo (moderação)
- Loads muito diferentes = recursos diferentes
- Segurança separada protege dados sensíveis de moderação
- Permite deploy independente quando necessário

**Estrutura Sugerida:**
```
economsa-api/                    # API principal (usuários)
├── src/
│   ├── routes/
│   │   ├── auth/
│   │   ├── mapa/
│   │   ├── posts/
│   │   └── usuarios/
│   └── modules/
│
econexa-admin/                   # Painel admin (futuro)
├── src/
│   ├── routes/
│   │   ├── auth/
│   │   ├── moderacao/
│   │   ├── relatorios/
│   │   └── gestao/
│   └── modules/
```

**IMPLEMENTAÇÃO RECOMENDADA AGORA:**
- Comece com o monolito mas **estruture desde já** para separar
- Use prefixos de rotas diferentes: `/api/app/*` vs `/api/admin/*`
- Mesmo código base, mesma DB, diferentes módulos de rota

---

### 1.2 Estrutura Modular por Domínio (Atual está no caminho certo)

A estrutura atual está alinhada com o padrão desejado. Sugestões de melhoria:

**Estrutura Modular Sugerida:**
```
src/
├── modules/
│   ├── auth/              # Login, registro, recuperação
│   ├── usuarios/          # Perfil, configurações
│   ├── mapa/              # ProblemasGeo, POIs
│   ├── posts/             # Feed, blog
│   ├── apoiadores/        # Likes, apoios
│   ├── notificacoes/     # Sistema de notificações
│   └── admin/            # (futuro) Moderação
│
├── routes/
│   ├── auth/
│   ├── mapa/
│   ├── posts/
│   └── admin/
```

**Cada módulo deve seguir:**
```
modulo/
├── types.ts              # Interfaces TypeScript
├── service.js           # Funções de negócio
├── validator.js         # Validações (Yup)
└── routes.js            # Rotas express
```

---

## 2. RECOMENDAÇÕES DE ESCALABILIDADE

### 2.1 Estratégias para Reduzir Custo com Banco

#### A) Contadores Pré-calculados (DESNORMALIZAÇÃO CONTROLADA)

**Problema atual:** Queries como `COUNT(*)` em tempo real são pesadas.

**Solução:** Armazenar contadores nas tabelas.

```sql
-- Tabela PROBLEMAS com contadores
CREATE TABLE PROBLEMAS (
  ID INT PRIMARY KEY,
  TITULO VARCHAR(255),
  DESCRICAO TEXT,
  LATITUDE DECIMAL(10,8),
  LONGITUDE DECIMAL(11,8),
  USUARIO_ID INT,
  STATUS VARCHAR(20),  -- 'pendente', 'resolvido', 'arquivado'
  CRIADO_EM DATETIME,
  
  -- CONTADORES PRÉ-CALCULADOS
  CONT_ APOIOS INT DEFAULT 0,
  CONT_VISUALIZACOES INT DEFAULT 0,
  CONT_COMENTARIOS INT DEFAULT 0
);

-- Tabela USERS com contadores
CREATE TABLE USERS (
  ID INT PRIMARY KEY,
  NOME VARCHAR(100),
  EMAIL VARCHAR(255),
  SENHA VARCHAR(255),
  
  -- CONTADORES
  CONT_PROBLEMAS_CRIADOS INT DEFAULT 0,
  CONT_ APOIOS_DADOS INT DEFAULT 0
);
```

**Quando atualizar:**
- Em transação ao criar/gostar/comentar
- Use triggers do MySQL se necessário

#### B) Cache em Memória (Futuro Redis)

**IMPLEMENTAÇÃO PRÓXIMA:**
- Não espere ter Redis para otimizar
- Cache em memória do Node.js para dados quentes

```javascript
// src/utils/cache.js
const cache = new Map();

// Cache simples com TTL
export const cacheGet = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};

export const cacheSet = (key, value, ttlSeconds = 300) => {
  cache.set(key, {
    value,
    expiry: Date.now() + (ttlSeconds * 1000)
  });
};
```

#### C) Paginação Eficiente

**EVITE:** `SELECT * FROM posts LIMIT 100` em feeds grandes.

**USE:** Cursor-based pagination.

```sql
-- Em vez de OFFSET (lento em páginas grandes)
SELECT * FROM posts ORDER BY ID DESC LIMIT 20 OFFSET 1000;

-- USE: Cursor (rápido)
SELECT * FROM posts 
WHERE ID < ? 
ORDER BY ID DESC 
LIMIT 20;
-- ? = último ID visto
```

#### D) Índices Estratégicos

```sql
-- Para o mapa (busca geospatial)
CREATE INDEX idx_problemas_local ON PROBLEMAS(LATITUDE, LONGITUDE);
CREATE INDEX idx_problemas_status ON PROBLEMAS(STATUS);

-- Para feeds
CREATE INDEX idx_posts_criado ON POSTS(CRIADO_EM DESC);
CREATE INDEX idx_posts_usuario ON POSTS(USUARIO_ID);

-- Para contadores
CREATE INDEX idx_apoiadores_problema ON APOIADORES(PROBLEMA_ID);
```

---

### 2.2 Estratégia de Crescimento

**Fase 1 (0-5 mil usuários):**
- MySQL básico com as otimizações acima
-Cache em memória
- Sem Redis

**Fase 2 (5-50 mil usuários):**
- MySQL com read replicas
- Redis para cache
- CDN para imagens

**Fase 3 (50+ mil usuários):**
- Sharding de dados
- Separar em microserviços

**Priorize desde já:**
- Estrutura de API REST consistente
- logging e métricas
- Rate limiting

> **Nota:** Documentação de Design System, Paleta de Cores e Arquitetura Frontend estão em arquivos dedicados: `DESIGN_SYSTEM.md` e `ARQUITETURA_FRONTEND.md`

---

## 3. ESTRUTURA PARA MÓDULOS FUTUROS

### 3.1 Módulo Mapa (Principal Feature)

```javascript
// src/modules/mapa/types.ts
export interface IProblema {
  ID: number;
  TITULO: string;
  DESCRICAO: string;
  CATEGORIA: 'rua' | 'escola' | 'saude' | 'transporte' | 'meio_ambiente' | 'outro';
  ENDERECO: string;
  LATITUDE: number;
  LONGITUDE: number;
  IMAGEM?: string;
  USUARIO_ID: number;
  STATUS: 'pendente' | 'em_tratamento' | 'resolvido' | 'arquivado';
  CRIADO_EM: Date;
  
  // Contadores pré-calculados
  CONT_APOIOS: number;
  CONT_VISUALIZACOES: number;
}

export interface ICategoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

// src/modules/mapa/service.js
export const criarProblema = async (data) => {
  // Validações...
  
  // Insert com contadores = 0
  const [result] = await db.query(
    `INSERT INTO PROBLEMAS 
     (TITULO, DESCRICAO, CATEGORIA, ENDERECO, LATITUDE, LONGITUDE, IMAGEM, USUARIO_ID, STATUS, CONT_APOIOS, CONT_VISUALIZACOES)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', 0, 0)`,
    [data.TITULO, data.DESCRICAO, data.CATEGORIA, data.ENDERECO, data.LATITUDE, data.LONGITUDE, data.IMAGEM, data.USUARIO_ID]
  );
  
  // Update contadores do usuário
  await db.query(
    `UPDATE USERS SET CONT_PROBLEMAS_CRIADOS = CONT_PROBLEMAS_CRIADOS + 1 WHERE ID = ?`,
    [data.USUARIO_ID]
  );
  
  // Notifica via socket
  const io = getIO();
  io.emit('novo_problema', { id: result.insertId });
  
  return result;
};

export const listarProximos = async (lat, lng, raioKm = 10) => {
  // Haversine formula (manual, sem funções espaciais)
  const query = `
    SELECT *, 
    (6371 * acos(cos(radians(?)) * cos(radians(LATITUDE)) * 
     cos(radians(LONGITUDE) - radians(?)) + 
     sin(radians(?)) * sin(radians(LATITUDE)))) AS distancia
    FROM PROBLEMAS
    WHERE STATUS != 'arquivado'
    HAVING distancia < ?
    ORDER BY distancia
    LIMIT 50
  `;
  
  const [results] = await db.query(query, [lat, lng, lat, raioKm]);
  return results;
};
```

### 3.2 Módulo Posts (Feed Social)

```javascript
// src/modules/posts/types.ts
export interface IPost {
  ID: number;
  TITULO: string;
  CONTEUDO: string;
  IMAGEM?: string;
  VIDEO?: string;
  USUARIO_ID: number;
  TIPO: 'blog' | 'atualizacao' | 'campanha';
  STATUS: 'rascunho' | 'publicado';
  CRIADO_EM: Date;
  
  // Contadores
  CONT_CURTIDAS: number;
  CONT_COMENTARIOS: number;
  CONT_COMPARTILHAMENTOS: number;
}

export const curtirPost = async (postId, userId) => {
  // Insert na tabela de relação
  await db.query(
    `INSERT IGNORE INTO POST_CURTIDAS (POST_ID, USER_ID) VALUES (?, ?)`,
    [postId, userId]
  );
  
  // Update contador na tabela POSTS
  await db.query(
    `UPDATE POSTS SET CONT_CURTIDAS = CONT_CURTIDAS + 1 WHERE ID = ?`,
    [postId]
  );
  
  // Notifica via socket
  const io = getIO();
  io.to(`post:${postId}`).emit('nova_curtida', { postId });
};
```

### 3.3 Módulo de Notificações

```javascript
// src/modules/notificacoes/service.js
export const criarNotificacao = async (data) => {
  const { USER_ID, TIPO, REFERENCIA_ID, MENSAGEM } = data;
  
  await db.query(
    `INSERT INTO NOTIFICACOES (USER_ID, TIPO, REFERENCIA_ID, MENSAGEM)
     VALUES (?, ?, ?, ?)`,
    [USER_ID, TIPO, REFERENCIA_ID, MENSAGEM]
  );
  
  // Envia via socket (tempo real)
  const io = getIO();
  const userSocket = onlineUsers.get(USER_ID);
  
  if (userSocket) {
    io.to(userSocket).emit('notificacao', {
      tipo: TIPO,
      mensagem: MENSAGEM,
      referenciaId: REFERENCIA_ID
    });
  }
};

// Tipos de notificação
export const TIPOS_NOTIFICACAO = {
  NOVO_PROBLEMA: 'novo_problema',
  NOVO_COMENTARIO: 'novo_comentario',
  NOVA_CURTIDA: 'nova_curtida',
  STATUS_ALTERADO: 'status_alterado',
  MENSAO: 'mencao'
};
```

---

## 4. MELHORIAS RECOMENDADAS

### 4.1 Backend

#### A) Validação de Entrada (Formik + Yup)

```javascript
// src/modules/usuarios/validator.js
import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  EMAIL: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  SENHA: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória')
});

export const problemaSchema = Yup.object().shape({
  TITULO: Yup.string()
    .min(5, 'Título muito curto')
    .max(100, 'Título muito longo')
    .required('Título é obrigatório'),
  DESCRICAO: Yup.string()
    .min(20, 'Descrição muito curta')
    .required('Descrição é obrigatória'),
  CATEGORIA: Yup.string()
    .oneOf(['rua', 'escola', 'saude', 'transporte', 'meio_ambiente', 'outro'])
    .required('Categoria é obrigatória'),
  LATITUDE: Yup.number()
    .min(-90)
    .max(90)
    .required('Latitude é obrigatória'),
  LONGITUDE: Yup.number()
    .min(-180)
    .max(180)
    .required('Longitude é obrigatória')
});
```

#### B) Tratamento de Erros Global

```javascript
// src/middleware/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);
  
  // Erros de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      errors: err.errors
    });
  }
  
  // Erros de banco
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Registro duplicado'
    });
  }
  
  // Erro genérico
  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
};
```

#### C) Rate Limiting

```javascript
// src/middleware/rateLimit.js (simple)
const requests = new Map();

export const rateLimit = (maxRequests = 100, windowSeconds = 60) => {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const key = `${ip}:${req.path}`;
    
    const record = requests.get(key) || { count: 0, resetAt: now + (windowSeconds * 1000) };
    
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + (windowSeconds * 1000);
    }
    
    record.count++;
    requests.set(key, record);
    
    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.'
      });
    }
    
    next();
  };
};
```

### 4.2 Frontend

#### A) Hooks de Autenticação Melhorados

```javascript
// auth/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { setLoggedIn, setToken, logout as logoutAction } from '@/store/authSlice';
import jwt from 'jwt-decode';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, isLoggedIn } = useSelector(state => state.auth);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwt(token);
        
        // Verifica expiração
        if (decoded.exp * 1000 < Date.now()) {
          dispatch(logoutAction());
          navigate('/login');
          return;
        }
        
        setUser(decoded.usuario);
      } catch {
        dispatch(logoutAction());
      }
    }
  }, [token]);
  
  const login = async (email, senha) => {
    const { data } = await api.post('/usuarios/login', { email, senha });
    dispatch(setToken(data.token));
    return data;
  };
  
  const logout = () => {
    dispatch(logoutAction());
    navigate('/login');
  };
  
  return { user, token, isLoggedIn, login, logout };
};
```

#### B) Componente de Mapa Base

```javascript
// common/components/Mapa/Mapa.jsx
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box } from '@mui/material';

// Ícones customizados
const createIcon = (categoria) => {
  const cores = {
    rua: '#E53935',
    escola: '#FB8C00',
    saude: '#1E88E5',
    transporte: '#8E24AA',
    meio_ambiente: '#43A047',
    outro: '#757575'
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${cores[categoria] || cores.outro};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Componente para centralizar map
const MapCenter = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center]);
  
  return null;
};

export const Mapa = ({ 
  problemas = [], 
  on MarkerClick,
  center = { lat: -23.55, lng: -46.63 },
  zoom = 13 
}) => {
  const [selected, setSelected] = useState(null);
  
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        <MapCenter center={center} />
        
        {problemas.map(problema => (
          <Marker
            key={problema.id}
            position={[problema.latitude, problema.longitude]}
            icon={createIcon(problema.categoria)}
            eventHandlers={{
              click: () => {
                setSelected(problema);
                onMarkerClick?.(problema);
              }
            }}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <h4>{problema.titulo}</h4>
                <p>{problema.descricao}</p>
                <small>
                  {problema.cont_apoios} aprovações
                </small>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};
```

#### C) Estrutura de Rotas Melhorada

```javascript
// routes/private/index.jsx
// WITH lazy loading

import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

const Home = lazy(() => import('@/pages/private/Home'));
const Mapa = lazy(() => import('@/pages/private/Mapa'));
const Perfil = lazy(() => import('@/pages/private/Perfil'));
const Feed = lazy(() => import('@/pages/private/Feed'));

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Carregando...
  </div>
);

export const PrivateRoutes = {
  path: '/app',
  element: <AppLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="home" replace />
    },
    {
      path: 'home',
      element: <Suspense fallback={<Loading />}><Home /></Suspense>
    },
    {
      path: 'mapa',
      element: <Suspense fallback={<Loading />}><Mapa /></Suspense>
    },
    {
      path: 'feed',
      element: <Suspense fallback={<Loading />}><Feed /></Suspense>
    },
    {
      path: 'perfil/:id?',
      element: <Suspense fallback={<Loading />}><Perfil /></Suspense>
    }
  ]
};
```

---

## 5. BANCO DE DADOS - ESTRUTURA RECOMENDADA

### 5.1 Schema Otimizado

```sql
-- USERS com contadores
CREATE TABLE USERS (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  NOME VARCHAR(100) NOT NULL,
  EMAIL VARCHAR(255) NOT NULL UNIQUE,
  SENHA VARCHAR(255) NOT NULL,
  FOTO VARCHAR(500),
  BIO TEXT,
  TIPO ENUM('COMUM', 'MODERADOR', 'ADMIN') DEFAULT 'COMUM',
  STATUS VARCHAR(20) DEFAULT 'ATIVO',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- CONTADORES para evitar JOINs
  CONT_PROBLEMAS_CRIADOS INT DEFAULT 0,
  CONT_APOIOS_DADOS INT DEFAULT 0,
  CONT_POSTS INT DEFAULT 0
) ENGINE=InnoDB;

-- Permissões (sem FOREIGN KEY)
CREATE TABLE USER_PERMISSOES (
  USER_ID INT PRIMARY KEY,
  ALLOW_CRIAR_PROBLEMA BOOLEAN DEFAULT TRUE,
  ALLOW_APOIAR_PROBLEMA BOOLEAN DEFAULT TRUE,
  ALLOW_POSTAR_BLOG BOOLEAN DEFAULT TRUE,
  ALLOW_MODERAR BOOLEAN DEFAULT FALSE,
  ALLOW_ADMIN BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB;

-- Problemas/geolocalizados
CREATE TABLE PROBLEMAS (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  TITULO VARCHAR(255) NOT NULL,
  DESCRICAO TEXT NOT NULL,
  CATEGORIA VARCHAR(50) NOT NULL,
  ENDERECO VARCHAR(500),
  LATITUDE DECIMAL(10, 8) NOT NULL,
  LONGITUDE DECIMAL(11, 8) NOT NULL,
  IMAGEM VARCHAR(500),
  USUARIO_ID INT NOT NULL,
  STATUS VARCHAR(20) DEFAULT 'PENDENTE',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  ATUALIZADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- CONTADORES PRÉ-CALCULADOS
  CONT_APOIOS INT DEFAULT 0,
  CONT_VISUALIZACOES INT DEFAULT 0,
  CONT_COMENTARIOS INT DEFAULT 0,
  
  INDEX idx_local (LATITUDE, LONGITUDE),
  INDEX idx_status (STATUS),
  INDEX idx_categoria (CATEGORIA),
  INDEX idx_usuario (USUARIO_ID)
) ENGINE=InnoDB;

-- Apoios (curtidas)
CREATE TABLE APOIADORES (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  PROBLEMA_ID INT NOT NULL,
  USER_ID INT NOT NULL,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_problema_usuario (PROBLEMA_ID, USER_ID),
  INDEX idx_problema (PROBLEMA_ID),
  INDEX idx_user (USER_ID)
) ENGINE=InnoDB;

-- Posts/blog
CREATE TABLE POSTS (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  TITULO VARCHAR(255),
  CONTEUDO TEXT NOT NULL,
  IMAGEM VARCHAR(500),
  VIDEO VARCHAR(500),
  USUARIO_ID INT NOT NULL,
  TIPO ENUM('BLOG', 'ATUALIZACAO', 'CAMPANHA') DEFAULT 'ATUALIZACAO',
  STATUS VARCHAR(20) DEFAULT 'PUBLICADO',
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- CONTADORES
  CONT_CURTIDAS INT DEFAULT 0,
  CONT_COMENTARIOS INT DEFAULT 0,
  CONT_COMPARTILHAMENTOS INT DEFAULT 0,
  
  INDEX idx_usuario (USUARIO_ID),
  INDEX idx_criado (CRIADO_EM)
) ENGINE=InnoDB;

-- Notificações
CREATE TABLE NOTIFICACOES (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  USER_ID INT NOT NULL,
  TIPO VARCHAR(50) NOT NULL,
  REFERENCIA_ID INT,
  MENSAGEM TEXT,
  LIDO BOOLEAN DEFAULT FALSE,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (USER_ID),
  INDEX idx_lido (LIDO)
) ENGINE=InnoDB;

-- Comentários
CREATE TABLE COMENTARIOS (
  ID INT PRIMARY KEY AUTO_INCREMENT,
  REFERENCIA_TIPO ENUM('PROBLEMA', 'POST') NOT NULL,
  REFERENCIA_ID INT NOT NULL,
  USER_ID INT NOT NULL,
  CONTEUDO TEXT NOT NULL,
  CRIADO_EM DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_referencia (REFERENCIA_TIPO, REFERENCIA_ID)
) ENGINE=InnoDB;
```

---

## 6. IMPLEMENTAÇÃO PASSO A PASSO

### Fase 1: Fundações (semanas 1-2)
- [ ] Implementar schema de banco otimizado
- [ ] Criar validação com Yup em todas as rotas
- [ ] Adicionar tratamento de erros global
- [ ] Configurar rate limiting
- [ ] Melhorar theme MUI com cores reais

### Fase 2: Autenticação (semanas 3-4)
- [ ] Melhorar hooks de auth
- [ ] Adicionar refresh token
- [ ] Implementar "esqueci minha senha"
- [ ] Sistema de login sociale (Google OAuth) - opcional

### Fase 3: Mapa (semanas 5-8)
- [ ] Componente Mapa com Leaflet
- [ ] CRUD de problemas
- [ ] Upload de imagens
- [ ] Busca por proximidade
- [ ] Filtros por categoria

### Fase 4: Social (semanas 9-12)
- [ ] Feed de posts
- [ ] Sistema de curtidas
- [ ] Comentários
- [ ] Compartilhamento
- [ ] Perfil do usuário

### Fase 5: Tempo Real (semanas 13-16)
- [ ] Notificações em tempo real
- [ ] Chat (futuro)
- [ ] Atualizações live do mapa

---

## 7. RESUMO DAS RECOMENDAÇÕES CHAVE

| Área | Problema Atual | Solução Recomendada |
|-----|---------------|-------------------|
| Arquitetura | Monolito único | Separe desde já com prefixos de rota |
| Banco | JOINs frequentes | Contadores pré-calculados |
| Cache | Sem cache | Cache em memória primeiro |
| Validação | Mínima | Yup em todas as rotas |
| Theme | Azul básico | Verde/Amarelo/Azul (ECONEXA) |
| Componentes |分散 | Design system centralizado |
| Mapa | Não implementado | Leaflet + React |
| Tempo real | Socket básico | Notificações estruturadas |

---

Este documento deve ser revisado periodicamente conforme o projeto evolui. As recomendações são baseadas em práticas de mercado usadas em startups em crescimento, adaptadas para sua realidade de desenvolvimento solo.

**Próximos passos recomendados:**
1. Implementar schema de banco otimizado
2. Melhorar estrutura de componentes
3. Configurar theme com cores da marca
4. Desenvolver módulo de mapa