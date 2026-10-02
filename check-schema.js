const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function getStoreColumns() {
    const { data: store, error: error1 } = await supabase.from('stores').select('*').limit(1);
    console.log('Stores sample:', store ? Object.keys(store[0] || {}) : error1);
    
    const { data: profile, error: error2 } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profiles sample:', profile ? Object.keys(profile[0] || {}) : error2);
}
getStoreColumns();
