const fs = require('fs');

// Fix actions.ts
const actionsPath = 'src/app/store/[storeSlug]/checkout/actions.ts';
let content = fs.readFileSync(actionsPath, 'utf8');
content = content.replace('total_amount: totalAmount,\n      payment_reference: reference,', 'total_amount: totalAmount,\n      product_subtotal: itemTotal,\n      platform_fee: Math.round(itemTotal * 0.04 + 50),\n      payment_reference: reference,');
fs.writeFileSync(actionsPath, content, 'utf8');

// Fix dashboard page.tsx logic
const dashboardPath = 'src/app/(dashboard)/dashboard/page.tsx';
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
dashboardContent = dashboardContent.replace(
  'Number(order.product_subtotal || order.total_amount)',
  '(order.product_subtotal !== null && order.product_subtotal > 0) ? Number(order.product_subtotal) : Number(order.total_amount)'
);
dashboardContent = dashboardContent.replace(
  'Number(order.product_subtotal || order.total_amount).toLocaleString()',
  '((order.product_subtotal !== null && order.product_subtotal > 0) ? Number(order.product_subtotal) : Number(order.total_amount)).toLocaleString()'
);
fs.writeFileSync(dashboardPath, dashboardContent, 'utf8');

console.log('Fixed actions and dashboard.');
