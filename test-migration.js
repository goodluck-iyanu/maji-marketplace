const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xcwfmycujynxwvairqxa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjd2ZteWN1anlueHd2YWlycXhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTIzNDY5NywiZXhwIjoyMTA0ODEwNjk3fQ.w4VE-n73heSLglNiR7xyNg76wNM8FX1c_J6unY1_2MQ'
);

async function runMigration() {
  // Test if columns already exist
  const { data, error } = await supabase
    .from('stores')
    .select('pickup_state, pickup_city')
    .limit(1);
  
  if (error) {
    console.log('Columns do not exist yet. Error:', error.message);
    console.log('\nPlease run this SQL in your Supabase Dashboard -> SQL Editor:');
    console.log('ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS pickup_state TEXT;');
    console.log('ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS pickup_city TEXT;');
  } else {
    console.log('Columns already exist! pickup_state and pickup_city are ready.');
    console.log('Sample data:', data);
  }
}

runMigration();
