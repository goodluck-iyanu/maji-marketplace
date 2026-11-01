// Test with city_id to see if that works for Terminal Africa
async function testWithCityId() {
  const headers = {
    'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
    'Content-Type': 'application/json'
  };

  // Get Abuja state_id
  const statesRes = await fetch('https://sandbox.terminal.africa/v1/states?country_code=NG&limit=50', { headers });
  const states = await statesRes.json();

  const lagosState = states?.data?.find(s => s.name === 'Lagos');
  const abujaState = states?.data?.find(s => s.name === 'Abuja');

  console.log('Lagos state:', lagosState?.name, lagosState?.state_id);
  console.log('Abuja state:', abujaState?.name, abujaState?.state_id);

  // Get Ikeja city_id (Lagos)
  const lagosAllCitiesRes = await fetch(`https://sandbox.terminal.africa/v1/cities?country_code=NG&state_id=${lagosState?.state_id}&limit=100`, { headers });
  const lagosAllCities = await lagosAllCitiesRes.json();
  const ikejaCity = lagosAllCities?.data?.find(c => c.name.toLowerCase().includes('ikeja'));
  console.log('Ikeja city:', ikejaCity);

  // Get Abuja cities
  const abujaCitiesRes = await fetch(`https://sandbox.terminal.africa/v1/cities?country_code=NG&state_id=${abujaState?.state_id}&limit=100`, { headers });
  const abujaCities = await abujaCitiesRes.json();
  console.log('Abuja cities (first 10):', abujaCities?.data?.slice(0, 10)?.map(c => c.name));

  const abujaMainCity = abujaCities?.data?.find(c => c.name.toLowerCase() === 'abuja' || c.name.toLowerCase().includes('municipal'));
  console.log('Abuja main city:', abujaMainCity);

  // Now try quote with city_id
  if (ikejaCity && abujaMainCity) {
    const payload = {
      pickup_address: {
        first_name: "Seller", last_name: "Store",
        line1: "14 Awolowo Road",
        city_id: ikejaCity.city_id,
        state_id: lagosState?.state_id,
        country: "NG",
      },
      delivery_address: {
        first_name: "Customer", last_name: "Buyer",
        line1: "Wuse 2",
        city_id: abujaMainCity.city_id,
        state_id: abujaState?.state_id,
        country: "NG",
      },
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
      console.log('QUOTE ERROR with city_id:', JSON.stringify(quote).substring(0, 300));
    } else {
      console.log('SUCCESS! Options:', quote?.data?.length);
      quote?.data?.forEach(r => console.log(`  ₦${r.amount} - ${r.carrier_name}`));
    }
  }
}

testWithCityId().catch(console.error);
