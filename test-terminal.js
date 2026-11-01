// test script
async function testTerminalAPI() {
  const url = 'https://sandbox.terminal.africa/v1/rates/shipment/quotes';
  
  const payload = {
    pickup_address: {
      first_name: "Seller",
      last_name: "Name",
      line1: "14 Awolowo Road",
      city: "Ikeja",
      state: "Lagos",
      country: "NG",
      zip: "100001"
    },
    delivery_address: {
      first_name: "Buyer",
      last_name: "Name",
      line1: "Wuse 2",
      city: "Abuja",
      state: "Abuja",
      country: "NG",
      zip: "900001"
    },
    parcel: {
      description: "General items",
      weight: 1,
      weight_unit: "kg",
      items: [
        {
          name: "Item",
          description: "General item",
          value: 1000,
          quantity: 1,
          weight: 1,
          currency: "NGN"
        }
      ]
    },
    currency: "NGN",
    cash_on_delivery: false
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      console.log('Error data:', JSON.stringify(data).substring(0, 500));
    } else {
      console.log('Success:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testTerminalAPI();
