const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel'); 
const { sendNotification, notifyAdmins } = require('./notificationController'); 
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// ==========================================
// 1. STANDARD LOGIN & REGISTRATION
// ==========================================

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      first_name,
      last_name,
      is_active: true
    });

    // Non-blocking notifications
    Promise.allSettled([
        notifyAdmins(
            "New User Registration",
            `User ${newUser.username} (${newUser.email}) just registered as a ${newUser.role}.`,
            "info",
            "/superAdmin/users"
        ),
        sendNotification(
            newUser.id,
            "Welcome to Aurelia!",
            "Your account has been created. Complete your profile to get started.",
            "success",
            "/profile"
        )
    ]).catch(err => console.error("Background Notification Error:", err));

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email, role: newUser.role }
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      return res.status(409).json({ success: false, message: 'Email or Username already exists' });
    }
    console.error("Register Error:", err);
    res.status(500).json({ success: false, error: "Registration failed." });
  }
};

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

    // C. Check Active Status
    if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // D. --- 2FA CHECK ---
    // If 2FA is turned on, STOP the login process and ask the frontend for the code
    if (user.is_two_factor_enabled) {
        return res.status(200).json({ 
            success: true, 
            requires2FA: true,
            message: "Two-factor authentication required" 
        });
    }

    // E. --- STANDARD LOGIN (If 2FA is OFF) ---
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true, 
      secure: false, 
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 
    });

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

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, ...safeUser } = user; 
    res.json({ success: true, data: safeUser });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ==========================================
// 2. TWO-FACTOR AUTHENTICATION (2FA) LOGIC
// ==========================================

// Step 1: Generate QR Code (For Profile Setup)
exports.generate2FA = async (req, res) => {
    try {
        const userEmail = req.user.email; 

        const secret = speakeasy.generateSecret({ 
            name: `Aurelia Travel (${userEmail})` 
        });

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            success: true,
            secret: secret.base32,
            qrCodeUrl: qrCodeUrl
        });
    } catch (error) {
        console.error("2FA Generation Error:", error);
        res.status(500).json({ success: false, message: "Failed to generate 2FA" });
    }
};

// Step 2: Verify code during Profile Setup & save to DB
exports.verifyAndEnable2FA = async (req, res) => {
    try {
        const { secret, token } = req.body;
        const userId = req.user.userId; // Fixed: Matches authMiddleware payload

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 
        });

        if (verified) {
            // Using your userModel to securely update the database
            await userModel.update(userId, {
                two_factor_secret: secret,
                is_two_factor_enabled: true
            });

            return res.status(200).json({ success: true, message: "2FA successfully enabled!" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid verification code. Please try again." });
        }
    } catch (error) {
        console.error("2FA Setup Error:", error);
        res.status(500).json({ success: false, message: "Server error during verification." });
    }
};

// Step 3: Verify code during Login Process
exports.verify2FALogin = async (req, res) => {
    try {
        const { email, token } = req.body; 

        const user = await userModel.findByEmail(email);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret, 
            encoding: 'base32',
            token: token,
            window: 1 
        });

        if (verified) {
            // Success! Generate the actual JWT token now.
            const jwtToken = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );

            res.cookie('token', jwtToken, {
                httpOnly: true, 
                secure: false, 
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 
            });
            
            return res.status(200).json({ 
                success: true, 
                message: "Login successful",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    image: user.profile_image
                }
            });
        } else {
            return res.status(401).json({ success: false, message: "Invalid Authenticator code." });
        }

    } catch (error) {
        console.error("2FA Login Error:", error);
        res.status(500).json({ success: false, message: "Server error during 2FA login." });
    }
};