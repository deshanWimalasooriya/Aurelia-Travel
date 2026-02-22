const express = require('express');
const router = express.Router();
const { cloudinary, upload } = require('../config/cloudinary');
const { verifyToken } = require('../middleware/authMiddleware');

// The 'image' inside upload.single() is the name of the form field React will send
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Convert the memory file buffer into a string that Cloudinary can read
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'aurelia_travel', // Creates a neat folder in your Cloudinary account
            resource_type: 'auto',
        });

        // Send the secure URL back to React
        res.json({
            success: true,
            url: result.secure_url
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ success: false, message: 'Image upload failed' });
    }
});

module.exports = router;