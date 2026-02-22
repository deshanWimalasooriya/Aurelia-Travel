const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Set up Multer to keep the file in memory temporarily (fastest way to upload)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = { cloudinary, upload };