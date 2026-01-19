const DoctorAvailability = require('../models/DoctorAvailability');
const Doctor = require('../models/Doctor');

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

        let availability = await DoctorAvailability.find(filter)
            .populate('doctorId')
            .sort({ date: 1 });

        // Filter by doctor type if specified
        if (type) {
            availability = availability.filter(avail =>
                avail.doctorId && avail.doctorId.type === type
            );
        }

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

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        let availability = await DoctorAvailability.find({
            date: {
                $gte: targetDate,
                $lt: nextDay
            },
            isEnabled: true
        }).populate('doctorId');

        // Filter by doctor type and active status
        availability = availability.filter(avail =>
            avail.doctorId &&
            avail.doctorId.isActive &&
            (!type || avail.doctorId.type === type)
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

        const { doctorId, date, dayName, timeSlots, isEnabled, emergencyAvailable, notes } = req.body;

        // Validate required fields
        if (!doctorId) {
            return res.status(400).json({ message: 'Doctor ID is required' });
        }
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }
        if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
            return res.status(400).json({ message: 'At least one time slot is required' });
        }

        // Check if doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Find existing availability
        let availability = await DoctorAvailability.findOne({
            doctorId,
            date: targetDate
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

        let availability = await DoctorAvailability.find({
            date: {
                $gte: today,
                $lt: nextWeek
            },
            isEnabled: true
        }).populate('doctorId').sort({ date: 1 });

        // Filter by doctor type and active status
        availability = availability.filter(avail =>
            avail.doctorId &&
            avail.doctorId.isActive &&
            (!type || avail.doctorId.type === type)
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
            const targetDate = new Date(avail.date);
            targetDate.setHours(0, 0, 0, 0);

            // Check if already exists
            let existing = await DoctorAvailability.findOne({
                doctorId,
                date: targetDate
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
