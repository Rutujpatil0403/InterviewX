const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// Authenticate JWT Token
const authenticateToken = (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.authToken;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            throw new AppError('Access denied. No token provided.', 401);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'fallback_secret');
        req.user = { userId: decoded.userId };
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AppError('Invalid token.', 401);
        }
        if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Token expired.', 401);
        }
        throw error;
    }
};

// Require specific role(s)
const requireRole = (roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                throw new AppError('Authentication required.', 401);
            }

            // Get user from database to check role
            const User = require('../models/User');
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                throw new AppError('User not found.', 404);
            }

            if (!user.isActive) {
                throw new AppError('Account is deactivated.', 403);
            }

            // Check if user has required role
            if (!roles.includes(user.role)) {
                throw new AppError('Insufficient permissions.', 403);
            }

            // Add role to req.user for use in controllers
            req.user.role = user.role;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    protect: authenticateToken, // Alias for consistency
    authorize: requireRole      // Alias for consistency
};