const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const { deleteOldProfileImage } = require('../middleware/upload');


class UserController {

    // Hash password using bcrypt
    hashPassword = async (password) => {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    };

    // Compare password with hash
    comparePassword = async (password, hash) => {
        return await bcrypt.compare(password, hash);
    };

    // Generate JWT Token
    generateToken = (userId) => {
        return jwt.sign({ userId }, process.env.SECRET_KEY || 'fallback_secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        });
    };

    // Set JWT Cookie
    setTokenCookie = (res, token) => {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        };

        res.cookie('authToken', token, cookieOptions);
    };


    // ===========================================================================================================================
    // -------------------------------------------------- Register User -------------------------------------------------------
    // ===========================================================================================================================

    // Register a new user
    register = asyncHandler(async (req, res) => {
        const { email, password, name, role, phone, department, company } = req.body;

        console.log('User registration attempt', { email, role });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash the password before storing
        const hashedPassword = await this.hashPassword(password);

        const userData = {
            email: email,
            passwordHash: hashedPassword,
            name: name,
            role: role,
            phone: phone,
            department: department,
            company: company,
            isActive: true
        };

        const user = await User.create(userData);
        const token = this.generateToken(user._id);

        this.setTokenCookie(res, token);

        // logger.info('User registered successfully', { userId: user._id, email: user.email });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                token
            }
        });
    });


    // ===========================================================================================================================
    // -------------------------------------------------- Login User -------------------------------------------------------
    // ===========================================================================================================================


    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            throw new AppError('Please provide email and password', 400);
        }

        console.log('Email : ' + email);

        // Find user by email
        const user = await User.findOne({ email, isActive: true });
        console.log('Login attempt for:', email, 'User found:', !!user);

        if (!user) {
            console.log('User not found for email:', email);
            res.status(400).json({ message: "User not found" });

        }

        // Compare password with hash
        console.log('Comparing password for user:', user.email);
        const isPasswordValid = await this.comparePassword(password, user.passwordHash);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Invalid password for user:', user.email);
            throw new AppError('Incorrect password', 401);
        }

        // Update last login
        await User.updateLastLogin(user._id);

        // Generate token
        const token = this.generateToken(user._id);
        this.setTokenCookie(res, token);

        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: {
                user: user.toJSON(),
                token
            }
        });
    });


    // ===========================================================================================================================
    // -------------------------------------------------- Logout User -------------------------------------------------------
    // ===========================================================================================================================



    logout = asyncHandler(async (req, res) => {
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        // logger.info('User logged out', { userId: req.user?.userId });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    });


    // ===========================================================================================================================
    // -------------------------------------------------- Get User Profile -------------------------------------------------------
    // ===========================================================================================================================


    getProfile = asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Update User Profile ----------------------------------------------------
    // ===========================================================================================================================


    updateProfile = asyncHandler(async (req, res) => {
        const userId = req.params.id || req.user.userId;

        // Check if user is updating their own profile or is admin
        if (req.user.userId !== userId && req.user.role !== 'Admin') {
            throw new AppError('You can only update your own profile', 403);
        }

        const allowedUpdates = ['name', 'phone', 'department', 'company', 'profilePicture'];
        const updateData = {};

        // Handle regular form fields
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = req.body[key];
            }
        });

        console.log("Upadated Data : ", updateData);

        // Handle uploaded image
        if (req.processedFile) {
            // Delete old profile image if exists
            await deleteOldProfileImage(userId);

            // Set new profile picture URL
            updateData.profilePicture = req.processedFile.url;
        }

        // Check if there's any data to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields provided for update'
            });
        }

        const updatedUser = await User.updateProfile(userId, updateData);

        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }

        // logger.info('User profile updated', { userId, updatedFields: Object.keys(updateData) });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser.toJSON()
            }
        });
    });




    // ===========================================================================================================================
    // -------------------------------------------------- Upload Avatar ----------------------------------------------------------
    // ===========================================================================================================================

    uploadAvatar = asyncHandler(async (req, res) => {
        if (!req.processedFile) {
            throw new AppError('No image file provided', 400);
        }

        const userId = req.user.userId;

        // Delete old profile image if exists
        await deleteOldProfileImage(userId);

        // Update user's profile picture
        const updatedUser = await User.updateProfile(userId, {
            profilePicture: req.processedFile.url
        });

        if (!updatedUser) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                profilePicture: req.processedFile.url,
                user: updatedUser.toJSON()
            }
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Change Password --------------------------------------------------------
    // ===========================================================================================================================

    changePassword = asyncHandler(async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId;

        if (!oldPassword || !newPassword) {
            throw new AppError('Old password and new password are required', 400);
        }

        const success = await User.updatePassword(userId, oldPassword, newPassword);

        if (!success) {
            throw new AppError('Current password is incorrect or failed to update password', 400);
        }

        // logger.info('User password changed', { userId });

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Get All Users (Admin) --------------------------------------------------
    // ===========================================================================================================================

    getAllUsers = asyncHandler(async (req, res) => {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            throw new AppError('Access denied. Admin privileges required.', 403);
        }

        const {
            page = 1,
            limit = 10,
            role,
            department,
            company,
            search
        } = req.query;

        const filters = {};
        if (role) filters.role = role;
        if (department) filters.department = department;
        if (company) filters.company = company;
        if (search) filters.search = search;

        const result = await User.getAll(filters, parseInt(page), parseInt(limit));

        res.status(200).json({
            success: true,
            data: result
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Get User by ID (Admin) -------------------------------------------------
    // ===========================================================================================================================

    getUserById = asyncHandler(async (req, res) => {
        const { userId } = req.params;

        // Check if user is requesting their own profile or is admin
        if (req.user.userId !== userId && req.user.role !== 'Admin') {
            throw new AppError('Access denied', 403);
        }

        const user = await User.findById(userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Delete User (Admin) ----------------------------------------------------
    // ===========================================================================================================================

    deleteUser = asyncHandler(async (req, res) => {
        const { userId } = req.params;

        // Check if user is admin
        if (req.user.role !== 'Admin') {
            throw new AppError('Access denied. Admin privileges required.', 403);
        }

        // Prevent admin from deleting themselves
        if (req.user.userId === userId) {
            throw new AppError('You cannot delete your own account', 400);
        }

        await User.delete(userId);

        // logger.info('User deleted by admin', { deletedUserId: userId, adminId: req.user.userId });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Get User Statistics (Admin) ----------------------------------------
    // ===========================================================================================================================

    getUserStatistics = asyncHandler(async (req, res) => {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            throw new AppError('Access denied. Admin privileges required.', 403);
        }

        const statistics = await User.getStatistics();

        res.status(200).json({
            success: true,
            data: {
                statistics
            }
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Verify Token -----------------------------------------------------------
    // ===========================================================================================================================

    verifyToken = asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.userId);

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.status(200).json({
            success: true,
            data: {
                user: user.toJSON(),
                valid: true
            }
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Get All Users ----------------------------------------------------------
    // ===========================================================================================================================

    getAllUsers = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        
        // Build query object
        const query = {};
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (role) {
            query.role = role;
        }
        
        if (status) {
            query.status = status;
        }
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get users with pagination
        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
            
        const total = await User.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    });

    // ===========================================================================================================================
    // -------------------------------------------------- Search Users -----------------------------------------------------------
    // ===========================================================================================================================

    searchUsers = asyncHandler(async (req, res) => {
        const { search = '', limit = 10, role = '' } = req.query;
        
        console.log('Search users request:', { search, limit, role });
        
        if (!search || search.length < 2) {
            return res.status(200).json({
                success: true,
                data: {
                    users: []
                }
            });
        }
        
        // Build query object for search
        const query = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ]
        };
        
        // Make role matching case-insensitive
        if (role) {
            query.role = { $regex: `^${role}$`, $options: 'i' };
        }
        
        console.log('Search query:', JSON.stringify(query, null, 2));
        
        // Get matching users
        const users = await User.find(query)
            .select('name email username role position jobTitle status')
            .limit(parseInt(limit))
            .sort({ name: 1 });
        
        console.log(`Found ${users.length} users:`, users.map(u => ({ name: u.name, email: u.email, role: u.role })));
        
        res.status(200).json({
            success: true,
            data: {
                users
            }
        });
    });






}

module.exports = new UserController();
