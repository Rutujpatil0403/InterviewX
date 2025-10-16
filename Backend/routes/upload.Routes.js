const express = require('express');
const router = express.Router();

// Import controllers
const uploadController = require('../controllers/upload.Controller');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');


// ===========================================================================================================================
// ================================================ Upload Routes ============================================================
// ===========================================================================================================================

// ===========================================================================================================================
// -------------------------------------------------- Single File Upload Routes ---------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Upload single file
 * @route   POST /api/upload/single
 * @access  Private
 */
router.post('/single', 
  protect,
  upload.single('file'),
  validateRequest,
  uploadController.uploadSingleFile
);

/**
 * @desc    Upload profile image
 * @route   POST /api/upload/profile
 * @access  Private
 */
router.post('/profile',
  protect,
  upload.single('profileImage'),
  validateRequest,
  uploadController.uploadProfileImage
);

/**
 * @desc    Upload user avatar
 * @route   POST /api/upload/avatar
 * @access  Private
 */
router.post('/avatar',
  protect,
  upload.single('avatar'),
  validateRequest,
  uploadController.uploadAvatar
);

/**
 * @desc    Upload document file
 * @route   POST /api/upload/document
 * @access  Private
 */
router.post('/document',
  protect,
  upload.single('document'),
  validateRequest,
  uploadController.uploadDocument
);

// ===========================================================================================================================
// -------------------------------------------------- Multiple File Upload Routes -------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Upload multiple files
 * @route   POST /api/upload/multiple
 * @access  Private
 */
router.post('/multiple',
  protect,
  upload.array('files', 10), // Max 10 files
  validateRequest,
  uploadController.uploadMultipleFiles
);

/**
 * @desc    Upload interview attachments
 * @route   POST /api/upload/interview/attachments
 * @access  Private
 */
router.post('/interview/attachments',
  protect,
  upload.array('attachments', 5), // Max 5 attachments
  validateRequest,
  uploadController.uploadInterviewAttachments
);

/**
 * @desc    Upload portfolio files
 * @route   POST /api/upload/portfolio
 * @access  Private
 */
router.post('/portfolio',
  protect,
  upload.array('portfolioFiles', 15), // Max 15 portfolio files
  validateRequest,
  uploadController.uploadPortfolioFiles
);

// ===========================================================================================================================
// -------------------------------------------------- Interview Media Routes ------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Upload interview video
 * @route   POST /api/upload/interview/video
 * @access  Private
 */
router.post('/interview/video',
  protect,
  upload.single('videoFile'),
  validateRequest,
  uploadController.uploadInterviewVideo
);

/**
 * @desc    Upload interview audio
 * @route   POST /api/upload/interview/audio
 * @access  Private
 */
router.post('/interview/audio',
  protect,
  upload.single('audioFile'),
  validateRequest,
  uploadController.uploadInterviewAudio
);

/**
 * @desc    Upload interview screenshot
 * @route   POST /api/upload/interview/screenshot
 * @access  Private
 */
router.post('/interview/screenshot',
  protect,
  upload.single('screenshot'),
  validateRequest,
  uploadController.uploadInterviewScreenshot
);

/**
 * @desc    Upload interview recording
 * @route   POST /api/upload/interview/recording
 * @access  Private
 */
router.post('/interview/recording',
  protect,
  upload.single('recording'),
  validateRequest,
  uploadController.uploadInterviewRecording
);

// ===========================================================================================================================
// -------------------------------------------------- Template & Content Routes ---------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Upload template file
 * @route   POST /api/upload/template
 * @access  Private (Admin/HR only)
 */
router.post('/template',
  protect,
  authorize('Admin', 'HR'),
  upload.single('templateFile'),
  validateRequest,
  uploadController.uploadTemplate
);

/**
 * @desc    Upload company logo
 * @route   POST /api/upload/company/logo
 * @access  Private (Admin only)
 */
router.post('/company/logo',
  protect,
  authorize('Admin'),
  upload.single('logo'),
  validateRequest,
  uploadController.uploadCompanyLogo
);

/**
 * @desc    Upload company branding assets
 * @route   POST /api/upload/company/branding
 * @access  Private (Admin only)
 */
router.post('/company/branding',
  protect,
  authorize('Admin'),
  upload.array('brandingAssets', 10),
  validateRequest,
  uploadController.uploadBrandingAssets
);

// ===========================================================================================================================
// -------------------------------------------------- File Management Routes ------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Get file by ID
 * @route   GET /api/upload/file/:fileId
 * @access  Private
 */
router.get('/file/:fileId',
  protect,
  uploadController.getFileById
);

/**
 * @desc    Get user files
 * @route   GET /api/upload/user/files
 * @access  Private
 */
router.get('/user/files',
  protect,
  uploadController.getUserFiles
);

/**
 * @desc    Get interview files
 * @route   GET /api/upload/interview/:interviewId/files
 * @access  Private
 */
router.get('/interview/:interviewId/files',
  protect,
  uploadController.getInterviewFiles
);

/**
 * @desc    Download file
 * @route   GET /api/upload/download/:fileId
 * @access  Private
 */
router.get('/download/:fileId',
  protect,
  uploadController.downloadFile
);

/**
 * @desc    Stream file
 * @route   GET /api/upload/stream/:fileId
 * @access  Private
 */
router.get('/stream/:fileId',
  protect,
  uploadController.streamFile
);

// ===========================================================================================================================
// -------------------------------------------------- File Operations Routes ------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Update file metadata
 * @route   PUT /api/upload/file/:fileId/metadata
 * @access  Private
 */
router.put('/file/:fileId/metadata',
  protect,
  validateRequest,
  uploadController.updateFileMetadata
);

/**
 * @desc    Replace file
 * @route   PUT /api/upload/file/:fileId/replace
 * @access  Private
 */
router.put('/file/:fileId/replace',
  protect,
  upload.single('newFile'),
  validateRequest,
  uploadController.replaceFile
);

/**
 * @desc    Copy/duplicate file
 * @route   POST /api/upload/file/:fileId/copy
 * @access  Private
 */
router.post('/file/:fileId/copy',
  protect,
  validateRequest,
  uploadController.copyFile
);

/**
 * @desc    Move file to different directory
 * @route   PUT /api/upload/file/:fileId/move
 * @access  Private
 */
router.put('/file/:fileId/move',
  protect,
  validateRequest,
  uploadController.moveFile
);

/**
 * @desc    Delete file
 * @route   DELETE /api/upload/file/:fileId
 * @access  Private
 */
router.delete('/file/:fileId',
  protect,
  uploadController.deleteFile
);

/**
 * @desc    Bulk delete files
 * @route   DELETE /api/upload/files/bulk
 * @access  Private
 */
router.delete('/files/bulk',
  protect,
  validateRequest,
  uploadController.bulkDeleteFiles
);

// ===========================================================================================================================
// -------------------------------------------------- Image Processing Routes -----------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Resize image
 * @route   POST /api/upload/image/:fileId/resize
 * @access  Private
 */
router.post('/image/:fileId/resize',
  protect,
  validateRequest,
  uploadController.resizeImage
);

/**
 * @desc    Crop image
 * @route   POST /api/upload/image/:fileId/crop
 * @access  Private
 */
router.post('/image/:fileId/crop',
  protect,
  validateRequest,
  uploadController.cropImage
);

/**
 * @desc    Apply image filters
 * @route   POST /api/upload/image/:fileId/filter
 * @access  Private
 */
router.post('/image/:fileId/filter',
  protect,
  validateRequest,
  uploadController.applyImageFilter
);

/**
 * @desc    Generate image thumbnail
 * @route   POST /api/upload/image/:fileId/thumbnail
 * @access  Private
 */
router.post('/image/:fileId/thumbnail',
  protect,
  validateRequest,
  uploadController.generateThumbnail
);

/**
 * @desc    Get image thumbnails
 * @route   GET /api/upload/image/:fileId/thumbnails
 * @access  Private
 */
router.get('/image/:fileId/thumbnails',
  protect,
  uploadController.getThumbnails
);

// ===========================================================================================================================
// -------------------------------------------------- Video Processing Routes -----------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Process video file
 * @route   POST /api/upload/video/:fileId/process
 * @access  Private
 */
router.post('/video/:fileId/process',
  protect,
  validateRequest,
  uploadController.processVideoFile
);

/**
 * @desc    Extract video frames
 * @route   POST /api/upload/video/:fileId/frames
 * @access  Private
 */
router.post('/video/:fileId/frames',
  protect,
  validateRequest,
  uploadController.extractVideoFrames
);

/**
 * @desc    Generate video thumbnail
 * @route   POST /api/upload/video/:fileId/thumbnail
 * @access  Private
 */
router.post('/video/:fileId/thumbnail',
  protect,
  validateRequest,
  uploadController.generateVideoThumbnail
);

/**
 * @desc    Compress video
 * @route   POST /api/upload/video/:fileId/compress
 * @access  Private
 */
router.post('/video/:fileId/compress',
  protect,
  validateRequest,
  uploadController.compressVideo
);

/**
 * @desc    Convert video format
 * @route   POST /api/upload/video/:fileId/convert
 * @access  Private
 */
router.post('/video/:fileId/convert',
  protect,
  validateRequest,
  uploadController.convertVideoFormat
);

// ===========================================================================================================================
// -------------------------------------------------- Audio Processing Routes -----------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Process audio file
 * @route   POST /api/upload/audio/:fileId/process
 * @access  Private
 */
router.post('/audio/:fileId/process',
  protect,
  validateRequest,
  uploadController.processAudioFile
);

/**
 * @desc    Extract audio metadata
 * @route   GET /api/upload/audio/:fileId/metadata
 * @access  Private
 */
router.get('/audio/:fileId/metadata',
  protect,
  uploadController.extractAudioMetadata
);

/**
 * @desc    Convert audio format
 * @route   POST /api/upload/audio/:fileId/convert
 * @access  Private
 */
router.post('/audio/:fileId/convert',
  protect,
  validateRequest,
  uploadController.convertAudioFormat
);

/**
 * @desc    Compress audio
 * @route   POST /api/upload/audio/:fileId/compress
 * @access  Private
 */
router.post('/audio/:fileId/compress',
  protect,
  validateRequest,
  uploadController.compressAudio
);

// ===========================================================================================================================
// -------------------------------------------------- Storage & Analytics Routes --------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Get storage usage statistics
 * @route   GET /api/upload/storage/usage
 * @access  Private
 */
router.get('/storage/usage',
  protect,
  uploadController.getStorageUsage
);

/**
 * @desc    Get user storage quota
 * @route   GET /api/upload/storage/quota
 * @access  Private
 */
router.get('/storage/quota',
  protect,
  uploadController.getUserStorageQuota
);

/**
 * @desc    Get file analytics
 * @route   GET /api/upload/analytics/files
 * @access  Private (Admin only)
 */
router.get('/analytics/files',
  protect,
  authorize('Admin'),
  uploadController.getFileAnalytics
);

/**
 * @desc    Get upload analytics
 * @route   GET /api/upload/analytics/uploads
 * @access  Private (Admin only)
 */
router.get('/analytics/uploads',
  protect,
  authorize('Admin'),
  uploadController.getUploadAnalytics
);

// ===========================================================================================================================
// -------------------------------------------------- Cleanup & Maintenance Routes ------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Clean up temporary files
 * @route   POST /api/upload/cleanup/temp
 * @access  Private (Admin only)
 */
router.post('/cleanup/temp',
  protect,
  authorize('Admin'),
  uploadController.cleanupTempFiles
);

/**
 * @desc    Clean up orphaned files
 * @route   POST /api/upload/cleanup/orphaned
 * @access  Private (Admin only)
 */
router.post('/cleanup/orphaned',
  protect,
  authorize('Admin'),
  uploadController.cleanupOrphanedFiles
);

/**
 * @desc    Validate file integrity
 * @route   POST /api/upload/validate/integrity
 * @access  Private (Admin only)
 */
router.post('/validate/integrity',
  protect,
  authorize('Admin'),
  uploadController.validateFileIntegrity
);

/**
 * @desc    Scan files for viruses
 * @route   POST /api/upload/scan/virus
 * @access  Private (Admin only)
 */
router.post('/scan/virus',
  protect,
  authorize('Admin'),
  uploadController.scanForViruses
);

// ===========================================================================================================================
// -------------------------------------------------- Backup & Migration Routes ---------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Backup files to cloud storage
 * @route   POST /api/upload/backup/cloud
 * @access  Private (Admin only)
 */
router.post('/backup/cloud',
  protect,
  authorize('Admin'),
  uploadController.backupToCloud
);

/**
 * @desc    Migrate files to different storage
 * @route   POST /api/upload/migrate/storage
 * @access  Private (Admin only)
 */
router.post('/migrate/storage',
  protect,
  authorize('Admin'),
  uploadController.migrateToStorage
);

/**
 * @desc    Sync files with cloud storage
 * @route   POST /api/upload/sync/cloud
 * @access  Private (Admin only)
 */
router.post('/sync/cloud',
  protect,
  authorize('Admin'),
  uploadController.syncWithCloud
);

/**
 * @desc    Archive old files
 * @route   POST /api/upload/archive/files
 * @access  Private (Admin only)
 */
router.post('/archive/files',
  protect,
  authorize('Admin'),
  uploadController.archiveOldFiles
);

// ===========================================================================================================================
// -------------------------------------------------- Sharing & Permissions Routes ------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Share file with users
 * @route   POST /api/upload/file/:fileId/share
 * @access  Private
 */
router.post('/file/:fileId/share',
  protect,
  validateRequest,
  uploadController.shareFile
);

/**
 * @desc    Update file permissions
 * @route   PUT /api/upload/file/:fileId/permissions
 * @access  Private
 */
router.put('/file/:fileId/permissions',
  protect,
  validateRequest,
  uploadController.updateFilePermissions
);

/**
 * @desc    Get file access log
 * @route   GET /api/upload/file/:fileId/access-log
 * @access  Private
 */
router.get('/file/:fileId/access-log',
  protect,
  uploadController.getFileAccessLog
);

/**
 * @desc    Generate file share link
 * @route   POST /api/upload/file/:fileId/share-link
 * @access  Private
 */
router.post('/file/:fileId/share-link',
  protect,
  validateRequest,
  uploadController.generateShareLink
);

/**
 * @desc    Revoke file access
 * @route   DELETE /api/upload/file/:fileId/access/:userId
 * @access  Private
 */
router.delete('/file/:fileId/access/:userId',
  protect,
  uploadController.revokeFileAccess
);

module.exports = router;
