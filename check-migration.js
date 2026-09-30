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

async function check() {
    // Try to select the columns from the orders table
    const { data, error } = await supabase.from('orders').select('confirmation_email_sent, logistics_provider').limit(1);
    if (error) {
        console.error('Migration is NOT applied. Error:', error.message);
    } else {
        console.log('Migration IS applied. Columns exist.');
    }
}

check();
