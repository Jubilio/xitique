import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read and parse .env.local manually to avoid dotenv dependency
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
);

async function testRpc() {
  const token = process.argv[2] || '7b67f810-0a5b-4411-9497-3b0d0e149be1';
  console.log(`Testando convite com token: ${token}`);
  
  const { data, error } = await supabase.rpc('get_dashboard_membro_por_token', {
    p_token: token
  });
  
  if (error) {
    console.error("ERRO RPC ENCONTRADO:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("SUCESSO! Dados retornados:");
    console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
  }
}

testRpc();
