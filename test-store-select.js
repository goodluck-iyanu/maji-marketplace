const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function checkStoreSelect() {
    const { data: store, error } = await supabase
      .from('stores')
      .select('name, pickup_phone, pickup_email, profiles(email, phone), store_settings(logo_url)')
      .limit(1)
      .single();
      
    console.log('Store:', JSON.stringify(store, null, 2));
    console.log('Error:', error);
}
checkStoreSelect();
