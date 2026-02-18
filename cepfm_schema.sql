-- CEPFM 2026 Schema

-- 1. Criar Tabela de Patrulhas
CREATE TABLE IF NOT EXISTS cepfm_patrulhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(50) UNIQUE NOT NULL,
    cor_primaria VARCHAR(7) NOT NULL, -- HEX
    cor_secundaria VARCHAR(7) NOT NULL, -- HEX
    logo_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir Identidade Visual inicial
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

-- 3. Tabela de Modalidades
CREATE TABLE IF NOT EXISTS cepfm_modalidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    ordem INTEGER DEFAULT 0
);

-- Inserir as 9 modalidades padrão (Exemplos, podem ser editados depois)
INSERT INTO cepfm_modalidades (nome, ordem) VALUES
('Futebol', 1),
('Vôlei', 2),
('Atletismo', 3),
('Xadrez', 4),
('Cabo de Guerra', 5),
('Gincana Lúdica', 6),
('Ordem Unida', 7),
('Conhecimentos Gerais', 8),
('Redação', 9)
ON CONFLICT (nome) DO NOTHING;

-- 4. Membros da Patrulha
CREATE TABLE IF NOT EXISTS cepfm_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrulha_id UUID REFERENCES cepfm_patrulhas(id) ON DELETE CASCADE,
    aluno_id UUID, -- Referência opcional se houver tabela separada de alunos
    nome_guerra TEXT NOT NULL,
    matricula TEXT,
    cargo VARCHAR(20) DEFAULT 'Recruta' CHECK (cargo IN ('Líder', 'Vice-Líder', 'Recruta')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Registro de Pontuações
CREATE TABLE IF NOT EXISTS cepfm_pontuacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrulha_id UUID REFERENCES cepfm_patrulhas(id) ON DELETE CASCADE,
    modalidade_id UUID REFERENCES cepfm_modalidades(id) ON DELETE CASCADE,
    pontos INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patrulha_id, modalidade_id)
);

-- Initialize points as 0 for all patrol/modality combinations
INSERT INTO cepfm_pontuacoes (patrulha_id, modalidade_id, pontos)
SELECT p.id, m.id, 0
FROM cepfm_patrulhas p, cepfm_modalidades m
ON CONFLICT (patrulha_id, modalidade_id) DO NOTHING;

-- 6. Gestão de Votações
CREATE TABLE IF NOT EXISTS cepfm_votacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    parceiros_instagram JSONB DEFAULT '[]', -- Array de {name, link}
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Logs de Votos
CREATE TABLE IF NOT EXISTS cepfm_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    votacao_id UUID REFERENCES cepfm_votacoes(id) ON DELETE CASCADE,
    patrulha_id UUID REFERENCES cepfm_patrulhas(id) ON DELETE CASCADE,
    ip_hash TEXT, 
    user_id UUID, 
    votos_contabilizados INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - basic setup
ALTER TABLE cepfm_patrulhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_modalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_pontuacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_votacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cepfm_votos ENABLE ROW LEVEL SECURITY;

-- Policies (Public read for everything relevant to the public page)
CREATE POLICY "Public read patrulhas" ON cepfm_patrulhas FOR SELECT USING (true);
CREATE POLICY "Public read modalidades" ON cepfm_modalidades FOR SELECT USING (true);
CREATE POLICY "Public read membros" ON cepfm_membros FOR SELECT USING (true);
CREATE POLICY "Public read pontuacoes" ON cepfm_pontuacoes FOR SELECT USING (true);
CREATE POLICY "Public read votacoes" ON cepfm_votacoes FOR SELECT USING (true);
CREATE POLICY "Public read votos" ON cepfm_votos FOR SELECT USING (true);
-- Insert/Update policies will be restricted to service_role or specific admin check
