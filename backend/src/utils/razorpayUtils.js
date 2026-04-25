const razorpay = require('../config/razorpay');

/**
 * Get or Create a Razorpay Plan for a specific amount.
 * Plans are fixed-amount monthly recurring entities.
 */
const getOrCreatePlan = async (amount) => {
    const amountInPaise = Math.round(amount * 100);
    
    try {
        // 1. List plans to see if one already exists for this amount
        // Note: For high volume, you'd want to cache this in your DB.
        const plans = await razorpay.plans.all({ count: 100 });
        
        const existingPlan = plans.items.find(p => 
            p.item.amount === amountInPaise && 
            p.period === 'monthly' && 
            p.interval === 1
        );
        
        if (existingPlan) {
            return existingPlan.id;
        }
        
        // 2. If not found, create a new plan
        const newPlan = await razorpay.plans.create({
            period: 'monthly',
            interval: 1,
            item: {
                name: `Monthly Donation ₹${amount}`,
                amount: amountInPaise,
                currency: 'INR',
                description: `Recurring monthly donation of ₹${amount}`
            }
        });
        
        return newPlan.id;
    } catch (error) {
        console.error('Razorpay Plan Error:', error);
        throw new Error('Failed to retrieve or create payment plan');
    }
};

module.exports = { getOrCreatePlan };
