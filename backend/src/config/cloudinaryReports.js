const cloudinaryReports = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure cloudinary specifically for reports (supporting a different account/credentials if set)
const cloudName = process.env.CLOUDINARY_REPORTS_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_REPORTS_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_REPORTS_API_SECRET || process.env.CLOUDINARY_API_SECRET;

let storage;

if (cloudName && apiKey && apiSecret) {
    cloudinaryReports.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinaryReports,
        params: {
            folder: 'dharmarth_reports',
            resource_type: 'raw', // PDF documents stored as raw documents
            format: 'pdf'
        }
    });
} else {
    console.warn("WARNING: Cloudinary credentials for reports missing. Falling back to memory storage.");
    storage = multer.memoryStorage();
}

const uploadReport = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit for PDFs
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

module.exports = { cloudinaryReports, uploadReport };
