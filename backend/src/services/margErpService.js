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
            // First check if Admin has manually overridden/provided a valid price > 0
            if (item.price && !isNaN(item.price) && item.price > 0) {
                // Trust the Admin's manual entry completely
                verifiedItems.push({
                    medicineName: item.medicineName || item.name,
                    price: Number(item.price),
                    isAvailable: true, // Manual entry implies intentional availability
                    stock: item.quantity || 999,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    time: item.time,
                    foodRelation: item.foodRelation,
                    intakeMethod: item.intakeMethod,
                    duration: item.duration,
                    quantity: item.quantity || 1,
                    alternativeSuggested: null
                });
                continue; // Skip DB lookup
            }

            // Fallback to strict DB simulation if no manual price is given
            const medicineNameQuery = item.medicineName || item.name;
            const medicine = await Medicine.findOne({ name: new RegExp(medicineNameQuery, 'i') });

            if (medicine) {
                const hasStock = medicine.stock >= (item.quantity || 1);
                verifiedItems.push({
                    medicineName: medicine.name,
                    price: medicine.price,
                    isAvailable: hasStock,
                    stock: medicine.stock,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    time: item.time,
                    foodRelation: item.foodRelation,
                    intakeMethod: item.intakeMethod,
                    duration: item.duration,
                    quantity: item.quantity || 1,
                    alternativeSuggested: hasStock ? null : await this.findAlternative(medicine.category, medicine._id)
                });
            } else {
                verifiedItems.push({
                    medicineName: medicineNameQuery,
                    isAvailable: false,
                    alternativeSuggested: "Medicine not found in local database. Admin needs to specify a manual price."
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
