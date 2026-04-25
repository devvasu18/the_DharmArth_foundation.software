const crypto = require('crypto');

function verifySignature(order_id, payment_id, secret, signature) {
    const body = order_id + "|" + payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');
    return expectedSignature === signature;
}

// Mock Test
const mockSecret = 'test_secret';
const mockOrderId = 'order_DAF123';
const mockPaymentId = 'pay_DAF456';

const mockSignature = crypto
    .createHmac('sha256', mockSecret)
    .update(mockOrderId + "|" + mockPaymentId)
    .digest('hex');

console.log('Testing Signature Verification:');
console.log('Generated Signature:', mockSignature);
const isValid = verifySignature(mockOrderId, mockPaymentId, mockSecret, mockSignature);
console.log('Is Valid:', isValid);

if (isValid) {
    console.log('✅ Signature verification logic is correct.');
} else {
    console.error('❌ Signature verification logic is WRONG.');
    process.exit(1);
}

// Webhook Test
function verifyWebhook(payload, secret, signature) {
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    return expectedSignature === signature;
}

const webhookPayload = JSON.stringify({ event: 'payment.captured', payload: {} });
const webhookSecret = 'wh_secret';
const webhookSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(webhookPayload)
    .digest('hex');

console.log('\nTesting Webhook Verification:');
const isWebhookValid = verifyWebhook(webhookPayload, webhookSecret, webhookSignature);
console.log('Is Webhook Valid:', isWebhookValid);

if (isWebhookValid) {
    console.log('✅ Webhook verification logic is correct.');
} else {
    console.error('❌ Webhook verification logic is WRONG.');
    process.exit(1);
}
