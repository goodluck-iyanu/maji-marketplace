import os

email_content = '''import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = 'Maji <receipt-maji@hoberg.com.ng>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://maji.hoberg.com.ng'

export interface OrderEmailData {
  orderId: string
  paymentReference: string
  customerName: string
  customerEmail: string
  storeName: string
  storeEmail?: string
  storePhone?: string
  storeLogo?: string
  deliveryMethod: string // 'delivery' | 'arrange' | 'digital'
  deliveryAddress: any | null
  deliveryFee: number
  platformFee: number
  processingFee: number
  productSubtotal: number
  totalAmount: number
  orderDate: string
  items: {
    name: string
    description?: string
    quantity: number
    priceAtPurchase: number
    imageUrl?: string
    isDigital: boolean
  }[]
}

export interface SellerEmailData {
  orderId: string
  paymentReference: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  storeName: string
  storeEmail: string
  deliveryMethod: string
  deliveryAddress: any | null
  productSubtotal: number
  orderDate: string
  items: {
    name: string
    quantity: number
    priceAtPurchase: number
    imageUrl?: string
  }[]
}

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildDeliverySection(data: OrderEmailData): string {
  if (data.deliveryMethod === 'digital') {
    return `
      <tr><td style="padding:24px 32px;background:#f0fdf4;border-radius:12px;">
        <h3 style="margin:0 0 8px;color:#15803d;font-size:16px;">📥 Digital Product</h3>
        <p style="margin:0;color:#166534;font-size:14px;">Your payment has been received and your digital product is ready according to the product's delivery/access method. Check your order page for download links.</p>
      </td></tr>
    `
  }
  if (data.deliveryMethod === 'arrange') {
    return `
      <tr><td style="padding:24px 32px;background:#fffbeb;border-radius:12px;">
        <h3 style="margin:0 0 8px;color:#92400e;font-size:16px;">🤝 Arrange with Seller</h3>
        <p style="margin:0;color:#78350f;font-size:14px;">Your payment has been received. Please contact the seller to arrange delivery or collection directly.</p>
        <p style="margin:8px 0 0;color:#78350f;font-size:14px;"><strong>Store:</strong> ${data.storeName}</p>
      </td></tr>
    `
  }
  // delivery method
  const addr = data.deliveryAddress
  const addressParts = [addr?.house_number, addr?.address, addr?.area, addr?.lga, addr?.city, addr?.state].filter(Boolean).join(', ')
  return `
    <tr><td style="padding:24px 32px;background:#eff6ff;border-radius:12px;">
      <h3 style="margin:0 0 12px;color:#1e40af;font-size:16px;">🚚 Delivery Information</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#1e3a5f;">
        <tr><td style="padding:4px 0;"><strong>Recipient:</strong></td><td style="padding:4px 0;">${addr?.recipient_name || data.customerName}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Phone:</strong></td><td style="padding:4px 0;">${addr?.recipient_phone || ''}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Address:</strong></td><td style="padding:4px 0;">${addressParts}</td></tr>
        ${addr?.landmark ? `<tr><td style="padding:4px 0;"><strong>Landmark:</strong></td><td style="padding:4px 0;">${addr.landmark}</td></tr>` : ''}
      </table>
      <p style="margin:12px 0 0;color:#1e40af;font-size:13px;">Your order is currently being prepared. Delivery tracking will become available once your order is handed over to our logistics partner.</p>
    </td></tr>
  `
}

function buildTrackButton(data: OrderEmailData): string {
  if (data.deliveryMethod !== 'delivery') return ''
  const trackUrl = `${APP_URL}/track/${data.paymentReference}`
  return `
    <tr><td style="padding:24px 0;text-align:center;">
      <a href="${trackUrl}" style="display:inline-block;padding:16px 48px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">Track My Order</a>
    </td></tr>
  `
}

function buildOrderEmailHtml(data: OrderEmailData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${item.imageUrl ? `<td width="80" style="padding-right:16px;vertical-align:top;"><img src="${item.imageUrl}" width="80" height="80" style="border-radius:8px;object-fit:cover;display:block;" alt="${item.name}" /></td>` : ''}
          <td style="vertical-align:top;">
            <p style="margin:0;font-weight:600;color:#111;font-size:15px;">${item.name}</p>
            ${item.description ? `<p style="margin:4px 0 0;color:#6b7280;font-size:13px;line-height:1.4;">${item.description.substring(0, 200)}${item.description.length > 200 ? '...' : ''}</p>` : ''}
            <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Qty: ${item.quantity} × ${formatNaira(item.priceAtPurchase)}</p>
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;">
            <p style="margin:0;font-weight:700;color:#111;font-size:15px;">${formatNaira(item.priceAtPurchase * item.quantity)}</p>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Maji Order Confirmation</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
  <!-- HEADER -->
  <tr><td style="background:#000;padding:32px;text-align:center;border-radius:16px 16px 0 0;">
    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">maji</h1>
    <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Your marketplace, your way</p>
  </td></tr>

  ${data.storeLogo ? `
  <!-- STORE LOGO -->
  <tr><td style="background:#fff;padding:32px 32px 0;text-align:center;">
    <img src="${data.storeLogo}" width="80" height="80" style="border-radius:50%;object-fit:cover;display:inline-block;border:2px solid #f3f4f6;" alt="${data.storeName}" />
  </td></tr>
  ` : ''}
  
  <!-- CONFIRMATION BANNER -->
  <tr><td style="background:#fff;padding:32px;text-align:center;border-bottom:1px solid #f3f4f6;">
    <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
      <span style="font-size:32px;">✅</span>
    </div>
    <h2 style="margin:0 0 8px;color:#111;font-size:24px;font-weight:700;">Order Confirmed</h2>
    <p style="margin:0;color:#6b7280;font-size:15px;">Hi ${data.customerName}, we've received your payment and your order is confirmed.</p>
  </td></tr>

  <!-- ORDER META -->
  <tr><td style="background:#fff;padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr><td style="color:#6b7280;padding:4px 0;">Order Reference</td><td style="color:#111;font-weight:600;text-align:right;padding:4px 0;font-family:monospace;">${data.paymentReference}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0;">Order Date</td><td style="color:#111;text-align:right;padding:4px 0;">${formatDate(data.orderDate)}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0;">Store</td><td style="color:#111;font-weight:600;text-align:right;padding:4px 0;">${data.storeName}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0;">Payment Status</td><td style="text-align:right;padding:4px 0;"><span style="background:#dcfce7;color:#15803d;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">Paid</span></td></tr>
      <tr><td style="color:#6b7280;padding:4px 0;">Order Status</td><td style="text-align:right;padding:4px 0;"><span style="background:#dbeafe;color:#1e40af;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">Order Received</span></td></tr>
    </table>
  </td></tr>

  <!-- ITEMS -->
  <tr><td style="background:#fff;padding:8px 32px 24px;">
    <h3 style="margin:0 0 16px;color:#111;font-size:16px;font-weight:700;border-top:1px solid #f3f4f6;padding-top:24px;">Items Ordered</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
    </table>
  </td></tr>

  <!-- PAYMENT SUMMARY -->
  <tr><td style="background:#fff;padding:0 32px 24px;">
    <h3 style="margin:0 0 16px;color:#111;font-size:16px;font-weight:700;border-top:1px solid #f3f4f6;padding-top:24px;">Payment Summary</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr><td style="color:#111;font-weight:700;font-size:18px;padding:4px 0;">Total Paid</td><td style="color:#111;font-weight:700;font-size:18px;text-align:right;padding:4px 0;">${formatNaira(data.totalAmount)}</td></tr>
    </table>
  </td></tr>

  <!-- DELIVERY SECTION -->
  <tr><td style="background:#fff;padding:0 32px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${buildDeliverySection(data)}
    </table>
  </td></tr>

  <!-- TRACK BUTTON -->
  <tr><td style="background:#fff;padding:0 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${buildTrackButton(data)}
    </table>
  </td></tr>

  <!-- STORE CONTACT INFO -->
  ${(data.storeEmail || data.storePhone) ? `
  <tr><td style="background:#fff;padding:24px 32px;border-top:1px solid #f3f4f6;text-align:center;">
    <p style="margin:0 0 8px;color:#111;font-weight:600;font-size:15px;">Questions about your order?</p>
    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Contact the store owner directly:</p>
    <p style="margin:0;color:#111;font-size:14px;">
      ${data.storeEmail ? `<a href="mailto:${data.storeEmail}" style="color:#1e40af;text-decoration:none;">${data.storeEmail}</a>` : ''}
      ${data.storeEmail && data.storePhone ? ' • ' : ''}
      ${data.storePhone ? `<a href="tel:${data.storePhone}" style="color:#1e40af;text-decoration:none;">${data.storePhone}</a>` : ''}
    </p>
  </td></tr>
  ` : ''}

  <!-- FOOTER -->
  <tr><td style="background:#fff;padding:24px 32px 32px;text-align:center;border-radius:0 0 16px 16px;border-top:1px solid #f3f4f6;">
    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">Need help? Contact us at <a href="mailto:support.hoberg@gmail.com" style="color:#111;">support.hoberg@gmail.com</a></p>
    <p style="margin:0;color:#d1d5db;font-size:12px;">© ${new Date().getFullYear()} Maji Marketplace. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
  `
}

function buildSellerEmailHtml(data: SellerEmailData): string {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${item.imageUrl ? `<td width="48" style="padding-right:12px;vertical-align:top;"><img src="${item.imageUrl}" width="48" height="48" style="border-radius:6px;object-fit:cover;display:block;" alt="${item.name}" /></td>` : ''}
          <td style="vertical-align:top;">
            <p style="margin:0;font-weight:600;color:#111;font-size:14px;">${item.name}</p>
            <p style="margin:2px 0 0;color:#6b7280;font-size:12px;">Qty: ${item.quantity} × ${formatNaira(item.priceAtPurchase)}</p>
          </td>
          <td style="vertical-align:top;text-align:right;white-space:nowrap;">
            <p style="margin:0;font-weight:700;color:#111;font-size:14px;">${formatNaira(item.priceAtPurchase * item.quantity)}</p>
          </td>
        </tr></table>
      </td>
    </tr>
  `).join('')

  let deliveryMessage = ''
  if (data.deliveryMethod === 'delivery') {
    deliveryMessage = `<p style="margin:12px 0 0;color:#6b7280;font-size:15px;line-height:1.5;">A rider will come to pick the product up by tomorrow. A message from the driver will be sent to you, and you might get a call from them.</p>`
  } else if (data.deliveryMethod === 'arrange') {
    deliveryMessage = `<p style="margin:12px 0 0;color:#6b7280;font-size:15px;line-height:1.5;">The buyer opted to arrange delivery/pickup directly with you. Please reach out to them to coordinate.</p>`
  } else {
    deliveryMessage = `<p style="margin:12px 0 0;color:#6b7280;font-size:15px;line-height:1.5;">This order contains digital products which the buyer can now access automatically.</p>`
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New Order on Maji</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
  <!-- HEADER -->
  <tr><td style="background:#000;padding:32px;text-align:center;border-radius:16px 16px 0 0;">
    <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">maji</h1>
    <p style="margin:8px 0 0;color:#9ca3af;font-size:13px;">Seller Dashboard</p>
  </td></tr>
  
  <!-- ALERT BANNER -->
  <tr><td style="background:#fff;padding:32px;text-align:center;border-bottom:1px solid #f3f4f6;">
    <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
      <span style="font-size:32px;">🎉</span>
    </div>
    <h2 style="margin:0 0 8px;color:#111;font-size:24px;font-weight:700;">New Order Paid!</h2>
    <p style="margin:0;color:#111;font-size:15px;font-weight:500;">Hi ${data.storeName}, someone has just paid for an order.</p>
    ${deliveryMessage}
  </td></tr>

  <!-- BUYER META -->
  <tr><td style="background:#fff;padding:24px 32px;">
    <h3 style="margin:0 0 16px;color:#111;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Buyer Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;background:#f9fafb;padding:16px;border-radius:8px;">
      <tr><td style="color:#6b7280;padding:4px 0;">Name</td><td style="color:#111;font-weight:600;text-align:right;padding:4px 0;">${data.customerName}</td></tr>
      <tr><td style="color:#6b7280;padding:4px 0;">Email</td><td style="color:#111;text-align:right;padding:4px 0;"><a href="mailto:${data.customerEmail}" style="color:#1e40af;text-decoration:none;">${data.customerEmail}</a></td></tr>
      ${data.customerPhone ? `<tr><td style="color:#6b7280;padding:4px 0;">Phone</td><td style="color:#111;text-align:right;padding:4px 0;"><a href="tel:${data.customerPhone}" style="color:#1e40af;text-decoration:none;">${data.customerPhone}</a></td></tr>` : ''}
    </table>
  </td></tr>

  <!-- ITEMS -->
  <tr><td style="background:#fff;padding:8px 32px 24px;">
    <h3 style="margin:0 0 16px;color:#111;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Items to Fulfill</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemRows}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;border-top:2px solid #111;padding-top:12px;">
      <tr>
        <td style="color:#111;font-weight:700;font-size:16px;">Product Revenue</td>
        <td style="color:#15803d;font-weight:700;font-size:16px;text-align:right;">${formatNaira(data.productSubtotal)}</td>
      </tr>
    </table>
    <p style="margin:12px 0 0;color:#6b7280;font-size:12px;text-align:right;">This amount will automatically settle to your bank account.</p>
  </td></tr>

  <!-- ACTION BUTTON -->
  <tr><td style="background:#fff;padding:0 32px 32px;text-align:center;">
    <a href="${APP_URL}/dashboard/orders" style="display:inline-block;padding:14px 40px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">View Order in Dashboard</a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#fff;padding:24px 32px 32px;text-align:center;border-radius:0 0 16px 16px;border-top:1px solid #f3f4f6;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">This email was sent to ${data.storeEmail}</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>
  `
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const hasDigital = data.items.some(i => i.isDigital)
    let subject: string
    if (data.deliveryMethod === 'digital' || hasDigital) {
      subject = `Your Maji order is confirmed — ${data.paymentReference}`
    } else if (data.deliveryMethod === 'arrange') {
      subject = `Your Maji order has been received — ${data.paymentReference}`
    } else {
      subject = `Your Maji order has been received — ${data.paymentReference}`
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject,
      html: buildOrderEmailHtml(data),
    })

    if (error) {
      console.error('[Maji Email] Failed to send order confirmation:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[Maji Email] Exception sending email:', err)
    return { success: false, error: err.message || 'Unknown email error' }
  }
}

export async function sendSellerNewOrderEmail(data: SellerEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.storeEmail,
      subject: `New Order! 🎉 You've got a new order on Maji — ${data.paymentReference}`,
      html: buildSellerEmailHtml(data),
    })

    if (error) {
      console.error('[Maji Email] Failed to send seller new order email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('[Maji Email] Exception sending seller email:', err)
    return { success: false, error: err.message || 'Unknown email error' }
  }
}
'''

with open('src/lib/email.ts', 'w', encoding='utf-8') as f:
    f.write(email_content)
print("Updated src/lib/email.ts successfully!")
