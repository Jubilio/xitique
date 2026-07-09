-- ============================================================
-- XITIQUE FÁCIL — Script COMPLETO de criação da base de dados
-- Cole este script no Supabase SQL Editor e execute tudo de uma vez.
-- Supabase Dashboard → SQL Editor → New Query → Cole → Run
-- ============================================================

-- 1. GRUPOS
CREATE TABLE IF NOT EXISTS grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome varchar NOT NULL,
  valor_contribuicao numeric NOT NULL,
  frequencia varchar NOT NULL,
  data_inicio date NOT NULL,
  num_membros int NOT NULL DEFAULT 10,
  metodo_rotacao varchar NOT NULL DEFAULT 'fixo',
  descricao text,
  estado varchar DEFAULT 'activo',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 2. INTEGRANTES (com token para acesso sem login)
CREATE TABLE IF NOT EXISTS integrantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  nome varchar NOT NULL,
  contacto varchar,
  metodo_recebimento varchar,
  conta_destino varchar,
  nome_conta varchar,
  estado varchar DEFAULT 'activo',
  observacoes text,
  posicao_ordem int,
  token_acesso uuid DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- 3. GRUPO_MEMBROS (ligação utilizador admin ↔ grupo)
CREATE TABLE IF NOT EXISTS grupo_membros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role varchar NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now(),
  UNIQUE(grupo_id, user_id)
);

-- 4. ORDEM DE RECEBIMENTO
CREATE TABLE IF NOT EXISTS ordem_recebimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  integrante_id uuid REFERENCES integrantes(id) ON DELETE CASCADE,
  posicao int NOT NULL,
  ciclo int DEFAULT 1,
  estado varchar DEFAULT 'pendente',
  data_recebimento date
);

-- 5. RONDAS
CREATE TABLE IF NOT EXISTS rondas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  nome varchar NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  beneficiario_id uuid REFERENCES integrantes(id),
  estado varchar DEFAULT 'em_curso',
  ciclo int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- 6. CONTRIBUIÇÕES
CREATE TABLE IF NOT EXISTS contribuicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  ronda_id uuid REFERENCES rondas(id) ON DELETE CASCADE,
  integrante_id uuid REFERENCES integrantes(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  data_pagamento date NOT NULL,
  metodo varchar NOT NULL,
  comprovativo_url text,
  comprovativo_texto text,
  notas text,
  estado varchar DEFAULT 'pendente',
  confirmado_por varchar,
  created_at timestamptz DEFAULT now()
);

-- 7. PAGAMENTOS AO BENEFICIÁRIO
CREATE TABLE IF NOT EXISTS pagamentos_beneficiario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid REFERENCES grupos(id) ON DELETE CASCADE,
  ronda_id uuid REFERENCES rondas(id) ON DELETE CASCADE,
  beneficiario_id uuid REFERENCES integrantes(id) ON DELETE CASCADE,
  valor_total numeric NOT NULL,
  data_pagamento date NOT NULL,
  metodo varchar NOT NULL,
  conta_destino varchar,
  comprovativo_url text,
  comprovativo_texto text,
  estado varchar DEFAULT 'pendente',
  confirmado_por varchar,
  created_at timestamptz DEFAULT now()
);

-- 8. AUDITORIA
CREATE TABLE IF NOT EXISTS auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid,
  usuario_nome varchar,
  accao varchar NOT NULL,
  tabela varchar,
  registo_id uuid,
  detalhes jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- POLÍTICAS DE SEGURANÇA (Row Level Security)
-- ============================================================

ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupo_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordem_recebimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE rondas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_beneficiario ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Acesso total para utilizadores autenticados (Administradores)
CREATE POLICY "admin_all_grupos" ON grupos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_integrantes" ON integrantes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_grupo_membros" ON grupo_membros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_ordem" ON ordem_recebimento FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_rondas" ON rondas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_contribuicoes" ON contribuicoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_pagamentos" ON pagamentos_beneficiario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_auditoria" ON auditoria FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- FUNÇÕES RPC PARA ACESSO SEM LOGIN (Links Mágicos)
-- Estas funções usam SECURITY DEFINER para que um utilizador
-- anónimo com o token correcto possa ler e actualizar os seus dados.
-- ============================================================

-- A. Obter dados do membro pelo token (leitura pública com token)
CREATE OR REPLACE FUNCTION get_membro_por_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_integrante record;
  v_grupo record;
  v_ordem json;
BEGIN
  SELECT * INTO v_integrante
  FROM integrantes
  WHERE token_acesso = p_token AND estado = 'activo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro não encontrado ou inactivo.';
  END IF;

  SELECT * INTO v_grupo FROM grupos WHERE id = v_integrante.grupo_id;

  SELECT json_agg(json_build_object(
    'posicao', o.posicao,
    'integrante_nome', (SELECT nome FROM integrantes WHERE id = o.integrante_id)
  )) INTO v_ordem
  FROM ordem_recebimento o
  WHERE o.grupo_id = v_grupo.id AND o.estado = 'pendente';

  RETURN json_build_object(
    'integrante', row_to_json(v_integrante),
    'grupo', row_to_json(v_grupo),
    'ordem_ocupada', COALESCE(v_ordem, '[]'::json)
  );
END;
$$;

-- B. Actualizar dados do membro pelo token (escrita pública com token)
CREATE OR REPLACE FUNCTION update_membro_por_token(
  p_token uuid,
  p_metodo_recebimento text,
  p_conta_destino text,
  p_nome_conta text,
  p_posicao int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_integrante record;
  v_pos_existente record;
BEGIN
  SELECT * INTO v_integrante FROM integrantes WHERE token_acesso = p_token;
  IF NOT FOUND THEN RETURN false; END IF;

  -- Actualizar dados de pagamento
  UPDATE integrantes
  SET
    metodo_recebimento = COALESCE(NULLIF(p_metodo_recebimento, ''), metodo_recebimento),
    conta_destino      = COALESCE(NULLIF(p_conta_destino, ''), conta_destino),
    nome_conta         = COALESCE(NULLIF(p_nome_conta, ''), nome_conta)
  WHERE id = v_integrante.id;

  -- Gerir escolha de posição
  IF p_posicao IS NOT NULL AND p_posicao > 0 THEN
    -- Verificar se posição já está tomada por outra pessoa
    SELECT * INTO v_pos_existente
    FROM ordem_recebimento
    WHERE grupo_id = v_integrante.grupo_id
      AND posicao = p_posicao
      AND estado = 'pendente'
      AND integrante_id != v_integrante.id;

    IF FOUND THEN
      RAISE EXCEPTION 'Esta posição já foi escolhida por outra pessoa. Escolha outra.';
    END IF;

    -- Upsert: actualizar posição existente ou inserir nova
    INSERT INTO ordem_recebimento (grupo_id, integrante_id, posicao, estado)
    VALUES (v_integrante.grupo_id, v_integrante.id, p_posicao, 'pendente')
    ON CONFLICT (grupo_id, integrante_id) DO UPDATE SET posicao = p_posicao;

    -- Sincronizar na tabela integrantes
    UPDATE integrantes SET posicao_ordem = p_posicao WHERE id = v_integrante.id;
  END IF;

  RETURN true;
END;
$$;

-- Adicionar constraint UNIQUE em ordem_recebimento para o upsert funcionar
ALTER TABLE ordem_recebimento
  ADD CONSTRAINT unique_grupo_integrante UNIQUE (grupo_id, integrante_id);
