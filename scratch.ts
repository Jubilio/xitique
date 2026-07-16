import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // we need service role to bypass RLS or just use public key if RLS allows
)

async function test() {
  const token = '7b67f810-0a5b-4411-9497-3b0d0e149be1';
  
  // 1. Check if the token exists
  console.log("--- TESTANDO TOKEN ---")
  const { data: member, error: err1 } = await supabase
    .from('integrantes')
    .select('*')
    .eq('token_acesso', token)
  console.log("Member by token:", member, err1)

  // 2. Check if the function exists and what error it throws
  console.log("\n--- TESTANDO FUNÇÃO RPC ---")
  const { data: rpcData, error: rpcErr } = await supabase.rpc('get_dashboard_membro_por_token', {
    p_token: token
  })
  console.log("RPC Error:", rpcErr)
  console.log("RPC Data:", rpcData ? "SUCCESS" : "NULL")

  // 3. Test if the columns we added actually exist
  console.log("\n--- TESTANDO SCHEMA ---")
  const { data: cols, error: colErr } = await supabase
    .from('integrantes')
    .select('user_id')
    .limit(1)
  console.log("user_id column test:", colErr ? colErr.message : "Exists!")
}

test()
