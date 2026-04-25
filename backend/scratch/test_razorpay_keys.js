require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function testOrder() {
    try {
        console.log('Testing Razorpay Order Creation with provided keys...');
        const order = await razorpay.orders.create({
            amount: 100, // 1 INR
            currency: 'INR',
            receipt: 'test_receipt_123'
        });
        console.log('✅ Order Created Successfully:', order.id);
    } catch (error) {
        console.error('❌ Failed to create order:', error.message);
    }
}

testOrder();
