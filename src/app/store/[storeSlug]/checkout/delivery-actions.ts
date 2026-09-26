'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDeliveryQuotes(storeId: string, deliveryAddressInfo: any) {
  try {
    const supabase = await createClient()
    
    // Fetch store structured pickup address
    const { data: store } = await supabase
      .from('stores')
      .select('pickup_address, pickup_state, pickup_city, pickup_zip, pickup_contact_name, pickup_email, pickup_phone')
      .eq('id', storeId)
      .single()
      
    if (!store) {
      return { error: 'Store not found.' }
    }

    let pickupState = store.pickup_state
    let pickupCity = store.pickup_city

    if (!pickupState) {
      // Legacy fallback
      const states = ["Abia","Abuja","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
      for (const st of states) {
        if ((store.pickup_address ?? '').toLowerCase().includes(st.toLowerCase())) {
          pickupState = st;
          break;
        }
      }
      if (!pickupState) pickupState = 'Lagos';
      if (!pickupCity) pickupCity = pickupState;
    }

    if (!pickupState || !pickupCity) {
      return { error: 'Seller pickup location is incomplete.' }
    }

    const payload = {
      pickup_address: {
        first_name: store.pickup_contact_name ? store.pickup_contact_name.split(' ')[0] : "Seller",
        last_name: store.pickup_contact_name ? store.pickup_contact_name.split(' ').slice(1).join(' ') : "Store",
        line1: (store.pickup_address ?? pickupCity).substring(0, 80),
        city: pickupCity,
        state: pickupState,
        country: "NG",
        zip: store.pickup_zip || undefined,
        email: store.pickup_email || "seller@maji.hoberg.com.ng",
        phone: store.pickup_phone || "08000000000"
      },
      delivery_address: {
        first_name: deliveryAddressInfo.firstName || "Customer",
        last_name: deliveryAddressInfo.lastName || "Buyer",
        line1: (deliveryAddressInfo.line1 || deliveryAddressInfo.city).substring(0, 80),
        city: deliveryAddressInfo.city,
        state: deliveryAddressInfo.state,
        country: "NG",
        zip: deliveryAddressInfo.zip || undefined,
        email: deliveryAddressInfo.email || "buyer@maji.hoberg.com.ng",
        phone: deliveryAddressInfo.phone || "08000000000"
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
      console.error('Terminal API Error:', data.message);
      return { error: data.message || 'Failed to calculate delivery fee.' }
    }

    // Return the cheapest rate
    if (data.data && data.data.length > 0) {
      const sorted = [...data.data].sort((a, b) => a.amount - b.amount);
      const cheapest = sorted[0];
      return { 
        fee: cheapest.amount,
        carrier: cheapest.carrier_name,
        eta: cheapest.delivery_time,
        allRates: data.data.map((r: any) => ({ 
          fee: r.amount, 
          carrier: r.carrier_name, 
          eta: r.delivery_time 
        })).sort((a: any, b: any) => a.fee - b.fee)
      }
    }

    return { error: 'No delivery carriers available for this route.' }

  } catch (error) {
    console.error(error);
    return { error: 'An error occurred calculating delivery fee.' }
  }
}
