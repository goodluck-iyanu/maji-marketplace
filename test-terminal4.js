// Test with state name + city_id (different combos)
async function testCombos() {
  const headers = {
    'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
    'Content-Type': 'application/json'
  };

  // Get state data
  const statesRes = await fetch('https://sandbox.terminal.africa/v1/states?country_code=NG&limit=50', { headers });
  const states = await statesRes.json();
  const lagosState = states?.data?.find(s => s.name === 'Lagos');
  const abujaState = states?.data?.find(s => s.name === 'Abuja');

  // Get cities
  const lagosAllCitiesRes = await fetch(`https://sandbox.terminal.africa/v1/cities?country_code=NG&state_id=${lagosState?.state_id}&limit=100`, { headers });
  const lagosAllCities = await lagosAllCitiesRes.json();
  const ikejaCity = lagosAllCities?.data?.find(c => c.name.toLowerCase().includes('ikeja'));
  
  const abujaCitiesRes = await fetch(`https://sandbox.terminal.africa/v1/cities?country_code=NG&state_id=${abujaState?.state_id}&limit=100`, { headers });
  const abujaCities = await abujaCitiesRes.json();
  const abujaMainCity = abujaCities?.data?.find(c => c.name === 'Abuja');

  const combos = [
    // Try: state name, city name (from their list) - what my test-terminal2 used (Lagos/Wuse 2)
    { label: 'State name + city_id in city field', pickup: { state: 'Lagos', city: ikejaCity.city_id }, delivery: { state: 'Abuja', city: abujaMainCity.city_id } },
    // Try: state_id, city_id
    { label: 'state_id + city_id', pickup: { state: lagosState.state_id, city: ikejaCity.city_id }, delivery: { state: abujaState.state_id, city: abujaMainCity.city_id } },
    // Try: isoCode, city name
    { label: 'isoCode + city name', pickup: { state: 'LA', city: 'Ikeja' }, delivery: { state: 'FC', city: 'Abuja' } },
    // Try: state name, city name exactly as returned 
    { label: 'State name + city name (exact)', pickup: { state: 'Lagos', city: 'Ikeja' }, delivery: { state: 'Abuja', city: 'Abuja' } },
  ];

  for (const combo of combos) {
    const payload = {
      pickup_address: { first_name: "Seller", last_name: "Store", line1: "14 Awolowo Road", city: combo.pickup.city, state: combo.pickup.state, country: "NG" },
      delivery_address: { first_name: "Customer", last_name: "Buyer", line1: "Wuse 2", city: combo.delivery.city, state: combo.delivery.state, country: "NG" },
      parcel: {
        description: "General items", weight: 1, weight_unit: "kg",
        items: [{ name: "Products", description: "Items", value: 1000, quantity: 1, weight: 1, currency: "NGN" }]
      },
      currency: "NGN", cash_on_delivery: false
    };

    const quoteRes = await fetch('https://sandbox.terminal.africa/v1/rates/shipment/quotes', {
      method: 'POST', headers, body: JSON.stringify(payload)
    });
    const quote = await quoteRes.json();
    if (!quoteRes.ok) {
      console.log(`❌ [${combo.label}]: ${quote.message}`);
    } else {
      console.log(`✅ [${combo.label}]: ${quote?.data?.length} options, cheapest: ₦${Math.min(...quote.data.map(r => r.amount))}`);
    }
  }
}

testCombos().catch(console.error);
