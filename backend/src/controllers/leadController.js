const Lead = require('../models/Lead');

// Create a new lead
exports.createLead = async (req, res) => {
    try {
        const { mobile, language, chatHistory, userId, name, email, type, source } = req.body;

        if (!mobile) {
            return res.status(400).json({ message: 'Mobile number is required' });
        }

        // Basic validation for 10 digit number (if not already handled by frontend)
        // Adjust regex as needed for strict Indian mobile validation
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(mobile)) {
            return res.status(400).json({ message: 'Invalid mobile number format' });
        }

        const newLead = new Lead({
            mobile,
            language,
            chatHistory,
            userId,
            name,
            email,
            type,
            source
        });

        await newLead.save();

        res.status(201).json({
            message: 'Lead created successfully',
            lead: newLead
        });
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all leads (for admin)
exports.getLeads = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = {};
        if (status) {
            query.status = status;
        }
        if (req.query.type) {
            query.type = req.query.type;
        }

        const leads = await Lead.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Lead.countDocuments(query);

        res.status(200).json({
            leads,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update lead status
exports.updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, chatHistory } = req.body;

        const updateData = {};
        if (status) updateData.status = status;
        if (notes) updateData.notes = notes;
        if (chatHistory) updateData.chatHistory = chatHistory;

        const lead = await Lead.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.status(200).json({ message: 'Lead updated', lead });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
// Get single lead by ID
exports.getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        res.status(200).json(lead);
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add message to lead chat history
exports.addMessageToLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body; // Expecting a single message object

        if (!message || !message.text) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const lead = await Lead.findByIdAndUpdate(
            id,
            { $push: { chatHistory: message } },
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        res.status(200).json({ message: 'Message added', lead });
    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get lead by User ID
exports.getLeadByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const lead = await Lead.findOne({ userId }).sort({ createdAt: -1 });
        if (!lead) {
            return res.status(200).json(null);
        }
        res.status(200).json(lead);
    } catch (error) {
        console.error('Error fetching lead by user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
