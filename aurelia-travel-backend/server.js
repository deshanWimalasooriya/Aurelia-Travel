
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
dotenv.config();
const connection = require('./config/db');
const app = express();

// Add cookie-parser middleware here
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Import middleware
const { verifyToken, checkRole } = require('./API/middleware/authMiddleware');

//Routes
const hotelRoutes = require('./API/routes/hotelRoutes');
const authRoutes = require('./API/routes/authRoutes');
const userRoutes = require('./API/routes/userRoutes');

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:5173', // Your React app URL
    credentials: true, // ✅ Important for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']  // ✅ Expose set-cookie header
}));


app.use(express.json());

//use Routes
app.use('/api/hotels', hotelRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);

//Database Establish
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database');
});

//Server Establish
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log(`🚀 Server is running on port ${PORT}`);
});