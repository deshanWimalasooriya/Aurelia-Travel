const jwt = require('jsonwebtoken');

// 1. VERIFY TOKEN (The Guard)
exports.verifyToken = (req, res, next) => {
  try {
    // ✅ AUTO-DETECT: Check Cookie first (Best Practice), then Header (Fallback)
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Please login.' 
      });
    }

    // Verify
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'secret' // Make sure this matches your .env
    );

    // Attach user info to request (id, role, email)
    req.user = decoded;
    next();

  } catch (err) {
    // If cookie is invalid, clear it
    res.clearCookie('token'); 
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
};

// 2. CHECK ROLE (The Permission Check)
// Usage: router.get(..., checkRole('admin', 'hotel_manager'), ...)
exports.checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access forbidden. Insufficient permissions.' 
      });
    }
    next();
  };
};

// 3. CHECK OWNERSHIP (Optional Helper)
// Ensures a user can only edit their OWN profile/booking
exports.checkOwnership = (req, res, next) => {
  const resourceUserId = parseInt(req.params.id); // ID in URL
  const currentUserId = req.user.userId; // ID in Token
  
  if (req.user.role === 'admin') return next(); // Admin overrides

  if (resourceUserId !== currentUserId) {
    return res.status(403).json({ 
      success: false, 
      message: 'You can only manage your own resources.' 
    });
  }
  next();
};