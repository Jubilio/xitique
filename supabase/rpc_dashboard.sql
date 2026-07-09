-- Nova função para alimentar o Dashboard do Membro (Link Mágico)
CREATE OR REPLACE FUNCTION get_dashboard_membro_por_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_integrante record;
  v_grupo record;
  v_ronda record;
  v_ordem json;
  v_membros json;
  v_total_esperado numeric;
  v_total_confirmado numeric;
BEGIN
  -- 1. Obter o próprio integrante
  SELECT id, grupo_id, nome, contacto, metodo_recebimento, conta_destino, nome_conta, posicao_ordem, estado 
  INTO v_integrante
  FROM integrantes
  WHERE token_acesso = p_token AND estado = 'activo';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membro não encontrado ou inactivo.';
  END IF;

  -- 2. Obter o grupo
  SELECT id, nome, valor_contribuicao, frequencia, num_membros, metodo_rotacao 
  INTO v_grupo 
  FROM grupos 
  WHERE id = v_integrante.grupo_id;

  -- 3. Obter ordem ocupada
  SELECT json_agg(json_build_object(
    'posicao', o.posicao,
    'integrante_nome', (SELECT nome FROM integrantes WHERE id = o.integrante_id)
  )) INTO v_ordem
  FROM ordem_recebimento o
  WHERE o.grupo_id = v_grupo.id AND o.estado = 'pendente';

  -- 4. Obter ronda activa (se existir)
  SELECT r.id, r.nome, r.data_inicio, r.data_fim, r.estado,
         i.nome as beneficiario_nome
  INTO v_ronda
  FROM rondas r
  LEFT JOIN integrantes i ON i.id = r.beneficiario_id
  WHERE r.grupo_id = v_grupo.id AND r.estado = 'em_curso'
  ORDER BY r.created_at DESC
  LIMIT 1;

  -- 5. Se houver ronda activa, calcular progresso
  IF v_ronda IS NOT NULL THEN
    v_total_esperado := v_grupo.valor_contribuicao * v_grupo.num_membros;
    
    SELECT COALESCE(SUM(valor), 0) INTO v_total_confirmado
    FROM contribuicoes
    WHERE ronda_id = v_ronda.id AND estado = 'confirmado';
  ELSE
    v_total_esperado := 0;
    v_total_confirmado := 0;
  END IF;

  -- 6. Lista de membros para transparência (apenas nomes e posições)
  SELECT json_agg(json_build_object(
    'nome', nome,
    'posicao_ordem', posicao_ordem,
    'sou_eu', (id = v_integrante.id)
  )) INTO v_membros
  FROM integrantes
  WHERE grupo_id = v_grupo.id AND estado = 'activo'
  ORDER BY COALESCE(posicao_ordem, 999) ASC;

  -- Retornar tudo num único JSON
  RETURN json_build_object(
    'integrante', row_to_json(v_integrante),
    'grupo', row_to_json(v_grupo),
    'ordem_ocupada', COALESCE(v_ordem, '[]'::json),
    'ronda_actual', COALESCE(row_to_json(v_ronda), null),
    'progresso', json_build_object(
      'esperado', v_total_esperado,
      'confirmado', v_total_confirmado
    ),
    'membros', COALESCE(v_membros, '[]'::json)
  );
END;
$$;
