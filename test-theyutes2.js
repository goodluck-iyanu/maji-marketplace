import https from 'https'

const payload = {
  pickup: {
    lat: 6.5,
    lng: 3.3,
    address: 'Lagos, Nigeria',
  },
  dropoff: {
    lat: 6.6,
    lng: 3.4,
    address: 'Lagos, Nigeria',
  },
  parcels: [
    {
      weightKg: 1,
      valueKobo: 100000,
      category: 'general',
    }
  ]
}

const req = https.request('https://theyutes.com/api/v1/logistics/quote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test'
  }
}, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => console.log('Status:', res.statusCode, '\nBody:', data))
})

req.on('error', console.error)
req.write(JSON.stringify(payload))
req.end()
