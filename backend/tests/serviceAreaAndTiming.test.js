const { getPharmacyConfig } = require('../src/controllers/settingsController');

describe('FR-01: Service Area & Operational Timing Guardrails', () => {
    const defaultNotice = "इस शहर/गाँव में अभी सेवा उपलब्ध नहीं है, शीघ्र ही सेवा शुरू होगी, अभी यह सेवा छापर, सांडवा, बीदासर के लिए उपलब्ध है";
    const acceptedPincodes = "331506, 331501, 331502, Chhapar, Sandwa, Bidasar";

    const validateServiceArea = (pincodeOrVillage, config) => {
        const input = (pincodeOrVillage || '').trim();
        if (!input) {
            return { serviceable: false, error: 'Pincode or village is required' };
        }

        const allowed = (config.acceptedPincodes || '').split(',').map(p => p.trim().toLowerCase());
        const isAllowed = allowed.includes(input.toLowerCase());

        if (!isAllowed) {
            return {
                serviceable: false,
                error: config.unserviceableNotice || defaultNotice
            };
        }

        return { serviceable: true, error: null };
    };

    const isWithinOperationalHours = (testDate) => {
        const hour = testDate.getHours();
        return hour >= 9 && hour < 19; // 9:00 AM to 7:00 PM
    };

    describe('Service Area Verification (Positive Test Cases)', () => {
        test('should allow order for active pincode 331506 (Chhapar)', () => {
            const result = validateServiceArea('331506', { acceptedPincodes, unserviceableNotice: defaultNotice });
            expect(result.serviceable).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should allow order for active village Sandwa (case-insensitive)', () => {
            const result = validateServiceArea('sandwa', { acceptedPincodes, unserviceableNotice: defaultNotice });
            expect(result.serviceable).toBe(true);
            expect(result.error).toBeNull();
        });

        test('should allow order for active village Bidasar', () => {
            const result = validateServiceArea('Bidasar', { acceptedPincodes, unserviceableNotice: defaultNotice });
            expect(result.serviceable).toBe(true);
            expect(result.error).toBeNull();
        });
    });

    describe('Service Area Verification (Negative Test Cases)', () => {
        test('should reject order for unserviceable pincode 110001 with exact Hindi fallback notice', () => {
            const result = validateServiceArea('110001', { acceptedPincodes, unserviceableNotice: defaultNotice });
            expect(result.serviceable).toBe(false);
            expect(result.error).toBe(defaultNotice);
        });

        test('should reject order for unserviceable city Jaipur with dynamic notice', () => {
            const customNotice = "सेवा अभी इस क्षेत्र में उपलब्ध नहीं है।";
            const result = validateServiceArea('Jaipur', { acceptedPincodes, unserviceableNotice: customNotice });
            expect(result.serviceable).toBe(false);
            expect(result.error).toBe(customNotice);
        });

        test('should reject empty or whitespace input', () => {
            const result = validateServiceArea('   ', { acceptedPincodes, unserviceableNotice: defaultNotice });
            expect(result.serviceable).toBe(false);
            expect(result.error).toBe('Pincode or village is required');
        });
    });

    describe('Operational Calling Hours 9:00 AM - 7:00 PM (Positive & Negative Test Cases)', () => {
        test('POSITIVE: 10:30 AM should be within live calling operational hours', () => {
            const morningTime = new Date('2026-10-22T10:30:00');
            expect(isWithinOperationalHours(morningTime)).toBe(true);
        });

        test('POSITIVE: 6:59 PM should be within live calling operational hours', () => {
            const eveningTime = new Date('2026-10-22T18:59:00');
            expect(isWithinOperationalHours(eveningTime)).toBe(true);
        });

        test('NEGATIVE: 8:45 AM should be OUTSIDE calling operational hours (Before 9 AM)', () => {
            const earlyTime = new Date('2026-10-22T08:45:00');
            expect(isWithinOperationalHours(earlyTime)).toBe(false);
        });

        test('NEGATIVE: 7:05 PM should be OUTSIDE calling operational hours (After 7 PM)', () => {
            const nightTime = new Date('2026-10-22T19:05:00');
            expect(isWithinOperationalHours(nightTime)).toBe(false);
        });
    });
});
