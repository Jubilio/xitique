-- Função para registar pagamento via Link Mágico (Seguro)
CREATE OR REPLACE FUNCTION registar_contribuicao_por_token(
  p_token uuid,
  p_ronda_id uuid,
  p_valor numeric,
  p_metodo varchar,
  p_comprovativo_url text,
  p_transacao_id text,
  p_notas text,
  p_validado_ia boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_integrante record;
  v_ronda record;
  v_estado varchar;
  v_notas_finais text;
BEGIN
  -- 1. Obter e validar o membro pelo token
  SELECT * INTO v_integrante
  FROM integrantes
  WHERE token_acesso = p_token AND estado = 'activo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro não encontrado ou token inválido.';
  END IF;

  -- 2. Validar se a ronda pertence ao grupo do membro
  SELECT * INTO v_ronda
  FROM rondas
  WHERE id = p_ronda_id AND grupo_id = v_integrante.grupo_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ronda inválida ou não pertence a este grupo.';
  END IF;

  -- 3. Definir estado com base na validação da IA
  IF p_validado_ia THEN
    v_estado := 'confirmado';
    v_notas_finais := COALESCE(p_notas, '') || ' | 🤖 Validado via IA (Confiança: Alta) - Ref: ' || COALESCE(p_transacao_id, '');
  ELSE
    v_estado := 'pendente';
    v_notas_finais := p_notas;
  END IF;

  -- 4. Inserir a contribuição
  INSERT INTO contribuicoes (
    grupo_id,
    ronda_id,
    integrante_id,
    valor,
    data_pagamento,
    metodo,
    comprovativo_url,
    comprovativo_texto, -- Usaremos este campo para guardar o transacaoId extraído
    notas,
    estado,
    confirmado_por
  ) VALUES (
    v_integrante.grupo_id,
    v_ronda.id,
    v_integrante.id,
    p_valor,
    CURRENT_DATE,
    p_metodo,
    p_comprovativo_url,
    p_transacao_id,
    v_notas_finais,
    v_estado,
    CASE WHEN p_validado_ia THEN 'Sistema IA' ELSE NULL END
  );

  RETURN json_build_object('sucesso', true);
END;
$$;
