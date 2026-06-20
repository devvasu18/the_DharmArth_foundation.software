const DoctorFAQ = require('../models/DoctorFAQ');

const initialFaqs = [
    {
        question: "Do I need an appointment for the Government Hospital?",
        question_hi: "क्या मुझे सरकारी अस्पताल के लिए अपॉइंटमेंट की आवश्यकता है?",
        answer: "For general visits, appointments are on a first-come, first-served basis. However, specialized consultations may require prior booking.",
        answer_hi: "सामान्य दौरों के लिए, अपॉइंटमेंट पहले आओ, पहले पाओ के आधार पर होते हैं। हालांकि, विशेष परामर्श के लिए पूर्व बुकिंग की आवश्यकता हो सकती है।",
        order: 1,
        isVisible: true
    },
    {
        question: "What documents do I need to carry?",
        question_hi: "मुझे अपने साथ कौन से दस्तावेज़ ले जाने होंगे?",
        answer: "Please carry a valid government ID (Aadhar Card/Voter ID) and any previous medical records or prescriptions for a better diagnosis.",
        answer_hi: "बेहतर निदान के लिए कृपया एक वैध सरकारी आईडी (आधार कार्ड/मतदाता पहचान पत्र) और कोई भी पिछला मेडिकल रिकॉर्ड या नुस्खा अपने साथ रखें।",
        order: 2,
        isVisible: true
    },
    {
        question: "Can I book medical tests online?",
        question_hi: "क्या मैं मेडिकल टेस्ट ऑनलाइन बुक कर सकता हूँ?",
        answer: "Yes, you can browse available tests in the section above and book them directly. You will receive a confirmation time via SMS.",
        answer_hi: "हाँ, आप ऊपर दिए गए अनुभाग में उपलब्ध परीक्षणों को ब्राउज़ कर सकते हैं और उन्हें सीधे बुक कर सकते हैं। आपको एसएमएस के माध्यम से पुष्टि का समय प्राप्त होगा।",
        order: 3,
        isVisible: true
    },
    {
        question: "Is emergency care available 24/7?",
        question_hi: "क्या आपातकालीन देखभाल 24/7 उपलब्ध है?",
        answer: "Yes, our emergency doctors are available 24/7. Look for the 'Emergency Available' badge on doctor cards or visit the Emergency section immediately.",
        answer_hi: "हाँ, हमारे आपातकालीन डॉक्टर 24/7 उपलब्ध हैं। डॉक्टर कार्डों पर 'आपातकालीन उपलब्ध' (Emergency Available) बैज देखें या तुरंत आपातकालीन अनुभाग पर जाएँ।",
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
