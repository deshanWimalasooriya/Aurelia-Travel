const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connection = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// ========================================
// 1. MIDDLEWARE
// ========================================
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Only needed once

app.use(cors({
    origin: 'http://localhost:5173', // Your React app URL
    credentials: true, // Important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));

// Import Auth Middleware
const { verifyToken } = require('./API/middleware/authMiddleware');

// ========================================
// 2. IMPORT ROUTES (Only Import Once)
// ========================================
const authRoutes = require('./API/routes/authRoutes');
const userRoutes = require('./API/routes/userRoutes');
const adminRoutes = require('./API/routes/adminRoutes'); // Imported once here
const hotelRoutes = require('./API/routes/hotelRoutes');
const roomRoutes = require('./API/routes/roomRoutes');
const bookingRoutes = require('./API/routes/bookingRoutes');
const reviewRoutes = require('./API/routes/reviewRoutes');
const walletRoutes = require('./API/routes/walletRoutes');
const crmRoutes = require('./API/routes/crmRoutes');
const amenityRoutes = require('./API/routes/amenityRoutes');

// ========================================
// 3. USE ROUTES (Only Use Once)
// ========================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // Admin routes
app.use('/api/hotels', hotelRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/support', crmRoutes);
app.use('/api/amenities', amenityRoutes);

// Protected Routes
// Note: verifyToken is applied here to protect all user routes
app.use('/api/users', verifyToken, userRoutes); 

// ========================================
// 4. DATABASE CONNECTION
// ========================================
connection.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to the database:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database');
});

// ========================================
// 5. START SERVER
// ========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});