const fs = require('fs')
const path = require('path')

const env = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8')
env.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    process.env[match[1].trim()] = match[2].trim()
  }
})

const { createClient } = require('@supabase/supabase-js')

async function fixDB() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: buckets } = await supabase.storage.listBuckets()
  const hasBucket = buckets.some(b => b.name === 'product-images')
  if (!hasBucket) {
    console.log('Creating product-images bucket...')
    await supabase.storage.createBucket('product-images', { public: true })
  } else {
    console.log('Bucket product-images exists.')
  }
  
  // Create images column if it doesn't exist via postgres function if possible.
  // Since we can't do arbitrary DDL without a Postgres connection string easily in JS client,
  // we'll just advise the user if they didn't run the migration.
}

fixDB()

