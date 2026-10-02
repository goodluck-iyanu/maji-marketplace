const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function checkMore() {
    const { data: store_settings, error: error1 } = await supabase.from('store_settings').select('*').limit(1);
    console.log('Store settings sample:', store_settings ? Object.keys(store_settings[0] || {}) : error1);
}
checkMore();
