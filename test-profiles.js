const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supaUrl = '';
let supaKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supaUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supaKey = line.split('=')[1].trim();
});

const supabaseAdmin = createClient(supaUrl, supaKey);

async function run() {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}
run();
