const crypto = require('crypto');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const secretMatch = env.match(/PAYSTACK_SECRET_KEY=(.*)/);

if (!secretMatch) {
    console.error('Missing PAYSTACK_SECRET_KEY');
    process.exit(1);
}

const secretKey = secretMatch[1].trim();
const payload = JSON.stringify({
    event: 'charge.success',
    data: {
        reference: 'ORD-51fa6656-8f2c-4bba-848f-65d9b5ba78b4',
        status: 'success',
        amount: 312400
    }
});

const hash = crypto.createHmac('sha512', secretKey).update(payload).digest('hex');

console.log('Payload:', payload);
console.log('Signature:', hash);
console.log('Run this in another terminal if the server is running, or we can use fetch here if the server is up');
