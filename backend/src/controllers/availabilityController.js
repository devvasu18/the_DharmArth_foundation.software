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

// Get availability for a date range
exports.getAvailability = async (req, res) => {
    try {
        const { startDate, endDate, doctorId, type } = req.query;

        const filter = {};

        if (startDate && endDate) {
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
