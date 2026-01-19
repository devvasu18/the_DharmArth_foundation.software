const Doctor = require('../models/Doctor');
const DoctorAvailability = require('../models/DoctorAvailability');

// Get all doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const { type, isActive } = req.query;
        const filter = {};

        if (type) filter.type = type;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const doctors = await Doctor.find(filter).sort({ priority: -1, name: 1 });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctors', error: error.message });
    }
};

// Get single doctor
exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctor', error: error.message });
    }
};

// Create doctor
exports.createDoctor = async (req, res) => {
    try {
        const doctor = new Doctor(req.body);
        await doctor.save();
        res.status(201).json(doctor);
    } catch (error) {
        res.status(400).json({ message: 'Error creating doctor', error: error.message });
    }
};

// Update doctor
exports.updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(400).json({ message: 'Error updating doctor', error: error.message });
    }
};

// Delete doctor
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Also delete all availability records for this doctor
        await DoctorAvailability.deleteMany({ doctorId: req.params.id });

        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting doctor', error: error.message });
    }
};

// Toggle emergency availability
exports.toggleEmergencyAvailability = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.isEmergencyAvailable = !doctor.isEmergencyAvailable;
        await doctor.save();

        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling emergency availability', error: error.message });
    }
};

// Get emergency available doctors
exports.getEmergencyDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find({
            isEmergencyAvailable: true,
            isActive: true
        }).sort({ priority: -1, name: 1 });

        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emergency doctors', error: error.message });
    }
};
