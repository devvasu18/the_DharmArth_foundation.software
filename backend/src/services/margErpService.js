const Medicine = require('../models/Medicine');

/**
 * Simulated MARG ERP Service
 * In a real production environment, this would call MARG ERP APIs.
 */
class MargErpService {
    /**
     * Check stock and price for a list of medicines
     * @param {Array} items - [{ name: string, quantity: number }]
     * @returns {Promise<Array>} - Verified items with prices and availability
     */
    static async checkStockAndPrice(items) {
        const verifiedItems = [];

        for (const item of items) {
            const medicine = await Medicine.findOne({ name: new RegExp(item.name, 'i') });

            if (medicine) {
                const hasStock = medicine.stock >= (item.quantity || 1);
                verifiedItems.push({
                    medicineName: medicine.name,
                    price: medicine.price,
                    isAvailable: hasStock,
                    stock: medicine.stock,
                    alternativeSuggested: hasStock ? null : await this.findAlternative(medicine.category, medicine._id)
                });
            } else {
                verifiedItems.push({
                    medicineName: item.name,
                    isAvailable: false,
                    alternativeSuggested: "Medicine not found in local database"
                });
            }
        }

        return verifiedItems;
    }

    static async findAlternative(category, excludeId) {
        if (!category) return "Consult pharmacist";
        const alternative = await Medicine.findOne({ 
            category, 
            _id: { $ne: excludeId },
            stock: { $gt: 0 }
        });
        return alternative ? alternative.name : "No alternative in stock";
    }

    /**
     * Sync local stocks with MARG ERP (Mock)
     */
    static async syncStocks() {
        console.log("Syncing with MARG ERP...");
        // This would be an API call to MARG
        return true;
    }
}

module.exports = MargErpService;
