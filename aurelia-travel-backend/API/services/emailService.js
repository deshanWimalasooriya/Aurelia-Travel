// API/services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendVerificationEmail = async (userEmail, token) => {
    // ✅ FIX: Point directly to the backend API instead of React
    const verifyUrl = `http://localhost:5000/api/auth/verify-email/${token}`; 
    
    const mailOptions = {
        from: `"Aurelia Travel" <${process.env.SMTP_USER}>`, 
        to: userEmail,
        subject: 'Verify your Aurelia Travel Account',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to Aurelia Travel!</h2>
                <p>Please verify your email address to activate your account.</p>
                <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

exports.sendPasswordResetEmail = async (userEmail, otpCode) => {
    const mailOptions = {
        from: `"Aurelia Travel" <${process.env.SMTP_USER}>`, 
        to: userEmail,
        subject: 'Password Reset Code - Aurelia Travel',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #0f172a;">Password Reset Request</h2>
                <p style="color: #334155; font-size: 16px;">We received a request to reset the password for your Aurelia Travel account. Your 6-digit verification code is:</p>
                <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                    <h1 style="letter-spacing: 8px; color: #2563eb; margin: 0; font-size: 32px;">${otpCode}</h1>
                </div>
                <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this reset, please ignore this email.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};