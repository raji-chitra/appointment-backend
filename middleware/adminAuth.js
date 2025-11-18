const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Backward compatibility for hardcoded admin token
    if (decoded.isAdmin) {
      let adminUser = await User.findOne({ email: 'admin@prescripto.com' });
      if (!adminUser) {
        adminUser = new User({
          name: 'Admin',
          email: 'admin@prescripto.com',
          password: 'admin123',
          role: 'admin'
        });
        await adminUser.save();
      }
      req.user = adminUser;
      return next();
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = adminAuth;


