// Test: Does Terminal Africa sandbox return DIFFERENT prices for different routes?
async function testRoutes() {
  const headers = {
    'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
    'Content-Type': 'application/json'
  };

  const routes = [
    { from: { state: 'Lagos', city: 'Ikeja' }, to: { state: 'Lagos', city: 'Lekki' }, label: 'Lagos → Lagos (same state)' },
    { from: { state: 'Lagos', city: 'Ikeja' }, to: { state: 'Abuja', city: 'Abuja' }, label: 'Lagos → Abuja' },
    { from: { state: 'Lagos', city: 'Ikeja' }, to: { state: 'Rivers', city: 'Port Harcourt' }, label: 'Lagos → Port Harcourt' },
    { from: { state: 'Lagos', city: 'Ikeja' }, to: { state: 'Kano', city: 'Kano' }, label: 'Lagos → Kano' },
    { from: { state: 'Abuja', city: 'Abuja' }, to: { state: 'Rivers', city: 'Port Harcourt' }, label: 'Abuja → Port Harcourt' },
  ];

  for (const route of routes) {
    const payload = {
      pickup_address: { first_name: "Seller", last_name: "Store", line1: route.from.city, city: route.from.city, state: route.from.state, country: "NG" },
      delivery_address: { first_name: "Buyer", last_name: "Name", line1: route.to.city, city: route.to.city, state: route.to.state, country: "NG" },
      parcel: {
        description: "Items", weight: 1, weight_unit: "kg",
        items: [{ name: "Product", description: "Item", value: 5000, quantity: 1, weight: 1, currency: "NGN" }]
      },
      currency: "NGN", cash_on_delivery: false
    };

    const res = await fetch('https://sandbox.terminal.africa/v1/rates/shipment/quotes', {
      method: 'POST', headers, body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      console.log(`❌ ${route.label}: ${data.message}`);
    } else {
      const prices = data.data?.map(r => `${r.carrier_name}: ₦${r.amount}`).join(' | ');
      console.log(`✅ ${route.label}:\n   ${prices}`);
    }
  }
}

testRoutes().catch(console.error);

