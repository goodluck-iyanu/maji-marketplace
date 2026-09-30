const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function getLatestOrder() {
    const { data: order, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1).single();
    if (error) {
        console.error('Error fetching order:', error);
        return;
    }
    console.log('Latest Order Reference:', order.payment_reference);
    console.log('Order Details:', JSON.stringify(order, null, 2));
}

getLatestOrder();
