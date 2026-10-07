const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {});
const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, count, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      payment_reference,
      total_amount,
      payment_status,
      fulfillment_status,
      logistics_status,
      delivery_method,
      created_at,
      profiles (full_name, email),
      stores (id, name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, 19);
  
  if (error) console.error("QUERY ERROR:", error);
  else console.log(`Count: ${count}, Data Length: ${data?.length}`);
}
run();
