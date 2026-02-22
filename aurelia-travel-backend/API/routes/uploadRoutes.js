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

// --- ADD THIS NEW ROUTE ---
// Bulk Upload Route for Hotels and Rooms (Allows up to 10 images at once)
router.post('/bulk', verifyToken, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // Process all images in parallel for maximum speed
        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const b64 = Buffer.from(file.buffer).toString("base64");
                let dataURI = "data:" + file.mimetype + ";base64," + b64;
                
                cloudinary.uploader.upload(dataURI, {
                    folder: 'aurelia_travel',
                    resource_type: 'auto',
                })
                .then(result => {
                    // Format this exactly how your hotel/room controllers expect it!
                    resolve({ url: result.secure_url, isPrimary: false });
                })
                .catch(err => reject(err));
            });
        });

        // Wait for all Cloudinary uploads to finish
        const uploadedImages = await Promise.all(uploadPromises);

        // Automatically mark the first uploaded image as the primary cover photo
        if (uploadedImages.length > 0) {
            uploadedImages[0].isPrimary = true;
        }

        // Send the array of URLs back to the frontend
        res.json({
            success: true,
            images: uploadedImages
        });

    } catch (err) {
        console.error("Bulk Upload Error:", err);
        res.status(500).json({ success: false, message: 'Bulk image upload failed' });
    }
});

module.exports = router;