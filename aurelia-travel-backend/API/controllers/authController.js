const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Declared ONLY ONCE here
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { OAuth2Client } = require('google-auth-library');

const userModel = require('../models/userModel');
const { sendNotification, notifyAdmins } = require('./notificationController');
const emailService = require('../services/emailService');
const connection = require('../../config/db'); // Your Knex instance

// Initialize the Google Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ==========================================
// 1. EMAIL VERIFICATION
// ==========================================
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await userModel.findByVerificationToken(token);
        
        if (!user) {
            return res.redirect('http://localhost:5173/profile?error=invalid_token');
        }

        await userModel.update(user.id, {
            is_verified: true,
            verification_token: null
        });

        res.redirect('http://localhost:5173/profile');
    } catch (err) {
        console.error("Verification Error:", err);
        res.redirect('http://localhost:5173/profile?error=server_error');
    }
};

exports.resendVerificationEmail = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await userModel.findById(userId);
        
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.is_verified) return res.status(400).json({ success: false, message: 'Email is already verified' });

        const newToken = crypto.randomBytes(32).toString('hex');
        await userModel.update(userId, { verification_token: newToken });
        
        await emailService.sendVerificationEmail(user.email, newToken);
        res.json({ success: true, message: 'Verification email sent! Please check your inbox.' });
    } catch (err) {
        console.error("Resend Error:", err);
        res.status(500).json({ success: false, error: 'Failed to resend email' });
    }
};


// ==========================================
// 2. STANDARD LOGIN & REGISTRATION
// ==========================================
exports.register = async (req, res) => {
  try {
    const { username, email, password, role, first_name, last_name } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const newUser = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      first_name,
      last_name,
      is_active: true,
      is_verified: false, 
      verification_token: verificationToken 
    });

    emailService.sendVerificationEmail(email, verificationToken)
      .catch(err => console.error("Email failed to send:", err));

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
    
    const user = await userModel.findByEmail(email);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }
    
    if (user.is_two_factor_enabled) {
        return res.status(200).json({ 
             success: true, 
             requires2FA: true,
             message: "Two-factor authentication required" 
         });
    }
    
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
        is_verified: !!user.is_verified 
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
    safeUser.is_verified = !!safeUser.is_verified; 
    
    res.json({ success: true, data: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// ==========================================
// 3. GOOGLE LOGIN (OAuth)
// ==========================================
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name, picture, sub: googleId } = payload;

        let user = await connection('users').where({ email }).first();

        if (!user) {
            const [newUserId] = await connection('users').insert({
                first_name: given_name,
                last_name: family_name,
                username: given_name, // fallback for username
                email: email,
                profile_image: picture,
                role: 'user', 
                is_active: true,
                is_verified: true, // Google emails are already verified
                created_at: new Date()
            });

            user = await connection('users').where({ id: newUserId }).first();
        }

        const appToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.cookie('token', appToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: "Google Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                image: user.profile_image,
                is_verified: true
            }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ success: false, message: "Invalid Google Token" });
    }
};


// ==========================================
// 4. TWO-FACTOR AUTHENTICATION (2FA) LOGIC
// ==========================================
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

exports.verifyAndEnable2FA = async (req, res) => {
    try {
        const { secret, token } = req.body;
        const userId = req.user.userId; 
        
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 1 
         });
         
        if (verified) {
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
                    is_verified: !!user.is_verified 
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


// ==========================================
// 5. FORGOT PASSWORD FLOW
// ==========================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findByEmail(email);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'No account found with that email address.' });
        }
        
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + 10);
        
        await userModel.update(user.id, { 
             reset_otp: otpCode, 
             reset_otp_expiry: expiryDate 
         });
         
        await emailService.sendPasswordResetEmail(user.email, otpCode);
        res.json({ success: true, message: 'Reset code sent to your email.' });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(500).json({ success: false, message: 'Failed to process request.' });
    }
};

exports.verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await userModel.findByEmail(email);
        
        if (!user || user.reset_otp !== code) {
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }
        if (new Date() > new Date(user.reset_otp_expiry)) {
            return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
        }
        
        res.json({ success: true, message: 'Code verified successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Verification failed.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const user = await userModel.findByEmail(email);
        
        if (!user || user.reset_otp !== code) {
            return res.status(400).json({ success: false, message: 'Invalid or expired request.' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await userModel.update(user.id, { 
             password: hashedPassword, 
             reset_otp: null, 
             reset_otp_expiry: null 
         });
         
        res.json({ success: true, message: 'Password reset successful!' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
};