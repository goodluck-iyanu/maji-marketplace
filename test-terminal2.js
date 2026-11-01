// Test Terminal Africa: fetch cities & states to understand what they accept
async function testStates() {
  const headers = {
    'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
    'Content-Type': 'application/json'
  };

  // Get all Nigerian states
  const statesRes = await fetch('https://sandbox.terminal.africa/v1/states?country_code=NG&limit=50', { headers });
  const states = await statesRes.json();
  console.log('STATES (first 5):', JSON.stringify(states?.data?.slice(0,5), null, 2));

  // Get Lagos cities
  const lagosStateId = states?.data?.find(s => s.name === 'Lagos')?.state_id;
  console.log('Lagos state_id:', lagosStateId);

  if (lagosStateId) {
    const citiesRes = await fetch(`https://sandbox.terminal.africa/v1/cities?country_code=NG&state_id=${lagosStateId}&limit=10`, { headers });
    const cities = await citiesRes.json();
    console.log('LAGOS CITIES (first 5):', JSON.stringify(cities?.data?.slice(0,5), null, 2));
  }

  // Try a quote using state_id instead of state name
  const payload = {
    pickup_address: {
      first_name: "Seller",
      last_name: "Store",
      line1: "14 Awolowo Road, Ikeja",
      city: "Ikeja",
      state: "Lagos",
      country: "NG",
    },
    delivery_address: {
      first_name: "Customer",
      last_name: "Buyer",
      line1: "Wuse 2",
      city: "Wuse 2",
      state: "Abuja",
      country: "NG",
    },
    parcel: {
      description: "General items",
      weight: 1,
      weight_unit: "kg",
      items: [{ name: "Products", description: "Store items", value: 1000, quantity: 1, weight: 1, currency: "NGN" }]
    },
    currency: "NGN",
    cash_on_delivery: false
  };

  const quoteRes = await fetch('https://sandbox.terminal.africa/v1/rates/shipment/quotes', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const quote = await quoteRes.json();
  if (!quoteRes.ok) {
    console.log('QUOTE ERROR:', JSON.stringify(quote).substring(0, 300));
  } else {
    const rate = quote?.data?.[0];
    console.log('CHEAPEST RATE:', `₦${rate?.amount} - ${rate?.carrier_name} - ${rate?.carrier_rate_description}`);
    console.log('TOTAL OPTIONS:', quote?.data?.length);
  }
}

testStates().catch(console.error);
