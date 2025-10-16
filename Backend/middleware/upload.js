const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const mime = require('mime-types');
const AppError = require('../utils/AppError');

// ===========================================================================================================================
// ================================================ Enhanced Upload Middleware ==============================================
// ===========================================================================================================================

// ===========================================================================================================================
// -------------------------------------------------- Configuration & Setup -------------------------------------------------
// ===========================================================================================================================

// Upload directories configuration
const UPLOAD_DIRS = {
    profiles: 'uploads/profiles',
    avatars: 'uploads/avatars',
    documents: 'uploads/documents',
    interviews: 'uploads/interviews',
    videos: 'uploads/videos',
    audio: 'uploads/audio',
    images: 'uploads/images',
    templates: 'uploads/templates',
    attachments: 'uploads/attachments',
    portfolio: 'uploads/portfolio',
    branding: 'uploads/branding',
    temp: 'uploads/temp'
};

// File type configurations
const FILE_CONFIGS = {
    image: {
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        maxSize: 10 * 1024 * 1024, // 10MB
        extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    },
    video: {
        allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'],
        maxSize: 500 * 1024 * 1024, // 500MB
        extensions: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv']
    },
    audio: {
        allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm', 'audio/m4a'],
        maxSize: 50 * 1024 * 1024, // 50MB
        extensions: ['.mp3', '.wav', '.ogg', '.webm', '.m4a']
    },
    document: {
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv'
        ],
        maxSize: 25 * 1024 * 1024, // 25MB
        extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv']
    },
    any: {
        allowedTypes: '*', // Allow any type
        maxSize: 100 * 1024 * 1024, // 100MB
        extensions: '*'
    }
};

// Create upload directories
const createUploadDirectories = async () => {
    try {
        for (const [key, dir] of Object.entries(UPLOAD_DIRS)) {
            const dirPath = path.join(__dirname, '..', dir);
            try {
                await fs.access(dirPath);
            } catch {
                await fs.mkdir(dirPath, { recursive: true });
            }
        }
    } catch (error) {
        console.error('Error creating upload directories:', error);
    }
};

// Initialize directories
createUploadDirectories();

// ===========================================================================================================================
// -------------------------------------------------- File Validation Functions ---------------------------------------------
// ===========================================================================================================================

/**
 * Generate secure filename
 */
const generateSecureFilename = (originalName, userId, prefix = '') => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const extension = path.extname(sanitizedName);
    const baseName = path.basename(sanitizedName, extension);
    
    return `${prefix}${prefix ? '-' : ''}${baseName}-${userId}-${timestamp}-${randomString}${extension}`;
};

/**
 * Validate file type
 */
const validateFileType = (file, allowedConfig) => {
    if (allowedConfig.allowedTypes === '*') return true;
    
    const isValidMimeType = allowedConfig.allowedTypes.includes(file.mimetype);
    const extension = path.extname(file.originalname).toLowerCase();
    const isValidExtension = allowedConfig.extensions === '*' || allowedConfig.extensions.includes(extension);
    
    return isValidMimeType && isValidExtension;
};

/**
 * Check file size
 */
const validateFileSize = (file, maxSize) => {
    return file.size <= maxSize;
};

/**
 * Sanitize filename for security
 */
const sanitizeFilename = (filename) => {
    // Remove path traversal attempts and dangerous characters
    return filename
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\.\./g, '_')
        .replace(/^\./, '_')
        .trim();
};

/**
 * Detect file type by content (magic numbers)
 */
const detectFileType = (buffer) => {
    const signatures = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/gif': [0x47, 0x49, 0x46],
        'image/webp': [0x52, 0x49, 0x46, 0x46],
        'application/pdf': [0x25, 0x50, 0x44, 0x46],
        'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70],
        'audio/mpeg': [0xFF, 0xFB],
        'application/zip': [0x50, 0x4B, 0x03, 0x04]
    };

    for (const [mimeType, signature] of Object.entries(signatures)) {
        if (signature.every((byte, index) => buffer[index] === byte)) {
            return mimeType;
        }
    }
    return null;
};

// ===========================================================================================================================
// -------------------------------------------------- Storage Configurations -----------------------------------------------
// ===========================================================================================================================

// Memory storage for processing
const memoryStorage = multer.memoryStorage();

// Disk storage with custom filename handling
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadType = req.uploadType || 'temp';
        const directory = UPLOAD_DIRS[uploadType] || UPLOAD_DIRS.temp;
        const fullPath = path.join(__dirname, '..', directory);
        
        // Ensure directory exists
        fs.mkdir(fullPath, { recursive: true })
            .then(() => cb(null, fullPath))
            .catch(err => cb(err));
    },
    filename: (req, file, cb) => {
        const userId = req.user?.userId || 'anonymous';
        const prefix = req.filenamePrefix || '';
        const secureFilename = generateSecureFilename(file.originalname, userId, prefix);
        cb(null, secureFilename);
    }
});

// ===========================================================================================================================
// -------------------------------------------------- File Filter Factories -------------------------------------------------
// ===========================================================================================================================

/**
 * Create file filter based on type
 */
const createFileFilter = (fileType = 'any') => {
    return (req, file, cb) => {
        const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.any;
        
        // Validate file type
        if (!validateFileType(file, config)) {
            return cb(new AppError(`Invalid file type. Allowed: ${config.extensions.join(', ')}`, 400), false);
        }

        // Sanitize filename
        file.originalname = sanitizeFilename(file.originalname);
        
        cb(null, true);
    };
};

/**
 * Create custom file filter with specific validation
 */
const createCustomFileFilter = (options = {}) => {
    const {
        allowedTypes = ['*'],
        maxSize = 10 * 1024 * 1024,
        allowedExtensions = ['*'],
        customValidation = null
    } = options;

    return (req, file, cb) => {
        // Check file type
        if (allowedTypes[0] !== '*' && !allowedTypes.includes(file.mimetype)) {
            return cb(new AppError(`File type not allowed: ${file.mimetype}`, 400), false);
        }

        // Check extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions[0] !== '*' && !allowedExtensions.includes(ext)) {
            return cb(new AppError(`File extension not allowed: ${ext}`, 400), false);
        }

        // Custom validation
        if (customValidation && !customValidation(file, req)) {
            return cb(new AppError('File failed custom validation', 400), false);
        }

        cb(null, true);
    };
};

// ===========================================================================================================================
// -------------------------------------------------- Multer Configurations -------------------------------------------------
// ===========================================================================================================================

/**
 * Create multer instance with specific configuration
 */
const createMulterInstance = (options = {}) => {
    const {
        storage = memoryStorage,
        fileType = 'any',
        maxFiles = 10,
        customFilter = null
    } = options;

    const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.any;
    
    return multer({
        storage,
        fileFilter: customFilter || createFileFilter(fileType),
        limits: {
            fileSize: config.maxSize,
            files: maxFiles,
            fields: 20,
            fieldNameSize: 100,
            fieldSize: 1 * 1024 * 1024 // 1MB for field data
        }
    });
};

// Predefined multer instances
const uploaders = {
    // Image uploaders
    image: createMulterInstance({ fileType: 'image' }),
    avatar: createMulterInstance({ fileType: 'image', maxFiles: 1 }),
    profile: createMulterInstance({ fileType: 'image', maxFiles: 1 }),
    
    // Video uploaders
    video: createMulterInstance({ fileType: 'video', maxFiles: 1 }),
    interviewVideo: createMulterInstance({ fileType: 'video', maxFiles: 1 }),
    
    // Audio uploaders
    audio: createMulterInstance({ fileType: 'audio', maxFiles: 1 }),
    interviewAudio: createMulterInstance({ fileType: 'audio', maxFiles: 1 }),
    
    // Document uploaders
    document: createMulterInstance({ fileType: 'document' }),
    template: createMulterInstance({ fileType: 'document', maxFiles: 1 }),
    
    // General uploaders
    any: createMulterInstance({ fileType: 'any' }),
    multiple: createMulterInstance({ fileType: 'any', maxFiles: 20 }),
    
    // Specialized uploaders
    portfolio: createMulterInstance({ fileType: 'any', maxFiles: 15 }),
    branding: createMulterInstance({ fileType: 'image', maxFiles: 10 }),
    attachments: createMulterInstance({ fileType: 'any', maxFiles: 5 })
};

// ===========================================================================================================================
// -------------------------------------------------- Middleware Functions --------------------------------------------------
// ===========================================================================================================================

/**
 * Setup upload type middleware
 */
const setUploadType = (type) => {
    return (req, res, next) => {
        req.uploadType = type;
        next();
    };
};

/**
 * Setup filename prefix middleware
 */
const setFilenamePrefix = (prefix) => {
    return (req, res, next) => {
        req.filenamePrefix = prefix;
        next();
    };
};

/**
 * Validate uploaded files middleware
 */
const validateUploadedFiles = (req, res, next) => {
    if (!req.files && !req.file) {
        return next(new AppError('No files uploaded', 400));
    }

    const files = req.files || [req.file];
    
    // Validate each file
    for (const file of files) {
        if (!file.buffer && !file.path) {
            return next(new AppError('Invalid file data', 400));
        }
        
        // Check for potential security threats
        if (file.originalname.includes('../') || file.originalname.includes('..\\')) {
            return next(new AppError('Invalid filename: path traversal detected', 400));
        }
        
        // Additional security checks can be added here
        // - Virus scanning
        // - Content validation
        // - File header verification
    }

    next();
};

/**
 * Process uploaded image files
 */
const processImages = async (req, res, next) => {
    if (!req.files && !req.file) return next();
    
    const files = req.files || [req.file];
    const imageFiles = files.filter(file => file.mimetype.startsWith('image/'));
    
    if (imageFiles.length === 0) return next();
    
    try {
        req.processedImages = [];
        
        for (const imageFile of imageFiles) {
            const userId = req.user?.userId || 'anonymous';
            const uploadType = req.uploadType || 'images';
            const prefix = req.filenamePrefix || 'img';
            
            // Generate filename
            const filename = generateSecureFilename(imageFile.originalname, userId, prefix);
            const directory = UPLOAD_DIRS[uploadType] || UPLOAD_DIRS.images;
            const filepath = path.join(__dirname, '..', directory, filename);
            
            // Process with Sharp
            const processedImage = await sharp(imageFile.buffer)
                .resize(1920, 1080, { 
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 90 })
                .toFile(filepath);
            
            // Add processed image info
            req.processedImages.push({
                originalName: imageFile.originalname,
                filename,
                path: filepath,
                url: `/${directory}/${filename}`,
                size: processedImage.size,
                width: processedImage.width,
                height: processedImage.height,
                format: processedImage.format
            });
        }
        
        next();
    } catch (error) {
        next(new AppError('Error processing images', 500));
    }
};

/**
 * Generate thumbnails for images
 */
const generateThumbnails = async (req, res, next) => {
    if (!req.processedImages || req.processedImages.length === 0) return next();
    
    try {
        for (const processedImage of req.processedImages) {
            const thumbnailSizes = [150, 300, 600];
            processedImage.thumbnails = [];
            
            for (const size of thumbnailSizes) {
                const thumbnailFilename = `thumb-${size}-${processedImage.filename}`;
                const directory = path.dirname(processedImage.path);
                const thumbnailPath = path.join(directory, thumbnailFilename);
                
                await sharp(processedImage.path)
                    .resize(size, size, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .jpeg({ quality: 80 })
                    .toFile(thumbnailPath);
                
                processedImage.thumbnails.push({
                    size,
                    filename: thumbnailFilename,
                    url: `/${path.relative(path.join(__dirname, '..'), thumbnailPath).replace(/\\/g, '/')}`
                });
            }
        }
        
        next();
    } catch (error) {
        next(new AppError('Error generating thumbnails', 500));
    }
};

/**
 * Clean up temporary files
 */
const cleanupTempFiles = async (req, res, next) => {
    // Clean up files in memory or temp directory
    if (req.files) {
        req.files.forEach(file => {
            if (file.path && file.path.includes('temp')) {
                fs.unlink(file.path).catch(err => console.error('Cleanup error:', err));
            }
        });
    }
    
    next();
};

// ===========================================================================================================================
// -------------------------------------------------- Error Handling Middleware ---------------------------------------------
// ===========================================================================================================================

/**
 * Handle multer errors
 */
const handleUploadErrors = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return next(new AppError('File too large', 400));
            case 'LIMIT_FILE_COUNT':
                return next(new AppError('Too many files', 400));
            case 'LIMIT_FIELD_COUNT':
                return next(new AppError('Too many fields', 400));
            case 'LIMIT_UNEXPECTED_FILE':
                return next(new AppError('Unexpected file field', 400));
            default:
                return next(new AppError(`Upload error: ${error.message}`, 400));
        }
    }
    next(error);
};

// ===========================================================================================================================
// -------------------------------------------------- Legacy Support --------------------------------------------------------
// ===========================================================================================================================

// Legacy profile image functions (backward compatibility)
const uploadProfileImageFlexible = (req, res, next) => {
    req.uploadType = 'profiles';
    req.filenamePrefix = 'profile';
    
    const uploadSingle = uploaders.image.any();
    
    uploadSingle(req, res, (err) => {
        if (err) return handleUploadErrors(err, req, res, next);
        
        if (req.files && req.files.length > 0) {
            req.file = req.files.find(file => file.mimetype.startsWith('image/'));
            if (!req.file) {
                return next(new AppError('No valid image file found', 400));
            }
        }
        
        next();
    });
};

const processProfileImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const userId = req.user?.userId || 'anonymous';
        const filename = generateSecureFilename(req.file.originalname, userId, 'profile');
        const filepath = path.join(__dirname, '../uploads/profiles', filename);

        await sharp(req.file.buffer)
            .resize(300, 300, { 
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 90 })
            .toFile(filepath);

        req.processedFile = {
            filename,
            path: filepath,
            url: `/uploads/profiles/${filename}`
        };

        next();
    } catch (error) {
        next(new AppError('Error processing image', 500));
    }
};

const deleteOldProfileImage = async (userId) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        if (user && user.profilePicture && user.profilePicture.startsWith('/uploads/')) {
            const oldFilepath = path.join(__dirname, '..', user.profilePicture);
            try {
                await fs.unlink(oldFilepath);
            } catch (err) {
                console.error('File deletion error:', err);
            }
        }
    } catch (error) {
        console.error('Error deleting old profile image:', error);
    }
};

// ===========================================================================================================================
// -------------------------------------------------- Module Exports --------------------------------------------------------
// ===========================================================================================================================

module.exports = {
    // Multer instances
    single: (fieldName, fileType = 'any') => uploaders[fileType]?.single(fieldName) || uploaders.any.single(fieldName),
    array: (fieldName, maxCount = 10, fileType = 'any') => uploaders[fileType]?.array(fieldName, maxCount) || uploaders.any.array(fieldName, maxCount),
    fields: (fields, fileType = 'any') => uploaders[fileType]?.fields(fields) || uploaders.any.fields(fields),
    any: (fileType = 'any') => uploaders[fileType]?.any() || uploaders.any.any(),
    
    // Specialized uploaders
    uploadImage: uploaders.image.single('image'),
    uploadImages: uploaders.image.array('images', 10),
    uploadVideo: uploaders.video.single('video'),
    uploadAudio: uploaders.audio.single('audio'),
    uploadDocument: uploaders.document.single('document'),
    uploadDocuments: uploaders.document.array('documents', 5),
    uploadAvatar: uploaders.avatar.single('avatar'),
    uploadProfile: uploaders.profile.single('profileImage'),
    uploadTemplate: uploaders.template.single('template'),
    uploadPortfolio: uploaders.portfolio.array('portfolioFiles', 15),
    uploadBranding: uploaders.branding.array('brandingAssets', 10),
    uploadAttachments: uploaders.attachments.array('attachments', 5),
    
    // Interview specific
    uploadInterviewVideo: uploaders.interviewVideo.single('videoFile'),
    uploadInterviewAudio: uploaders.interviewAudio.single('audioFile'),
    uploadInterviewRecording: uploaders.video.single('recording'),
    uploadInterviewScreenshot: uploaders.image.single('screenshot'),
    
    // Middleware functions
    setUploadType,
    setFilenamePrefix,
    validateUploadedFiles,
    processImages,
    generateThumbnails,
    cleanupTempFiles,
    handleUploadErrors,
    
    // Legacy support
    uploadProfileImage: uploaders.profile.single('profileImage'),
    uploadProfileImageFlexible,
    processProfileImage,
    deleteOldProfileImage,
    
    // Utility functions
    generateSecureFilename,
    validateFileType,
    validateFileSize,
    sanitizeFilename,
    detectFileType,
    createFileFilter,
    createCustomFileFilter,
    createMulterInstance,
    
    // Constants
    UPLOAD_DIRS,
    FILE_CONFIGS
};