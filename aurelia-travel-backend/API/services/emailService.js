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