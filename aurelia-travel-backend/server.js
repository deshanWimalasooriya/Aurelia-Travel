const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connection = require('./config/db'); // This is now your Knex instance
const http = require('http'); // 1. Import HTTP
const { init } = require('./API/socket'); // 2. Import Socket Init
const generateAvailability = require('./API/cron/availabilityCron');
const travelPlanRoutes = require("./API/routes/travelPlanRoutes");

// Load Env Variables
dotenv.config();

const app = express();
const server = http.createServer(app); // 3. Create Server

// Initialize Socket.io
init(server); // 4. Initialize

// --- 1. MIDDLEWARE ---
// CORS: Allow requests from your Frontend
app.use(cors({
    origin: 'http://localhost:5173', // Verify this matches your Frontend URL
    credentials: true,               // Allowed cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Only need to call this once
app.use("/api/travel", travelPlanRoutes);

// Import Middleware
const { verifyToken, checkRole } = require('./API/middleware/authMiddleware');

// --- 2. IMPORT ROUTES ---
const authRoutes = require('./API/routes/authRoutes');
const userRoutes = require('./API/routes/userRoutes');
const hotelRoutes = require('./API/routes/hotelRoutes');
const roomRoutes = require('./API/routes/roomRoutes');
const bookingRoutes = require('./API/routes/bookingRoutes');
const reviewRoutes = require('./API/routes/reviewRoutes');
const walletRoutes = require('./API/routes/walletRoutes');
const crmRoutes = require('./API/routes/crmRoutes');
const amenityRoutes = require('./API/routes/amenityRoutes');
const financeRoutes = require('./API/routes/financeRoutes');
const notificationRoutes = require('./API/routes/notificationRoutes');
const wishlistRoutes = require('./API/routes/wishlistRoutes'); // <--- ADD THIS
// const chatRoutes = require('./API/routes/chatRoutes');

// --- MISSING IMPORTS ADDED HERE ---
const adminRoutes = require('./API/routes/adminRoutes'); 
const platformRoutes = require('./API/routes/platformRoutes');

// --- 3. REGISTER ROUTES ---

// Public & Auth
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes); // Hotels (Public view)
app.use('/api/rooms', roomRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wishlist', wishlistRoutes); // <--- ADD THIS
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', require('./API/routes/chatRoutes'));
app.use('/api/upload', require('./API/routes/uploadRoutes'));

// Protected User Routes (Applied verifyToken here globally for safety)
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/bookings', verifyToken, bookingRoutes); // Usually requires login
app.use('/api/wallet', verifyToken, walletRoutes);
app.use('/api/support', verifyToken, crmRoutes); // Matches your frontend calls

// Manager Routes
app.use('/api/finance', verifyToken, financeRoutes);
app.use('/api/admin', verifyToken, adminRoutes); // Legacy Manager routes

// ✅ SUPER ADMIN ROUTES
app.use('/api/platform', platformRoutes); 

// --- 4. DATABASE CONNECTION (MySQL via Knex) ---
// Knex connects automatically when queries are run.
// We run a simple query here just to test the connection on startup.
connection.raw('SELECT 1')
    .then(() => {
        console.log('✅ Connected to MySQL Database (via Knex)');
    })
    .catch((err) => {
        console.error('❌ Error connecting to MySQL:', err);
    });
    
generateAvailability();
// --- 5. START SERVER ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔗 Platform Routes available at: http://localhost:${PORT}/api/platform`);
});

