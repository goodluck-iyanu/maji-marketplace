export async function initializeTransaction(params: {
  amount: number;
  email: string;
  reference: string;
  subaccount?: string; // Optional: for split payments to the seller
  metadata?: any;
}) {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100), // Paystack expects amount in kobo
      email: params.email,
      reference: params.reference,
      subaccount: params.subaccount,
      metadata: params.metadata,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/verify`, // Fallback redirect
    }),
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Failed to initialize Paystack transaction');
  }

  return data.data; // { authorization_url, access_code, reference }
}

export async function verifyTransaction(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const data = await response.json();
  return data;
}

export async function createSubaccount(params: {
  business_name: string;
  settlement_bank: string;
  account_number: string;
  percentage_charge: number;
}) {
  const response = await fetch('https://api.paystack.co/subaccount', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();
  if (!data.status) {
    throw new Error(data.message || 'Failed to create subaccount');
  }
  return data.data;
}

