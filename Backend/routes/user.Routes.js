const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.Controller");
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordChange,
  validateUserUpdate,
  handleValidationErrors
} = require('../middleware/validate');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { uploadProfileImage, uploadProfileImageFlexible, processProfileImage } = require('../middleware/upload');

// Public routes
router.post("/register", validateUserRegistration, handleValidationErrors, userController.register);
router.post("/login", validateUserLogin, handleValidationErrors, userController.login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, userController.getProfile);
router.post('/logout', authenticateToken, userController.logout);
router.patch('/profile', authenticateToken, requireRole(['Admin', 'Recruiter', 'Candidate']), uploadProfileImageFlexible, processProfileImage, validateUserUpdate, handleValidationErrors, userController.updateProfile);
router.post('/upload-avatar', authenticateToken, uploadProfileImageFlexible, processProfileImage, userController.uploadAvatar);
router.post('/upload-profile-image', authenticateToken, uploadProfileImage, processProfileImage, userController.uploadAvatar);
router.post('/change-password', authenticateToken, validatePasswordChange, handleValidationErrors, userController.changePassword);
router.get('/verify-token', authenticateToken, userController.verifyToken);

// Admin routes
router.get('/all', authenticateToken, requireRole(['Admin']), userController.getAllUsers);
router.get('/search', authenticateToken, requireRole(['Admin', 'Recruiter']), userController.searchUsers);
router.get('/:userId', authenticateToken, userController.getUserById);
router.put('/profile/:id', authenticateToken, uploadProfileImageFlexible, processProfileImage, validateUserUpdate, handleValidationErrors, userController.updateProfile);
router.delete('/:userId', authenticateToken, requireRole(['Admin']), userController.deleteUser);
router.get('/admin/statistics', authenticateToken, requireRole(['Admin']), userController.getUserStatistics);

module.exports = router;


















































// const express = require('express');
// const userController = require('../controllers/userController');
// const router = express.Router();
// const { 
//   validateUserRegistration, 
//   validateUserLogin, 
//   validatePasswordChange,
//   validateUserUpdate
// } = require('../middleware/validate');
// const { authenticateToken, requireRole } = require('../middleware/auth');

// // Public routes
// router.post('/register', validateUserRegistration, userController.register);
// router.post('/login', validateUserLogin, userController.login);

// // Protected routes (require authentication)
// router.use(authenticateToken); // Apply authentication middleware to all routes below

// // Profile management
// router.get('/profile', userController.getProfile);
// // Update profile - current user or specific user
// router.patch('/profile', authenticateToken, requireRole(['Admin', 'Recruiter', 'Candidate']), validateUserUpdate, userController.updateProfile);
// router.put('/profile/:id', validateUserUpdate, userController.updateProfile);
// router.post('/change-password', validatePasswordChange, userController.changePassword);
// router.post('/logout', userController.logout);
// router.get('/verify-token', userController.verifyToken);

// // Admin-only routes
// router.get('/all', requireRole(['Admin']), userController.getAllUsers);
// router.get('/:userId', userController.getUserById);
// router.delete('/:userId', requireRole(['Admin']), userController.deleteUser);
// router.get('/admin/statistics', requireRole(['Admin']), userController.getUserStatistics);

// module.exports = router;
