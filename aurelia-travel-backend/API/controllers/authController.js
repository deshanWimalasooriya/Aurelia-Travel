const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel'); 
const { sendNotification, notifyAdmins } = require('./notificationController'); 
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// At the top of API/controllers/authController.js
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Add to the top of API/controllers/authController.js
// const whatsappService = require('../services/whatsappService');


// // Add these to the bottom of the file
// exports.requestWhatsAppOTP = async (req, res) => {
//     try {
//         const userId = req.user.userId;
//         const { phone } = req.body; 

//         if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

//         // Generate a 6-digit OTP
//         const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

//         // Expiry time (10 mins from now)
//         const expiryDate = new Date();
//         expiryDate.setMinutes(expiryDate.getMinutes() + 10);

//         // Update Database
//         await userModel.update(userId, { 
//             phone: phone, 
//             phone_otp: otpCode, 
//             phone_otp_expiry: expiryDate 
//         });

//         // Send WhatsApp Message
//         await whatsappService.sendWhatsAppOTP(phone, otpCode);

//         res.json({ success: true, message: 'OTP sent to your WhatsApp!' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: 'Could not send OTP. Make sure you joined the Sandbox!' });
//     }
// };

// exports.verifyWhatsAppOTP = async (req, res) => {
//     try {
//         const userId = req.user.userId;
//         const { otp } = req.body;

//         const user = await userModel.findById(userId);

//         if (!user.phone_otp || user.phone_otp !== otp) {
//             return res.status(400).json({ success: false, message: 'Invalid OTP code' });
//         }

//         if (new Date() > new Date(user.phone_otp_expiry)) {
//             return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
//         }

//         // Success! Clear the OTP and mark as verified
//         await userModel.update(userId, {
//             is_phone_verified: true,
//             phone_otp: null,
//             phone_otp_expiry: null
//         });

//         res.json({ success: true, message: 'WhatsApp verified successfully!' });
//     } catch (err) {
//         res.status(500).json({ success: false, message: 'Verification failed' });
//     }
// };



// 2. ADD THIS NEW FUNCTION AT THE BOTTOM
// Inside API/controllers/authController.js

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await userModel.findByVerificationToken(token);

        if (!user) {
            // Redirect to frontend with an error flag
            return res.redirect('http://localhost:5173/profile?error=invalid_token');
        }

        // 1. Update the user: Set is_verified to true and wipe the token
        await userModel.update(user.id, {
            is_verified: true,
            verification_token: null
        });

        // 2. ✅ FIX: Instantly redirect the user back to their React Profile!
        res.redirect('http://localhost:5173/profile');

    } catch (err) {
        console.error("Verification Error:", err);
        res.redirect('http://localhost:5173/profile?error=server_error');
    }
};

// Add to API/controllers/authController.js

exports.resendVerificationEmail = async (req, res) => {
    try {
        const userId = req.user.userId; // From verifyToken middleware
        const user = await userModel.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.is_verified) return res.status(400).json({ success: false, message: 'Email is already verified' });

        // 1. Generate a new token
        const crypto = require('crypto');
        const newToken = crypto.randomBytes(32).toString('hex');

        // 2. Update the user record with the new token
        await userModel.update(userId, { verification_token: newToken });

        // 3. Send the email
        const emailService = require('../services/emailService');
        await emailService.sendVerificationEmail(user.email, newToken);

        res.json({ success: true, message: 'Verification email sent! Please check your inbox.' });

    } catch (err) {
        console.error("Resend Error:", err);
        res.status(500).json({ success: false, error: 'Failed to resend email' });
    }
};

// ==========================================
// 1. STANDARD LOGIN & REGISTRATION
// ==========================================

exports.register = async (req, res) => {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate the unique token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      first_name,
      last_name,
      is_active: true,
      is_verified: false, // NEW
      verification_token: verificationToken // NEW
    });

    // Send the email in the background
    emailService.sendVerificationEmail(email, verificationToken)
      .catch(err => console.error("Email failed to send:", err));

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
        image: user.profile_image,
        is_verified: !!user.is_verified // <--- ADD THIS LINE (!! converts MySQL 1/0 to true/false)
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

// Inside API/controllers/authController.js -> exports.getCurrentUser

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password, ...safeUser } = user; 
    
    // Force MySQL 1/0 into React true/false
    safeUser.is_verified = !!safeUser.is_verified; 

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
                    image: user.profile_image,
                    is_verified: !!user.is_verified // <--- ADD THIS LINE
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