const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'dharmarth_foundation',
            resource_type: 'auto', // Allow all file types (images, pdfs, etc.)
        },
    });
} else {
    console.warn("WARNING: Cloudinary credentials missing in .env. Uploads will fail or fallback to memory.");
    storage = multer.memoryStorage();
}

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

module.exports = { cloudinary, upload };
