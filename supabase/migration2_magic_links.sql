-- ============================================================
-- XITIQUE FÁCIL — Migration 2: Links Mágicos e Acesso sem Login
-- ============================================================

-- 1. Adicionar token_acesso à tabela integrantes
ALTER TABLE integrantes 
ADD COLUMN IF NOT EXISTS token_acesso uuid DEFAULT gen_random_uuid();

-- 2. Garantir que os integrantes existentes recebem um token
UPDATE integrantes SET token_acesso = gen_random_uuid() WHERE token_acesso IS NULL;

-- 3. Tornar o token_acesso único
ALTER TABLE integrantes ADD CONSTRAINT unique_token_acesso UNIQUE (token_acesso);


-- ============================================================
-- FUNÇÕES SECURITY DEFINER (Bypass de RLS para links mágicos)
-- Estas funções correm com privilégios de admin para permitir
-- que o membro aceda aos seus dados usando apenas o token.
-- ============================================================

-- A. Obter dados do membro e do seu grupo pelo token
CREATE OR REPLACE FUNCTION get_membro_por_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_integrante record;
  v_grupo record;
  v_ordem json;
  v_resultado json;
BEGIN
  -- Procurar o integrante
  SELECT * INTO v_integrante FROM integrantes WHERE token_acesso = p_token AND estado = 'activo';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro não encontrado ou inactivo.';
  END IF;

  -- Procurar o grupo
  SELECT * INTO v_grupo FROM grupos WHERE id = v_integrante.grupo_id;

  -- Procurar as posições já ocupadas neste grupo (para bloquear na UI)
  SELECT json_agg(json_build_object(
      'posicao', posicao,
      'integrante_nome', (SELECT nome FROM integrantes WHERE id = o.integrante_id)
  )) INTO v_ordem 
  FROM ordem_recebimento o 
  WHERE grupo_id = v_grupo.id AND estado = 'pendente';

  -- Construir a resposta em JSON
  v_resultado := json_build_object(
    'integrante', row_to_json(v_integrante),
    'grupo', row_to_json(v_grupo),
    'ordem_ocupada', COALESCE(v_ordem, '[]'::json)
  );

  RETURN v_resultado;
END;
$$;


-- B. Actualizar dados do membro pelo token
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
AS $$
DECLARE
  v_integrante record;
  v_posicao_existente record;
BEGIN
  -- Procurar integrante
  SELECT * INTO v_integrante FROM integrantes WHERE token_acesso = p_token;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Actualizar dados bancários do integrante
  UPDATE integrantes 
  SET 
    metodo_recebimento = COALESCE(p_metodo_recebimento, metodo_recebimento),
    conta_destino = COALESCE(p_conta_destino, conta_destino),
    nome_conta = COALESCE(p_nome_conta, nome_conta)
  WHERE id = v_integrante.id;

  -- Se foi fornecida uma posição, tentar reservar
  IF p_posicao IS NOT NULL THEN
    -- Verificar se a posição já está ocupada por outra pessoa
    SELECT * INTO v_posicao_existente 
    FROM ordem_recebimento 
    WHERE grupo_id = v_integrante.grupo_id AND posicao = p_posicao AND estado = 'pendente';

    IF FOUND AND v_posicao_existente.integrante_id != v_integrante.id THEN
      RAISE EXCEPTION 'Esta posição já foi escolhida por outra pessoa. Escolha outra.';
    END IF;

    -- Verificar se o membro já tinha uma posição pendente
    SELECT * INTO v_posicao_existente 
    FROM ordem_recebimento 
    WHERE grupo_id = v_integrante.grupo_id AND integrante_id = v_integrante.id AND estado = 'pendente';

    IF FOUND THEN
      -- Actualizar a posição existente
      UPDATE ordem_recebimento SET posicao = p_posicao WHERE id = v_posicao_existente.id;
    ELSE
      -- Inserir nova posição
      INSERT INTO ordem_recebimento (grupo_id, integrante_id, posicao, estado)
      VALUES (v_integrante.grupo_id, v_integrante.id, p_posicao, 'pendente');
    END IF;

    -- Sincronizar na tabela integrantes para ser fácil de ver no painel admin
    UPDATE integrantes SET posicao_ordem = p_posicao WHERE id = v_integrante.id;
  END IF;

  RETURN true;
END;
$$;
