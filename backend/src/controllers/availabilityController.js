const DoctorAvailability = require('../models/DoctorAvailability');
const Doctor = require('../models/Doctor');

// Helper to normalize any incoming date string/object to UTC midnight
const getUTCMidnight = (dateInput) => {
    if (!dateInput) return null;
    const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
    return new Date(dateStr.substring(0, 10) + 'T00:00:00.000Z');
};

// Helper to check for time overlaps between two sets of slots
const hasTimeOverlap = (slots1, slots2) => {
    for (const s1 of slots1) {
        if (s1.status === 'Not Available') continue;
        const [h1s, m1s] = s1.startTime.split(':').map(Number);
        const [h1e, m1e] = s1.endTime.split(':').map(Number);
        const start1 = h1s * 60 + m1s;
        const end1 = h1e * 60 + m1e;

        for (const s2 of slots2) {
            if (s2.status === 'Not Available') continue;
            const [h2s, m2s] = s2.startTime.split(':').map(Number);
            const [h2e, m2e] = s2.endTime.split(':').map(Number);
            const start2 = h2s * 60 + m2s;
            const end2 = h2e * 60 + m2e;

            if (start1 < end2 && end1 > start2) {
                return { overlap: true, slot1: s1, slot2: s2 };
            }
        }
    }
    return { overlap: false };
};

const ensureAvailabilityRecordsForDateRange = async (startDate, endDate, doctorId) => {
    const start = getUTCMidnight(startDate);
    const end = getUTCMidnight(endDate);
    if (!start || !end) return;

    let doctors = [];
    if (doctorId) {
        const doc = await Doctor.findById(doctorId);
        if (doc) doctors.push(doc);
    } else {
        doctors = await Doctor.find({ isActive: true });
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const newRecords = [];

    // Query all existing availability records for these doctors in the date range in ONE database call
    const existingRecords = await DoctorAvailability.find({
        doctorId: { $in: doctors.map(d => d._id) },
        date: { $gte: start, $lte: end }
    });

    // Create a fast lookup map
    const existingMap = new Map();
    for (const record of existingRecords) {
        const docId = record.doctorId.toString();
        const dateKey = record.date.toISOString().substring(0, 10);
        const hType = record.hospitalType;
        existingMap.set(`${docId}_${dateKey}_${hType}`, record);
    }

    for (const doc of doctors) {
        let currentDate = new Date(start);
        while (currentDate <= end) {
            const targetDate = new Date(currentDate);
            const dateNum = targetDate.getUTCDate();
            const dayOfWeek = targetDate.getUTCDay();
            const dayName = dayNames[dayOfWeek];

            const hTypes = [];
            if (doc.type === 'government' || doc.type === 'both') {
                hTypes.push('government');
            }
            if (doc.type === 'clinic' || doc.type === 'both') {
                hTypes.push('clinic');
            }

            for (const hType of hTypes) {
                const dateKey = targetDate.toISOString().substring(0, 10);
                const existing = existingMap.get(`${doc._id.toString()}_${dateKey}_${hType}`);

                if (!existing) {
                    let finalSlots = [];
                    let isEnabled = true;
                    let emergencyAvailable = false;
                    let notes = '';

                    // 1. Date-specific override
                    const dateOverride = (doc.dateSpecificTimeSlots || []).find(slot => slot.dateNumber === dateNum);
                    if (dateOverride) {
                        const overriddenSlots = dateOverride.timeSlots.filter(s => s.hospitalType === hType);
                        finalSlots = overriddenSlots.map(s => ({
                            period: s.period,
                            startTime: s.startTime,
                            endTime: s.endTime,
                            status: 'Available'
                        }));
                        isEnabled = true;
                        emergencyAvailable = doc.isEmergencyAvailable || false;
                    } else {
                        // 2. Carry forward from previous month
                        const targetYear = targetDate.getUTCFullYear();
                        const targetMonth = targetDate.getUTCMonth();
                        const prevMonthStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
                        const prevMonthEnd = new Date(Date.UTC(targetYear, targetMonth, 0));

                        const prevRecords = await DoctorAvailability.find({
                            doctorId: doc._id,
                            date: { $gte: prevMonthStart, $lte: prevMonthEnd },
                            hospitalType: hType
                        }).sort({ date: 1 });

                        const sameWeekdayRecords = prevRecords.filter(r => r.date.getUTCDay() === dayOfWeek);
                        const targetOccurrenceIndex = Math.floor((dateNum - 1) / 7);

                        let carryForwardRecord = sameWeekdayRecords.find(r => Math.floor((r.date.getUTCDate() - 1) / 7) === targetOccurrenceIndex);
                        if (!carryForwardRecord && sameWeekdayRecords.length > 0) {
                            carryForwardRecord = sameWeekdayRecords[sameWeekdayRecords.length - 1];
                        }

                        if (carryForwardRecord) {
                            finalSlots = carryForwardRecord.timeSlots.map(s => ({
                                period: s.period,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                status: s.status || 'Available'
                            }));
                            isEnabled = carryForwardRecord.isEnabled;
                            emergencyAvailable = carryForwardRecord.emergencyAvailable;
                            notes = carryForwardRecord.notes || '';
                        } else {
                            // 3. Fall back to default weekly slots
                            const defaultSlots = (doc.defaultTimeSlots || []).filter(s => s.hospitalType === hType);
                            finalSlots = defaultSlots.map(s => ({
                                period: s.period,
                                startTime: s.startTime,
                                endTime: s.endTime,
                                status: 'Available'
                            }));
                            isEnabled = true;
                            emergencyAvailable = doc.isEmergencyAvailable || false;
                        }
                    }

                    newRecords.push({
                        doctorId: doc._id,
                        date: targetDate,
                        dayName,
                        hospitalType: hType,
                        timeSlots: finalSlots,
                        isEnabled,
                        emergencyAvailable,
                        notes,
                        isAutoGenerated: true
                    });
                }
            }

            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
    }

    if (newRecords.length > 0) {
        try {
            await DoctorAvailability.insertMany(newRecords, { ordered: false });
        } catch (err) {
            // Ignore duplicate key errors (code 11000)
            if (err.code !== 11000 && !(err.writeErrors && err.writeErrors.some(e => e.code === 11000))) {
                throw err;
            }
        }
    }
};

// Get availability for a date range
exports.getAvailability = async (req, res) => {
    try {
        const { startDate, endDate, doctorId, type } = req.query;

        const filter = {};

        if (startDate && endDate) {
            await ensureAvailabilityRecordsForDateRange(startDate, endDate, doctorId);
            filter.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (doctorId) {
            filter.doctorId = doctorId;
        }

        // Filter by specific hospital type
        if (type) {
            filter.hospitalType = type;
        }

        let availability = await DoctorAvailability.find(filter)
            .populate('doctorId')
            .sort({ date: 1 });

        // Filter out entries where doctor might be missing or inactive
        availability = availability.filter(avail => avail.doctorId);

        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching availability', error: error.message });
    }
};

// Get availability for specific date
exports.getAvailabilityByDate = async (req, res) => {
    try {
        const { date } = req.params;
        const { type } = req.query;

        const targetDate = getUTCMidnight(date);
        await ensureAvailabilityRecordsForDateRange(targetDate, targetDate);

        const nextDay = new Date(targetDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const query = {
            date: {
                $gte: targetDate,
                $lt: nextDay
            },
            isEnabled: true
        };

        if (type) {
            query.hospitalType = type;
        }

        let availability = await DoctorAvailability.find(query).populate('doctorId');

        // Filter by active status
        availability = availability.filter(avail =>
            avail.doctorId && avail.doctorId.isActive
        );

        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching availability', error: error.message });
    }
};

// Create or update availability
exports.upsertAvailability = async (req, res) => {
    try {
        console.log('Received availability upsert request:', req.body);

        const { doctorId, date, dayName, timeSlots, isEnabled, emergencyAvailable, notes, hospitalType } = req.body;

        // Validate required fields
        if (!doctorId) return res.status(400).json({ message: 'Doctor ID is required' });
        if (!date) return res.status(400).json({ message: 'Date is required' });
        if (!hospitalType) return res.status(400).json({ message: 'Hospital Type is required' });
        if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            return res.status(400).json({ message: 'At least one time slot is required' });
        }

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

        const targetDate = getUTCMidnight(date);

        // CONFLICT PREVENTION: Check if doctor has overlapping shifts in OTHER hospital types on the same day
        const otherHospitalsAvail = await DoctorAvailability.find({
            doctorId,
            date: targetDate,
            hospitalType: { $ne: hospitalType },
            isEnabled: true
        });

        for (const other of otherHospitalsAvail) {
            const overlapCheck = hasTimeOverlap(timeSlots, other.timeSlots);
            if (overlapCheck.overlap) {
                return res.status(400).json({
                    message: `Conflict detected! Doctor is already scheduled at ${other.hospitalType} hospital during ${overlapCheck.slot2.startTime}-${overlapCheck.slot2.endTime}.`,
                    conflictSlot: overlapCheck.slot2,
                    conflictHospital: other.hospitalType
                });
            }
        }

        // Find existing availability for THIS hospital type
        let availability = await DoctorAvailability.findOne({
            doctorId,
            date: targetDate,
            hospitalType
        });

        if (availability) {
            // Update existing
            availability.dayName = dayName;
            availability.timeSlots = timeSlots;
            availability.isEnabled = isEnabled !== undefined ? isEnabled : availability.isEnabled;
            availability.emergencyAvailable = emergencyAvailable !== undefined ? emergencyAvailable : availability.emergencyAvailable;
            availability.notes = notes || availability.notes;
            await availability.save();
        } else {
            // Create new
            availability = new DoctorAvailability({
                doctorId,
                date: targetDate,
                dayName,
                timeSlots,
                hospitalType,
                isEnabled: isEnabled !== undefined ? isEnabled : true,
                emergencyAvailable: emergencyAvailable || false,
                notes: notes || ''
            });
            await availability.save();
        }

        await availability.populate('doctorId');
        res.json(availability);
    } catch (error) {
        console.error('Error in upsertAvailability:', error);
        res.status(400).json({ message: 'Error saving availability', error: error.message });
    }
};

// Delete availability
exports.deleteAvailability = async (req, res) => {
    try {
        const availability = await DoctorAvailability.findByIdAndDelete(req.params.id);
        if (!availability) {
            return res.status(404).json({ message: 'Availability not found' });
        }
        res.json({ message: 'Availability deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting availability', error: error.message });
    }
};

// Get next 7 days availability
exports.getWeekAvailability = async (req, res) => {
    try {
        const { type } = req.query;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        await ensureAvailabilityRecordsForDateRange(today, nextWeek);

        const query = {
            date: {
                $gte: today,
                $lt: nextWeek
            },
            isEnabled: true
        };

        if (type) {
            query.hospitalType = type;
        }

        let availability = await DoctorAvailability.find(query).populate('doctorId').sort({ date: 1 });

        // Filter by active status
        availability = availability.filter(avail =>
            avail.doctorId && avail.doctorId.isActive
        );

        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching week availability', error: error.message });
    }
};

// Bulk create availability for a doctor
exports.bulkCreateAvailability = async (req, res) => {
    try {
        const { doctorId, availabilities } = req.body;

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const created = [];

        for (const avail of availabilities) {
            const targetDate = getUTCMidnight(avail.date);
            const hospitalType = avail.hospitalType || doctor.type; // Default to doctor's primary type if not specified

            // Check if already exists for this hospital
            let existing = await DoctorAvailability.findOne({
                doctorId,
                date: targetDate,
                hospitalType
            });

            if (existing) {
                // Update
                existing.dayName = avail.dayName;
                existing.timeSlots = avail.timeSlots;
                existing.isEnabled = avail.isEnabled !== undefined ? avail.isEnabled : existing.isEnabled;
                existing.emergencyAvailable = avail.emergencyAvailable || existing.emergencyAvailable;
                existing.notes = avail.notes || existing.notes;
                await existing.save();
                created.push(existing);
            } else {
                // Create new
                const newAvail = new DoctorAvailability({
                    doctorId,
                    date: targetDate,
                    dayName: avail.dayName,
                    timeSlots: avail.timeSlots,
                    hospitalType,
                    isEnabled: avail.isEnabled !== undefined ? avail.isEnabled : true,
                    emergencyAvailable: avail.emergencyAvailable || false,
                    notes: avail.notes || ''
                });
                await newAvail.save();
                created.push(newAvail);
            }
        }

        res.json(created);
    } catch (error) {
        res.status(400).json({ message: 'Error bulk creating availability', error: error.message });
    }
};

// Search availability by category and date, with auto-future fallback
exports.getAvailabilitySearch = async (req, res) => {
    try {
        const { hospitalType, categoryId, date } = req.query;

        if (!hospitalType || !categoryId) {
            return res.status(400).json({ message: 'hospitalType and categoryId are required' });
        }

        if (hospitalType !== 'clinic' && !date) {
            return res.status(400).json({ message: 'date is required' });
        }

        // 1. Find all active doctors matching the category and hospital setting
        const doctorQuery = {
            isActive: true,
            type: { $in: [hospitalType, 'both'] }
        };
        if (categoryId !== 'all') {
            doctorQuery.categories = categoryId;
        }

        const doctors = await Doctor.find(doctorQuery);
        if (doctors.length === 0) {
            return res.json({
                available: false,
                selectedDate: date || null,
                nextAvailableDate: null,
                doctors: [],
                message: categoryId === 'all' 
                    ? 'No doctors are registered in this hospital setting.'
                    : 'No doctors of this category are registered in this hospital setting.'
            });
        }

        const doctorIds = doctors.map(d => d._id);

        // Special logic for clinic: no specific date requested, fetch all available dates in current month
        if (hospitalType === 'clinic') {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const startDate = new Date(Date.UTC(year, month, 1));
            const endDate = new Date(Date.UTC(year, month + 1, 0)); // last day of the month

            // Ensure availability records exist for all category doctors for this month
            for (const doc of doctors) {
                await ensureAvailabilityRecordsForDateRange(startDate, endDate, doc._id);
            }

            // Query all availability records in the range
            const availabilities = await DoctorAvailability.find({
                doctorId: { $in: doctorIds },
                date: { $gte: startDate, $lte: endDate },
                hospitalType: 'clinic',
                isEnabled: true
            }).populate({
                path: 'doctorId',
                populate: { path: 'categories' }
            });

            // Filter records where at least one slot is "Available"
            const activeAvailabilities = availabilities.filter(a => 
                a.timeSlots && a.timeSlots.some(s => s.status === 'Available')
            );

            // Group by doctor
            const doctorMap = {};
            for (const avail of activeAvailabilities) {
                if (!avail.doctorId) continue;
                const docId = avail.doctorId._id.toString();
                if (!doctorMap[docId]) {
                    const firstAvailableSlot = avail.timeSlots.find(s => s.status === 'Available');
                    const timing = firstAvailableSlot 
                        ? { startTime: firstAvailableSlot.startTime, endTime: firstAvailableSlot.endTime } 
                        : null;

                    doctorMap[docId] = {
                        _id: docId,
                        doctorId: avail.doctorId,
                        availableDates: [],
                        hospitalType: 'clinic',
                        emergencyAvailable: avail.emergencyAvailable || avail.doctorId.isEmergencyAvailable || false,
                        timing: timing
                    };
                }
                const dayNum = avail.date.getUTCDate();
                if (!doctorMap[docId].availableDates.includes(dayNum)) {
                    doctorMap[docId].availableDates.push(dayNum);
                }
            }

            // Sort days ascending
            for (const docId in doctorMap) {
                doctorMap[docId].availableDates.sort((a, b) => a - b);
            }

            const doctorsData = Object.values(doctorMap).filter(d => d.availableDates.length > 0);

            return res.json({
                available: doctorsData.length > 0,
                hospitalType: 'clinic',
                doctors: doctorsData
            });
        }

        // Standard flow for government hospital (where date is required)
        const targetDate = getUTCMidnight(date);
        if (!targetDate) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // 2. Ensure availability records exist for selected date
        await ensureAvailabilityRecordsForDateRange(targetDate, targetDate);

        // 3. Query availabilities on selected date
        let availabilities = await DoctorAvailability.find({
            doctorId: { $in: doctorIds },
            date: targetDate,
            hospitalType: hospitalType,
            isEnabled: true
        }).populate({
            path: 'doctorId',
            populate: { path: 'categories' }
        });

        // Filter out records where at least one slot is "Available"
        const activeAvailabilities = availabilities.filter(a => 
            a.timeSlots && a.timeSlots.some(s => s.status === 'Available')
        );

        if (activeAvailabilities.length > 0) {
            return res.json({
                available: true,
                selectedDate: date,
                nextAvailableDate: null,
                doctors: activeAvailabilities
            });
        }

        // 4. Fallback: Search future dates up to 60 days
        let futureDate = new Date(targetDate);
        for (let i = 1; i <= 60; i++) {
            futureDate.setUTCDate(futureDate.getUTCDate() + 1);

            // Ensure availability records exist for this future date
            await ensureAvailabilityRecordsForDateRange(futureDate, futureDate);

            const futureAvailabilities = await DoctorAvailability.find({
                doctorId: { $in: doctorIds },
                date: futureDate,
                hospitalType: hospitalType,
                isEnabled: true
            }).populate({
                path: 'doctorId',
                populate: { path: 'categories' }
            });

            const activeFutureAvailabilities = futureAvailabilities.filter(a => 
                a.timeSlots && a.timeSlots.some(s => s.status === 'Available')
            );

            if (activeFutureAvailabilities.length > 0) {
                const nextDateStr = futureDate.toISOString().split('T')[0];
                return res.json({
                    available: false,
                    selectedDate: date,
                    nextAvailableDate: nextDateStr,
                    doctors: activeFutureAvailabilities
                });
            }
        }

        // 5. No upcoming availability found within 60 days
        return res.json({
            available: false,
            selectedDate: date,
            nextAvailableDate: null,
            doctors: [],
            message: 'No doctors of this category are available on the selected date or in the near future.'
        });

    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({ message: 'Error searching availability', error: error.message });
    }
};

// Toggle daily availability for a government doctor
exports.toggleDailyAvailability = async (req, res) => {
    try {
        const { doctorId, date, isEnabled } = req.body;
        if (!doctorId || !date) {
            return res.status(400).json({ message: 'doctorId and date are required' });
        }
        
        const targetDate = getUTCMidnight(date);
        
        // Find existing record
        let availability = await DoctorAvailability.findOne({
            doctorId,
            date: targetDate,
            hospitalType: 'government'
        });
        
        if (availability) {
            availability.isEnabled = isEnabled;
            await availability.save();
        } else {
            // Find doctor to get default slots
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ message: 'Doctor not found' });
            }
            
            // Get government default slots
            const defaultSlots = (doctor.defaultTimeSlots || [])
                .filter(s => s.hospitalType === 'government')
                .map(s => ({
                    period: s.period,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    status: 'Available'
                }));
                
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayName = dayNames[new Date(targetDate).getUTCDay()];
            
            availability = new DoctorAvailability({
                doctorId,
                date: targetDate,
                dayName,
                timeSlots: defaultSlots.length > 0 ? defaultSlots : [
                    { period: 'Morning', startTime: '09:00', endTime: '12:00', status: 'Available' }
                ],
                hospitalType: 'government',
                isEnabled
            });
            await availability.save();
        }
        
        await availability.populate('doctorId');
        res.json(availability);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling availability', error: error.message });
    }
};


