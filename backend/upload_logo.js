const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadImage = async () => {
  const filePath = path.join(__dirname, '../LOGO.jpg');
  console.log('Uploading:', filePath);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'the_dharmarth_foundation',
      public_id: 'logo',
      overwrite: true,
      resource_type: 'image'
    });
    console.log('---UPLOAD_SUCCESS---');
    console.log('URL:', result.secure_url);
    console.log('---END---');
  } catch (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }
};

uploadImage();
