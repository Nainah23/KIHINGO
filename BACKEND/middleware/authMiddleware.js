const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = async (req, res, next) => {
  try {
    // Check for token in headers
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        msg: 'No token, authorization denied' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      
      // Validate decoded token structure
      if (!decoded.user || !decoded.user.id || !decoded.user.role) {
        return res.status(401).json({ 
          success: false,
          msg: 'Invalid token structure' 
        });
      }

      // Attach user to request
      req.user = decoded.user;
      
      // Log successful auth
      console.log('Authenticated user:', {
        id: req.user.id,
        role: req.user.role
      });

      next();
    } catch (err) {
      console.error('Token verification error:', err);
      
      // More specific error messages
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          msg: 'Token has expired' 
        });
      }
      
      return res.status(401).json({ 
        success: false,
        msg: 'Token is not valid' 
      });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error' 
    });
  }
};