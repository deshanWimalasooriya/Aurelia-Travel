const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel'); // Uses the new Phase 1 Model

// 1. REGISTER
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check existing
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User (PCI Compliant: No card data here)
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user', // Default to user
      first_name,
      last_name,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email, role: newUser.role }
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // A. Find User
    const user = await userModel.findByEmail(email);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // B. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // C. Check Active
    if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // D. Generate Token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // E. Set Cookie (HttpOnly)
    res.cookie('token', token, {
      httpOnly: true, // Frontend JS cannot read this (Security)
      secure: false, // Set 'true' in production (HTTPS)
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 Day
    });

    // F. Send Response (Frontend uses 'role' to redirect)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        image: user.profile_image
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. LOGOUT
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

// 4. GET CURRENT USER (Persistent Session)
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user comes from verifyToken middleware
    const user = await userModel.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, ...safeUser } = user; // Remove password
    res.json({ success: true, data: safeUser });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};