// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');


// User Registration
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      username,
      email,
      password: hashedPassword
    };

    const createdUser = await userModel.createUser(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await userModel.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_secret_key_change_this',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

     // ✅ Set token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,  // Prevents JavaScript access (XSS protection)
      secure: false,  // HTTPS only in production
      sameSite: 'lax',  // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: '/', // Cookie valid for entire site
      domain: 'localhost' // Adjust domain as needed
    });

    // Return success response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token: token
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    // ✅ Clear the cookie
    res.clearCookie('token');
    // For JWT, logout is handled on client side by removing token
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
