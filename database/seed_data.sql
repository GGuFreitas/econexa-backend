-- Valores de teste para o banco de dados Econexa

-- Usuários de exemplo
INSERT INTO USERS (NOME, EMAIL, SENHA, TIPO) VALUES
('João Silva', 'joao@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8zp7Y5M6lLfH/0YlYPo82p4hxkmG3K', 'COMUM'),
('Maria Souza', 'maria@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8zp7Y5M6lLfH/0YlYPo82p4hxkmG3K', 'COMUM');

-- Permissões de teste (ALLOW_* habilitado por padrão quando a tabela existe)
INSERT IGNORE INTO USER_PERMISSOES (USER_ID) VALUES
(1),
(2);

-- Causas de exemplo
INSERT INTO CAUSAS (NOME, DESCRICAO, COR, ICONE, TIPO, ATIVO) VALUES
('Limpeza de praças', 'Ação comunitária para limpeza de praças locais.', '#3B7314', 'cleaning', 'LOCAL', TRUE),
('Apoio a animais', 'Campanha de adoção e cuidados para animais de rua.', '#FB8C00', 'pets', 'LOCAL', TRUE);

-- Posts de exemplo
INSERT INTO POSTS (TITULO, CONTEUDO, USUARIO_ID, TIPO, CAUSA_ID, CAUSA_NOME, STATUS, CONT_CURTIDAS, CONT_COMENTARIOS, CONT_COMPARTILHAMENTOS) VALUES
('Ajude a reciclar', 'Hoje organizamos um mutirão de reciclagem no bairro.', 1, 'POST', 1, 'Limpeza de praças', 'PUBLICADO', 4, 2, 1),
('Cachorrinhos para adoção', 'Temos cinco cães resgatados buscando um lar amoroso.', 2, 'POST', 2, 'Apoio a animais', 'PUBLICADO', 6, 3, 2);

-- Registros de mapa de exemplo
INSERT INTO PROBLEMAS (TITULO, DESCRICAO, LAT, LNG, LOCALIZACAO_NOME, ESCOPO, USUARIO_ID, STATUS, CONT_APOIOS, CONT_COMENTARIOS, CONT_VISUALIZACOES) VALUES
('Lixo acumulado na esquina', 'Lixo acumulado há dias na esquina da avenida principal.', -23.5505, -46.6333, 'Av. Principal, 123', 'LOCAL', 1, 'ATIVO', 3, 1, 10),
('Calçada quebrada', 'A calçada está quebrada e perigosa para pedestres.', -23.5510, -46.6340, 'Rua das Flores, 45', 'LOCAL', 2, 'ATIVO', 5, 2, 8);

-- Seguidores de exemplo
INSERT INTO SEGUIDORES (USER_ID, SEGUIDO_ID) VALUES
(1, 2),
(2, 1);

-- Comentários de exemplo
INSERT INTO COMENTARIOS (USER_ID, REFERENCIA_TIPO, REFERENCIA_ID, CONTEUDO) VALUES
(2, 'POST', 1, 'Ótima iniciativa! Quero ajudar.'),
(1, 'POST', 2, 'Adoção é um ato de amor. Parabéns!');
