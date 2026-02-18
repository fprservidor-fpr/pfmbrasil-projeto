-- ==========================================
-- CEPFM 2026 - SCHEMA COMPLETO E DEFINITIVO
-- ==========================================

-- 1. Limpeza Opcional (CUIDADO: Use apenas se quiser resetar as tabelas)
-- DROP TABLE IF EXISTS cepfm_votos CASCADE;
-- DROP TABLE IF EXISTS cepfm_votacoes CASCADE;
-- DROP TABLE IF EXISTS cepfm_pontuacoes CASCADE;
-- DROP TABLE IF EXISTS cepfm_membros CASCADE;
-- DROP TABLE IF EXISTS cepfm_modalidades CASCADE;
-- DROP TABLE IF EXISTS cepfm_patrulhas CASCADE;

-- 2. Tabela de Patrulhas (Equipes)
CREATE TABLE IF NOT EXISTS cepfm_patrulhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(50) UNIQUE NOT NULL,
    cor_primaria VARCHAR(7) NOT NULL DEFAULT '#EAB308', -- HEX inicial Amarelo
    cor_secundaria VARCHAR(7) NOT NULL DEFAULT '#000000', -- HEX inicial Preto
    logo_url TEXT NOT NULL DEFAULT 'https://drive.google.com/uc?export=view&id=13PTKh7TkeMkLxsCH-P0uJhDiQXhkoE_J',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inserir Patrulhas Oficiais
INSERT INTO cepfm_patrulhas (nome, cor_primaria, cor_secundaria, logo_url) 
VALUES
('Águia', '#EAB308', '#000000', 'https://drive.google.com/uc?export=view&id=13PTKh7TkeMkLxsCH-P0uJhDiQXhkoE_J'),
('Tubarão', '#3B82F6', '#FFFFFF', 'https://drive.google.com/uc?export=view&id=1TJS8Hp2MANkhEyxPgJM8TbiTQ8kRF8QE'),
('Leão', '#EF4444', '#FFFFFF', 'https://drive.google.com/uc?export=view&id=1fxTgTV1UaSTpHVE0ocZPh8_3HDIluMg7'),
('Tigre', '#18181B', '#FFFFFF', 'https://drive.google.com/uc?export=view&id=1f--InolEggB5vFmeT5ckvftbf-EbqVIQ')
ON CONFLICT (nome) DO UPDATE SET
    cor_primaria = EXCLUDED.cor_primaria,
    cor_secundaria = EXCLUDED.cor_secundaria,
    logo_url = EXCLUDED.logo_url;

-- 4. Tabela de Modalidades Esportivas
CREATE TABLE IF NOT EXISTS cepfm_modalidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    ordem INTEGER DEFAULT 0
);

-- 5. Inserir Modalidades Oficiais
INSERT INTO cepfm_modalidades (nome, ordem) VALUES
('ATLETISMO', 1),
('QUEIMADA', 2),
('ORDEM UNIDA', 3),
('QUIZ', 4),
('BATALHA LÚDICA', 5),
('FUTSAL', 6),
('VÔLEI', 7),
('CIRCUITO', 8),
('DESAFIO SURPRESA', 9)
ON CONFLICT (nome) DO UPDATE SET ordem = EXCLUDED.ordem;

-- 6. Membros das Patrulhas
CREATE TABLE IF NOT EXISTS cepfm_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrulha_id UUID REFERENCES cepfm_patrulhas(id) ON DELETE CASCADE,
    aluno_id UUID REFERENCES students(id) ON DELETE SET NULL, -- Referência à tabela central de alunos
    nome_guerra TEXT NOT NULL,
    matricula TEXT,
    cargo VARCHAR(20) DEFAULT 'Recruta' CHECK (cargo IN ('Líder', 'Vice-Líder', 'Recruta')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Registro de Pontuações por Equipe e Modalidade
CREATE TABLE IF NOT EXISTS cepfm_pontuacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrulha_id UUID REFERENCES cepfm_patrulhas(id) ON DELETE CASCADE,
    modalidade_id UUID REFERENCES cepfm_modalidades(id) ON DELETE CASCADE,
    pontos INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patrulha_id, modalidade_id)
);

-- Inicializar pontos zerados para todas as combinações
INSERT INTO cepfm_pontuacoes (patrulha_id, modalidade_id, pontos)
SELECT p.id, m.id, 0
FROM cepfm_patrulhas p, cepfm_modalidades m
ON CONFLICT (patrulha_id, modalidade_id) DO NOTHING;

-- 8. Gestão de Votações (Popularidade/Campanhas)
CREATE TABLE IF NOT EXISTS cepfm_votacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    parceiros_instagram JSONB DEFAULT '[]'::jsonb, -- Array de {nome, link} para banners sociais
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Logs de Votos Individuais
CREATE TABLE IF NOT EXISTS cepfm_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    votacao_id UUID REFERENCES cepfm_votacoes(id) ON DELETE CASCADE,
    patrulha_id UUID REFERENCES cepfm_patrulhas(id) ON DELETE CASCADE,
    ip_hash TEXT, -- Para controle básico de duplicidade por IP
    user_id UUID, -- Caso opte por login de alunos específico
    votos_contabilizados INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Configuração de Segurança (RLS - Permissão para leitura pública)
ALTER TABLE cepfm_patrulhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_pontuacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_votos ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
DROP POLICY IF EXISTS "Leitura Pública Patrulhas" ON cepfm_patrulhas;
DROP POLICY IF EXISTS "Leitura Pública Modalidades" ON cepfm_modalidades;
DROP POLICY IF EXISTS "Leitura Pública Membros" ON cepfm_membros;
DROP POLICY IF EXISTS "Leitura Pública Pontuacoes" ON cepfm_pontuacoes;
DROP POLICY IF EXISTS "Leitura Pública Votacoes" ON cepfm_votacoes;
DROP POLICY IF EXISTS "Leitura Pública Votos" ON cepfm_votos;

CREATE POLICY "Leitura Pública Patrulhas" ON cepfm_patrulhas FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Modalidades" ON cepfm_modalidades FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Membros" ON cepfm_membros FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Pontuacoes" ON cepfm_pontuacoes FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Votacoes" ON cepfm_votacoes FOR SELECT USING (true);
CREATE POLICY "Leitura Pública Votos" ON cepfm_votos FOR SELECT USING (true);
