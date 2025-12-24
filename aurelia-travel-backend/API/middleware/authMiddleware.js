// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Verify JWT token
exports.verifyToken = (req, res, next) => {
  try {
    // ✅ Get token from cookie instead of Authorization header
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your_secret_key_change_this'
    );

    // Add user info to request object
    req.user = decoded;
    next();

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check if user has specific role(s)
exports.checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.'
      });
    }

    next();
  };
};

// Optional: Check if user owns the resource
exports.checkOwnership = (req, res, next) => {
  try {
    const resourceUserId = parseInt(req.params.id);
    const currentUserId = req.user.userId;

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resource
    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You can only access your own resources.'
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

