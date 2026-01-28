const jwt = require('jsonwebtoken');
const { User } = require('../models');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    if (user.isBanned) {
      return next(new Error('Account is banned'));
    }
    
    // Attach user info to socket
    socket.userId = user._id.toString();
    socket.userRole = user.role;
    socket.userName = user.name;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    }
    next(new Error('Authentication failed'));
  }
};

module.exports = { socketAuth };
