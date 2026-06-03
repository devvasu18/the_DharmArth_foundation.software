const DoctorFAQ = require('../models/DoctorFAQ');

const initialFaqs = [
    {
        question: "Do I need an appointment for the Government Hospital?",
        answer: "For general visits, appointments are on a first-come, first-served basis. However, specialized consultations may require prior booking.",
        order: 1,
        isVisible: true
    },
    {
        question: "What documents do I need to carry?",
        answer: "Please carry a valid government ID (Aadhar Card/Voter ID) and any previous medical records or prescriptions for a better diagnosis.",
        order: 2,
        isVisible: true
    },
    {
        question: "Can I book medical tests online?",
        answer: "Yes, you can browse available tests in the section above and book them directly. You will receive a confirmation time via SMS.",
        order: 3,
        isVisible: true
    },
    {
        question: "Is emergency care available 24/7?",
        answer: "Yes, our emergency doctors are available 24/7. Look for the 'Emergency Available' badge on doctor cards or visit the Emergency section immediately.",
        order: 4,
        isVisible: true
    }
];

// Get all FAQs
exports.getAllDoctorFaqs = async (req, res) => {
    try {
        const { isVisible } = req.query;
        const filter = {};

        if (isVisible !== undefined) {
            filter.isVisible = isVisible === 'true';
        }

        let faqs = await DoctorFAQ.find(filter).sort({ order: 1, createdAt: 1 });

        // Seed FAQs if database is empty and we are looking for all/visible FAQs
        if (faqs.length === 0 && (isVisible === undefined || isVisible === 'true')) {
            const count = await DoctorFAQ.countDocuments({});
            if (count === 0) {
                console.log("[DoctorFAQ] Seeding initial FAQs...");
                await DoctorFAQ.insertMany(initialFaqs);
                faqs = await DoctorFAQ.find(filter).sort({ order: 1, createdAt: 1 });
            }
        }

        res.json(faqs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Doctor FAQs', error: error.message });
    }
};

// Get single FAQ
exports.getDoctorFaqById = async (req, res) => {
    try {
        const faq = await DoctorFAQ.findById(req.params.id);
        if (!faq) {
            return res.status(404).json({ message: 'Doctor FAQ not found' });
        }
        res.json(faq);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching FAQ', error: error.message });
    }
};

// Create FAQ
exports.createDoctorFaq = async (req, res) => {
    try {
        const faq = new DoctorFAQ(req.body);
        await faq.save();
        res.status(201).json(faq);
    } catch (error) {
        res.status(400).json({ message: 'Error saving FAQ', error: error.message });
    }
};

// Update FAQ
exports.updateDoctorFaq = async (req, res) => {
    try {
        const faq = await DoctorFAQ.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!faq) {
            return res.status(404).json({ message: 'Doctor FAQ not found' });
        }
        res.json(faq);
    } catch (error) {
        res.status(400).json({ message: 'Error updating FAQ', error: error.message });
    }
};

// Delete FAQ
exports.deleteDoctorFaq = async (req, res) => {
    try {
        const faq = await DoctorFAQ.findByIdAndDelete(req.params.id);
        if (!faq) {
            return res.status(404).json({ message: 'Doctor FAQ not found' });
        }
        res.json({ message: 'Doctor FAQ deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting FAQ', error: error.message });
    }
};
