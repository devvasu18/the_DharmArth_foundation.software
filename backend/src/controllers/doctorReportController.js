const DoctorReport = require('../models/DoctorReport');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Doctor Reports Controller
 */

// Helper to generate a unique secure access token
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// @desc    Create/Send Medical Reports
// @route   POST /api/reports/send
// @access  Private (Admin)
exports.createReport = async (req, res) => {
    try {
        const files = req.files || []; // Array of files uploaded via multer
        const { metadata, customMessage, templateLanguage } = req.body;

        if (!metadata) {
            return res.status(400).json({ message: 'Metadata is required' });
        }

        // Parse patients metadata (contains array of patient objects: { mobile, name, remarks })
        let patients = [];
        try {
            patients = JSON.parse(metadata);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid metadata format' });
        }

        if (!Array.isArray(patients) || patients.length === 0) {
            return res.status(400).json({ message: 'At least one patient is required' });
        }

        const reportsCreated = [];

        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            if (!patient.mobile) continue;

            // Determine if there is a file matching this patient
            // If multiple files are uploaded, match 1-to-1 by index. 
            // If only 1 file is uploaded, send it to all.
            let matchedFile = null;
            if (files.length === 1) {
                matchedFile = files[0];
            } else if (files.length > 1 && files[i]) {
                matchedFile = files[i];
            }

            const secureToken = generateSecureToken();
            const uploadedAt = new Date();
            const expiresAt = new Date(uploadedAt.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days expiration

            const reportData = {
                patientName: patient.name || '',
                patientMobile: String(patient.mobile).trim(),
                remarks: patient.remarks || '',
                uploadedAt,
                expiresAt,
                secureToken,
                status: 'pending',
                whatsappStatus: 'pending',
                templateLanguage: templateLanguage || 'hi',
                customMessage: customMessage || ''
            };

            if (matchedFile) {
                reportData.reportUrl = matchedFile.path; // Cloudinary file url
                reportData.fileName = matchedFile.originalname;
                reportData.cloudinaryPublicId = matchedFile.filename; // Cloudinary public_id for cleanup
            }

            const report = await DoctorReport.create(reportData);
            reportsCreated.push(report);
        }

        // Trigger queue processing worker asynchronously
        const { triggerWorker } = require('../jobs/reportQueueWorker');
        triggerWorker();

        return res.status(201).json({
            message: `Successfully queued ${reportsCreated.length} reports for delivery`,
            count: reportsCreated.length,
            reports: reportsCreated
        });
    } catch (error) {
        console.error('Error creating report:', error);
        return res.status(500).json({ message: 'Failed to create reports', error: error.message });
    }
};

// @desc    Get List of Reports for Admin Dashboard
// @route   GET /api/reports
// @access  Private (Admin)
exports.getReports = async (req, res) => {
    try {
        const { search, status, dateFilter, page = 1, limit = 50 } = req.query;
        const query = {};

        // Status filter
        if (status) {
            query.whatsappStatus = status;
        }

        // Date filters
        if (dateFilter) {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const endOfToday = new Date();
            endOfToday.setHours(23, 59, 59, 999);

            if (dateFilter === 'today') {
                query.uploadedAt = { $gte: startOfToday, $lte: endOfToday };
            } else if (dateFilter === 'week') {
                const startOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - 7);
                startOfWeek.setHours(0, 0, 0, 0);
                query.uploadedAt = { $gte: startOfWeek };
            }
        }

        // Search query (Mobile, Name, File Name)
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { patientMobile: searchRegex },
                { patientName: searchRegex },
                { fileName: searchRegex }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await DoctorReport.countDocuments(query);
        const reports = await DoctorReport.find(query)
            .sort({ uploadedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            reports,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
};

// @desc    Manual Retry for Failed Report Send
// @route   POST /api/reports/retry/:id
// @access  Private (Admin)
exports.retryReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await DoctorReport.findById(id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Reset status to retry sending
        report.whatsappStatus = 'pending';
        report.status = 'pending';
        report.retryCount = 0;
        report.failureReason = '';
        report.scheduledAt = new Date();
        await report.save();

        // Trigger queue worker
        const { triggerWorker } = require('../jobs/reportQueueWorker');
        triggerWorker();

        return res.status(200).json({ message: 'Report queued for resend successfully', report });
    } catch (error) {
        console.error('Error retrying report:', error);
        return res.status(500).json({ message: 'Failed to retry sending report', error: error.message });
    }
};

// @desc    Get Report Metadata (Check validity/expiration)
// @route   GET /api/reports/metadata/:token
// @access  Public
exports.getReportMetadata = async (req, res) => {
    try {
        const { token } = req.params;
        const report = await DoctorReport.findOne({ secureToken: token });

        if (!report) {
            return res.status(404).json({ message: 'Report link is invalid.' });
        }

        const now = new Date();
        if (now > report.expiresAt) {
            return res.status(410).json({ 
                message: 'Sorry, we only show data of the last 3 months.',
                expired: true 
            });
        }

        return res.status(200).json({
            patientName: report.patientName,
            fileName: report.fileName,
            remarks: report.remarks,
            uploadedAt: report.uploadedAt,
            expiresAt: report.expiresAt,
            hasPdf: !!report.reportUrl
        });
    } catch (error) {
        console.error('Error fetching report metadata:', error);
        return res.status(500).json({ message: 'Server error check link validity', error: error.message });
    }
};

// @desc    Securely stream the report PDF from Cloudinary without exposing direct URL
// @route   GET /api/reports/view/:token
// @access  Public
exports.streamSecureReport = async (req, res) => {
    try {
        const { token } = req.params;
        const report = await DoctorReport.findOne({ secureToken: token });

        if (!report) {
            return res.status(404).send('Report link is invalid.');
        }

        const now = new Date();
        if (now > report.expiresAt || !report.reportUrl) {
            return res.status(410).send('<h3>Sorry, we only show data of the last 3 months.</h3>');
        }

        // Fetch PDF file from Cloudinary and stream it back directly
        const response = await axios.get(report.reportUrl, { responseType: 'stream' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${report.fileName || 'report.pdf'}"`);

        response.data.pipe(res);
    } catch (error) {
        console.error('Error streaming secure report:', error);
        return res.status(500).send('Failed to load secure document.');
    }
};
