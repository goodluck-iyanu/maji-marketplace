import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail } from './src/lib/email';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmail() {
  const reference = 'ORD-51fa6656-8f2c-4bba-848f-65d9b5ba78b4';
  console.log('Fetching order...');
  
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('payment_reference', reference)
    .single();

  if (!order) {
    console.error('Order not found');
    return;
  }

  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('name')
    .eq('id', order.store_id)
    .single();

  const { data: orderItems } = await supabaseAdmin
    .from('order_items')
    .select('*, products(name, description, is_digital, product_images(image_url, display_order))')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  const items = (orderItems || []).map((item) => {
    const product = item.products;
    const images = product?.product_images || [];
    const sortedImages = [...images].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    return {
      name: product?.name || 'Product',
      description: product?.description || '',
      quantity: item.quantity,
      priceAtPurchase: Number(item.price_at_purchase),
      imageUrl: sortedImages[0]?.image_url || undefined,
      isDigital: product?.is_digital || false,
    };
  });

  console.log('Sending email...');
  const emailResult = await sendOrderConfirmationEmail({
    orderId: order.id,
    paymentReference: order.payment_reference,
    customerName: order.customer_name || 'Customer',
    customerEmail: order.customer_email,
    storeName: store?.name || 'Maji Store',
    deliveryMethod: order.delivery_method || 'digital',
    deliveryAddress: order.delivery_address,
    deliveryFee: Number(order.delivery_fee || 0),
    platformFee: Number(order.platform_fee || 0),
    processingFee: Number(order.processing_fee || 0),
    productSubtotal: Number(order.product_subtotal || 0),
    totalAmount: Number(order.total_amount),
    orderDate: order.created_at,
    items,
  });

  if (emailResult.success) {
    console.log('EMAIL SENT SUCCESSFULLY!');
  } else {
    console.error('EMAIL FAILED TO SEND:', emailResult.error);
  }
}

testEmail().catch(console.error);
