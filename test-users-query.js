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
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      created_at,
      admin_users!left(role),
      stores!left(id, name, slug)
    `, { count: 'exact' });
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data.length, 'users found');
  }
}
run();
