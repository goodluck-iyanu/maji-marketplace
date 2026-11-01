'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDeliveryQuotes(storeId: string, deliveryState: string, deliveryCity: string) {
  try {
    const supabase = await createClient()
    
    // Fetch store pickup address
    const { data: store } = await supabase
      .from('stores')
      .select('pickup_address, pickup_phone')
      .eq('id', storeId)
      .single()
      
    if (!store || !store.pickup_address) {
      return { error: 'Seller has not set a pickup address.' }
    }
    
    // Attempt to extract state from the seller's free-text pickup_address
    // Fallback to Lagos if we can't find a match
    const states = ["Abia","Abuja","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara", "FCT"];
    
    let pickupState = "Lagos"; // default
    for (const st of states) {
      if (store.pickup_address.toLowerCase().includes(st.toLowerCase())) {
        pickupState = st === "FCT" ? "Abuja" : st;
        break;
      }
    }

    const payload = {
      pickup_address: {
        first_name: "Seller",
        last_name: "Store",
        line1: store.pickup_address.substring(0, 50),
        city: pickupState, // Just use state name for city if unknown, Terminal usually accepts this
        state: pickupState,
        country: "NG",
      },
      delivery_address: {
        first_name: "Customer",
        last_name: "Buyer",
        line1: deliveryCity, 
        city: deliveryCity,
        state: deliveryState === "FCT" ? "Abuja" : deliveryState,
        country: "NG",
      },
      parcel: {
        description: "General items",
        weight: 1,
        weight_unit: "kg",
        items: [
          {
            name: "Products",
            description: "Store items",
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

    const res = await fetch('https://sandbox.terminal.africa/v1/rates/shipment/quotes', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk_test_auSbs3NBCSxZ7Fhhpq5wVfffIcRsZOR8',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Terminal API Error:', data);
      return { error: 'Failed to calculate delivery fee.' }
    }

    // Return the cheapest rate
    if (data.data && data.data.length > 0) {
      const rates = data.data.map((r: any) => r.amount);
      const cheapest = Math.min(...rates);
      return { fee: cheapest }
    }

    return { error: 'No delivery carriers available for this route.' }

  } catch (error) {
    console.error(error);
    return { error: 'An error occurred calculating delivery fee.' }
  }
}
