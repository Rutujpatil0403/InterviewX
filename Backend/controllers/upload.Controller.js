const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const crypto = require('crypto');

// Import models
const User = require('../models/User');
const Interview = require('../models/Interview');

// Import utilities
const AppError = require('../utils/AppError');

// ===========================================================================================================================
// ================================================ Upload Controller ========================================================
// ===========================================================================================================================

class UploadController {

  // ===========================================================================================================================
  // -------------------------------------------------- File Upload Operations ------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Upload single file with validation and processing
   * @route   POST /api/upload/single
   * @access  Private
   */
  uploadSingleFile = asyncHandler(async (req, res) => {
    const { 
      fileType = 'general',
      category = 'documents',
      generateThumbnail = false,
      processVideo = false,
      maxFileSize = null
    } = req.body;

    // Validate file upload
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate file type and size
    await this.validateFile(req.file, fileType, maxFileSize);

    // Generate unique filename with user context
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${req.user.userId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
    const relativePath = `uploads/${category}/${uniqueFilename}`;
    const fullPath = path.join(process.cwd(), relativePath);

    // Ensure directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));

    // Move file to final destination
    await fs.rename(req.file.path, fullPath);

    // Create file metadata
    const fileMetadata = {
      _id: new mongoose.Types.ObjectId(),
      originalName: req.file.originalname,
      filename: uniqueFilename,
      path: relativePath,
      url: `/uploads/${category}/${uniqueFilename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      category,
      fileType,
      isProcessed: false,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    };

    // Process file based on type
    let processingResults = {};
    
    if (req.file.mimetype.startsWith('image/')) {
      processingResults = await this.processImageFile(fullPath, fileMetadata, generateThumbnail);
    } else if (req.file.mimetype.startsWith('video/') && processVideo) {
      processingResults = await this.processVideoFile(fullPath, fileMetadata);
    } else if (req.file.mimetype.startsWith('audio/')) {
      processingResults = await this.processAudioFile(fullPath, fileMetadata);
    }

    // Update metadata with processing results
    fileMetadata.metadata = { ...fileMetadata.metadata, ...processingResults };
    fileMetadata.isProcessed = true;

    // Save file record (would save to File collection)
    await this.saveFileRecord(fileMetadata);

    // Update user storage usage
    await this.updateUserStorageUsage(req.user.userId, req.file.size);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: fileMetadata._id,
        originalName: fileMetadata.originalName,
        filename: fileMetadata.filename,
        url: fileMetadata.url,
        size: fileMetadata.size,
        mimeType: fileMetadata.mimeType,
        category: fileMetadata.category,
        uploadedAt: fileMetadata.uploadedAt,
        processing: processingResults,
        metadata: fileMetadata.metadata
      }
    });
  });

  /**
   * @desc    Upload multiple files with batch processing
   * @route   POST /api/upload/multiple
   * @access  Private
   */
  uploadMultipleFiles = asyncHandler(async (req, res) => {
    const { 
      category = 'documents',
      generateThumbnails = false,
      processVideos = false,
      maxFiles = 10
    } = req.body;

    // Validate files exist
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    // Check file count limit
    if (req.files.length > maxFiles) {
      throw new AppError(`Maximum ${maxFiles} files allowed`, 400);
    }

    const uploadResults = [];
    const errors = [];
    let totalSize = 0;

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validate file
        await this.validateFile(file, 'general', null);
        
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${req.user.userId}-${Date.now()}-${i}-${crypto.randomBytes(6).toString('hex')}${fileExtension}`;
        const relativePath = `uploads/${category}/${uniqueFilename}`;
        const fullPath = path.join(process.cwd(), relativePath);

        // Ensure directory exists
        await this.ensureDirectoryExists(path.dirname(fullPath));

        // Move file
        await fs.rename(file.path, fullPath);

        // Create metadata
        const fileMetadata = {
          _id: new mongoose.Types.ObjectId(),
          originalName: file.originalname,
          filename: uniqueFilename,
          path: relativePath,
          url: `/uploads/${category}/${uniqueFilename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user.userId,
          uploadedAt: new Date(),
          category,
          batchId: req.body.batchId || crypto.randomUUID(),
          order: i,
          isProcessed: false
        };

        // Process file if needed
        let processingResults = {};
        if (file.mimetype.startsWith('image/') && generateThumbnails) {
          processingResults = await this.processImageFile(fullPath, fileMetadata, true);
        } else if (file.mimetype.startsWith('video/') && processVideos) {
          processingResults = await this.processVideoFile(fullPath, fileMetadata);
        }

        fileMetadata.metadata = processingResults;
        fileMetadata.isProcessed = true;

        // Save file record
        await this.saveFileRecord(fileMetadata);

        totalSize += file.size;

        uploadResults.push({
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          mimeType: fileMetadata.mimeType,
          order: i,
          processing: processingResults
        });

      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message,
          order: i
        });

        // Clean up failed file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to cleanup file:', unlinkError);
        }
      }
    }

    // Update user storage usage for successful uploads
    if (totalSize > 0) {
      await this.updateUserStorageUsage(req.user.userId, totalSize);
    }

    res.status(201).json({
      success: uploadResults.length > 0,
      message: `${uploadResults.length} of ${req.files.length} files uploaded successfully`,
      data: {
        uploadedFiles: uploadResults,
        failedFiles: errors,
        batchId: req.body.batchId || uploadResults[0]?.batchId,
        totalUploaded: uploadResults.length,
        totalFailed: errors.length,
        totalSize,
        uploadedAt: new Date()
      }
    });
  });

  /**
   * @desc    Upload file from external URL
   * @route   POST /api/upload/from-url
   * @access  Private
   */
  uploadFromURL = asyncHandler(async (req, res) => {
    const { 
      url, 
      filename = null,
      category = 'documents',
      maxFileSize = 50 * 1024 * 1024 // 50MB default
    } = req.body;

    if (!url) {
      throw new AppError('URL is required', 400);
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      throw new AppError('Invalid URL format', 400);
    }

    try {
      // Download file with size limit
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        maxContentLength: maxFileSize,
        maxBodyLength: maxFileSize
      });

      // Get content type and size
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const contentLength = parseInt(response.headers['content-length'] || '0');

      if (contentLength > maxFileSize) {
        throw new AppError(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`, 400);
      }

      // Generate filename if not provided
      const urlParsed = new URL(url);
      const originalFilename = filename || path.basename(urlParsed.pathname) || `download-${Date.now()}`;
      const fileExtension = path.extname(originalFilename) || this.getExtensionFromMimeType(contentType);
      
      const uniqueFilename = `${req.user.userId}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const relativePath = `uploads/${category}/${uniqueFilename}`;
      const fullPath = path.join(process.cwd(), relativePath);

      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(fullPath));

      // Download and save file
      const writeStream = require('fs').createWriteStream(fullPath);
      response.data.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        response.data.on('error', reject);
      });

      // Get actual file size
      const stats = await fs.stat(fullPath);
      const actualSize = stats.size;

      // Create file metadata
      const fileMetadata = {
        _id: new mongoose.Types.ObjectId(),
        originalName: originalFilename,
        filename: uniqueFilename,
        path: relativePath,
        url: `/uploads/${category}/${uniqueFilename}`,
        mimeType: contentType,
        size: actualSize,
        uploadedBy: req.user.userId,
        uploadedAt: new Date(),
        category,
        source: 'url',
        sourceUrl: url,
        metadata: {
          downloadedFrom: url,
          originalContentLength: contentLength,
          actualSize: actualSize
        }
      };

      // Validate downloaded file
      await this.validateFile({
        mimetype: contentType,
        size: actualSize,
        originalname: originalFilename
      }, 'general', maxFileSize);

      // Process file if it's an image
      if (contentType.startsWith('image/')) {
        const processingResults = await this.processImageFile(fullPath, fileMetadata, true);
        fileMetadata.metadata = { ...fileMetadata.metadata, ...processingResults };
      }

      // Save file record
      await this.saveFileRecord(fileMetadata);

      // Update user storage usage
      await this.updateUserStorageUsage(req.user.userId, actualSize);

      res.status(201).json({
        success: true,
        message: 'File downloaded and uploaded successfully',
        data: {
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          mimeType: fileMetadata.mimeType,
          sourceUrl: url,
          uploadedAt: fileMetadata.uploadedAt,
          metadata: fileMetadata.metadata
        }
      });

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new AppError('Download timeout. File too large or connection too slow', 408);
      } else if (error.response && error.response.status === 404) {
        throw new AppError('File not found at the provided URL', 404);
      } else if (error.response && error.response.status >= 400) {
        throw new AppError(`Failed to download file: ${error.response.status}`, 400);
      }
      throw new AppError(`Failed to download file: ${error.message}`, 500);
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Profile & Avatar Management -------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Upload and process profile image
   * @route   POST /api/upload/profile-image
   * @access  Private
   */
  uploadProfileImage = asyncHandler(async (req, res) => {
    const { cropData = null, generateSizes = true } = req.body;

    // Validate image upload
    if (!req.file) {
      throw new AppError('No image uploaded', 400);
    }

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Only JPEG, PNG, GIF, and WebP images are allowed', 400);
    }

    // Validate image size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw new AppError('Image size must be less than 10MB', 400);
    }

    // Generate filenames for different sizes
    const timestamp = Date.now();
    const baseFilename = `profile-${req.user.userId}-${timestamp}`;
    const relativePath = 'uploads/profiles';
    const fullBasePath = path.join(process.cwd(), relativePath);

    // Ensure directory exists
    await this.ensureDirectoryExists(fullBasePath);

    // Process and save different sizes
    const profileImages = {};
    const imageSizes = {
      thumbnail: { width: 64, height: 64 },
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    try {
      // Load image with sharp
      let imageProcessor = sharp(req.file.path);
      
      // Get original image metadata
      const metadata = await imageProcessor.metadata();
      
      // Apply crop if provided
      if (cropData) {
        const { x, y, width, height } = JSON.parse(cropData);
        imageProcessor = imageProcessor.extract({
          left: Math.round(x),
          top: Math.round(y),
          width: Math.round(width),
          height: Math.round(height)
        });
      }

      // Generate different sizes
      for (const [sizeName, dimensions] of Object.entries(imageSizes)) {
        const filename = `${baseFilename}-${sizeName}.webp`;
        const filePath = path.join(fullBasePath, filename);
        
        await imageProcessor
          .clone()
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: sizeName === 'thumbnail' ? 70 : 85 })
          .toFile(filePath);

        profileImages[sizeName] = {
          filename,
          url: `/uploads/profiles/${filename}`,
          width: dimensions.width,
          height: dimensions.height,
          size: (await fs.stat(filePath)).size
        };
      }

      // Create file metadata
      const fileMetadata = {
        _id: new mongoose.Types.ObjectId(),
        originalName: req.file.originalname,
        filename: `${baseFilename}-medium.webp`, // Default to medium
        path: `${relativePath}/${baseFilename}-medium.webp`,
        url: profileImages.medium.url,
        mimeType: 'image/webp',
        size: profileImages.medium.size,
        uploadedBy: req.user.userId,
        uploadedAt: new Date(),
        category: 'profiles',
        fileType: 'profile-image',
        metadata: {
          originalDimensions: {
            width: metadata.width,
            height: metadata.height
          },
          sizes: profileImages,
          cropApplied: !!cropData,
          cropData: cropData ? JSON.parse(cropData) : null
        }
      };

      // Save file record
      await this.saveFileRecord(fileMetadata);

      // Update user profile image
      await User.findByIdAndUpdate(req.user.userId, {
        profileImage: profileImages.medium.url,
        $push: {
          profileImageHistory: {
            fileId: fileMetadata._id,
            url: profileImages.medium.url,
            uploadedAt: new Date()
          }
        }
      });

      // Calculate total size for storage tracking
      const totalSize = Object.values(profileImages).reduce((sum, img) => sum + img.size, 0);
      await this.updateUserStorageUsage(req.user.userId, totalSize);

      // Cleanup original uploaded file
      await fs.unlink(req.file.path);

      res.status(201).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          images: profileImages,
          defaultUrl: profileImages.medium.url,
          uploadedAt: fileMetadata.uploadedAt,
          totalSize,
          metadata: fileMetadata.metadata
        }
      });

    } catch (error) {
      // Cleanup on error
      await this.cleanupFiles([req.file.path]);
      throw new AppError(`Image processing failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Crop existing profile image
   * @route   POST /api/upload/crop-profile-image
   * @access  Private
   */
  cropProfileImage = asyncHandler(async (req, res) => {
    const { fileId, cropData } = req.body;

    if (!fileId || !cropData) {
      throw new AppError('File ID and crop data are required', 400);
    }

    // Get existing file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file
    if (fileRecord.uploadedBy.toString() !== req.user.userId) {
      throw new AppError('Not authorized to crop this image', 403);
    }

    // Validate it's an image
    if (!fileRecord.mimeType.startsWith('image/')) {
      throw new AppError('File is not an image', 400);
    }

    const { x, y, width, height } = cropData;
    const timestamp = Date.now();
    const baseFilename = `profile-${req.user.userId}-${timestamp}-cropped`;
    const relativePath = 'uploads/profiles';
    const fullBasePath = path.join(process.cwd(), relativePath);

    // Process cropped image
    const imageSizes = {
      thumbnail: { width: 64, height: 64 },
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    const profileImages = {};
    const originalPath = path.join(process.cwd(), fileRecord.path);

    try {
      // Load and crop original image
      let imageProcessor = sharp(originalPath)
        .extract({
          left: Math.round(x),
          top: Math.round(y),
          width: Math.round(width),
          height: Math.round(height)
        });

      // Generate different sizes
      for (const [sizeName, dimensions] of Object.entries(imageSizes)) {
        const filename = `${baseFilename}-${sizeName}.webp`;
        const filePath = path.join(fullBasePath, filename);
        
        await imageProcessor
          .clone()
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: sizeName === 'thumbnail' ? 70 : 85 })
          .toFile(filePath);

        profileImages[sizeName] = {
          filename,
          url: `/uploads/profiles/${filename}`,
          width: dimensions.width,
          height: dimensions.height,
          size: (await fs.stat(filePath)).size
        };
      }

      // Create new file metadata for cropped version
      const croppedFileMetadata = {
        _id: new mongoose.Types.ObjectId(),
        originalName: `cropped-${fileRecord.originalName}`,
        filename: `${baseFilename}-medium.webp`,
        path: `${relativePath}/${baseFilename}-medium.webp`,
        url: profileImages.medium.url,
        mimeType: 'image/webp',
        size: profileImages.medium.size,
        uploadedBy: req.user.userId,
        uploadedAt: new Date(),
        category: 'profiles',
        fileType: 'profile-image-cropped',
        parentFileId: fileId,
        metadata: {
          cropData,
          sizes: profileImages,
          originalFileId: fileId
        }
      };

      // Save new file record
      await this.saveFileRecord(croppedFileMetadata);

      // Update user profile image
      await User.findByIdAndUpdate(req.user.userId, {
        profileImage: profileImages.medium.url
      });

      res.status(201).json({
        success: true,
        message: 'Image cropped successfully',
        data: {
          fileId: croppedFileMetadata._id,
          originalFileId: fileId,
          images: profileImages,
          defaultUrl: profileImages.medium.url,
          cropData,
          croppedAt: croppedFileMetadata.uploadedAt
        }
      });

    } catch (error) {
      throw new AppError(`Image cropping failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Generate thumbnails for existing images
   * @route   POST /api/upload/generate-thumbnails/:fileId
   * @access  Private
   */
  generateThumbnails = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { sizes = null } = req.body;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file or is admin
    if (fileRecord.uploadedBy.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to generate thumbnails for this file', 403);
    }

    // Validate it's an image
    if (!fileRecord.mimeType.startsWith('image/')) {
      throw new AppError('File is not an image', 400);
    }

    // Default thumbnail sizes
    const defaultSizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 }
    };

    const thumbnailSizes = sizes || defaultSizes;
    const originalPath = path.join(process.cwd(), fileRecord.path);
    const thumbnails = {};

    try {
      // Get original image info
      const imageInfo = await sharp(originalPath).metadata();
      
      // Generate thumbnails
      for (const [sizeName, dimensions] of Object.entries(thumbnailSizes)) {
        const filename = `thumb-${sizeName}-${fileRecord.filename}`;
        const relativePath = `uploads/thumbnails/${filename}`;
        const fullPath = path.join(process.cwd(), relativePath);

        // Ensure directory exists
        await this.ensureDirectoryExists(path.dirname(fullPath));

        await sharp(originalPath)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85 })
          .toFile(fullPath);

        const stats = await fs.stat(fullPath);
        thumbnails[sizeName] = {
          filename,
          url: `/uploads/thumbnails/${filename}`,
          width: dimensions.width,
          height: dimensions.height,
          size: stats.size,
          path: relativePath
        };
      }

      // Update file record with thumbnail info
      await this.updateFileRecord(fileId, {
        'metadata.thumbnails': thumbnails,
        'metadata.thumbnailsGenerated': true,
        'metadata.thumbnailsGeneratedAt': new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Thumbnails generated successfully',
        data: {
          fileId,
          originalImage: {
            url: fileRecord.url,
            width: imageInfo.width,
            height: imageInfo.height
          },
          thumbnails,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      throw new AppError(`Thumbnail generation failed: ${error.message}`, 500);
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Interview Media -------------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Upload interview video recording
   * @route   POST /api/upload/interview-video
   * @access  Private
   */
  uploadInterviewVideo = asyncHandler(async (req, res) => {
    const { 
      interviewId,
      videoType = 'interview-recording',
      generateThumbnail = true,
      processVideo = true
    } = req.body;

    // Validate video upload
    if (!req.file) {
      throw new AppError('No video file uploaded', 400);
    }

    // Validate video type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Only MP4, WebM, MOV, and AVI video files are allowed', 400);
    }

    // Validate interview if provided
    let interview = null;
    if (interviewId) {
      interview = await Interview.findById(interviewId);
      if (!interview) {
        throw new AppError('Interview not found', 404);
      }

      // Check if user is authorized for this interview
      const isAuthorized = 
        interview.candidateId.toString() === req.user.userId ||
        interview.recruiterId.toString() === req.user.userId ||
        req.user.role === 'Admin';

      if (!isAuthorized) {
        throw new AppError('Not authorized for this interview', 403);
      }
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `interview-video-${interviewId || 'general'}-${req.user.userId}-${Date.now()}${fileExtension}`;
    const relativePath = `uploads/interview-videos/${uniqueFilename}`;
    const fullPath = path.join(process.cwd(), relativePath);

    // Ensure directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));

    // Move file to final destination
    await fs.rename(req.file.path, fullPath);

    // Create file metadata
    const fileMetadata = {
      _id: new mongoose.Types.ObjectId(),
      originalName: req.file.originalname,
      filename: uniqueFilename,
      path: relativePath,
      url: `/uploads/interview-videos/${uniqueFilename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      category: 'interview-videos',
      fileType: videoType,
      interviewId,
      metadata: {
        interviewData: interview ? {
          candidateId: interview.candidateId,
          recruiterId: interview.recruiterId,
          interviewDate: interview.interviewDate,
          status: interview.status
        } : null
      }
    };

    try {
      // Process video if requested
      let processingResults = {};
      if (processVideo) {
        processingResults = await this.processVideoFile(fullPath, fileMetadata, {
          generateThumbnail,
          extractMetadata: true,
          createPreview: true
        });
      }

      // Update metadata with processing results
      fileMetadata.metadata = { ...fileMetadata.metadata, ...processingResults };
      fileMetadata.isProcessed = true;

      // Save file record
      await this.saveFileRecord(fileMetadata);

      // Update interview with video reference
      if (interview) {
        await Interview.findByIdAndUpdate(interviewId, {
          $push: {
            recordings: {
              type: videoType,
              fileId: fileMetadata._id,
              url: fileMetadata.url,
              uploadedAt: new Date(),
              uploadedBy: req.user.userId
            }
          }
        });
      }

      // Update user storage usage
      await this.updateUserStorageUsage(req.user.userId, req.file.size);

      res.status(201).json({
        success: true,
        message: 'Interview video uploaded successfully',
        data: {
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          interviewId,
          videoType,
          uploadedAt: fileMetadata.uploadedAt,
          processing: processingResults,
          metadata: fileMetadata.metadata
        }
      });

    } catch (error) {
      // Cleanup on error
      await this.cleanupFiles([fullPath]);
      throw new AppError(`Video processing failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Upload screen recording
   * @route   POST /api/upload/screen-recording
   * @access  Private
   */
  uploadScreenRecording = asyncHandler(async (req, res) => {
    const { 
      interviewId,
      recordingType = 'screen-share',
      generatePreview = true
    } = req.body;

    // Validate video upload
    if (!req.file) {
      throw new AppError('No screen recording uploaded', 400);
    }

    // Validate video type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Only MP4, WebM, and MOV screen recordings are allowed', 400);
    }

    // Validate file size (max 500MB for screen recordings)
    const maxSize = 500 * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw new AppError('Screen recording size must be less than 500MB', 400);
    }

    // Generate unique filename
    const uniqueFilename = `screen-recording-${interviewId || 'session'}-${req.user.userId}-${Date.now()}.mp4`;
    const relativePath = `uploads/screen-recordings/${uniqueFilename}`;
    const fullPath = path.join(process.cwd(), relativePath);

    // Ensure directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));

    // Move file to final destination
    await fs.rename(req.file.path, fullPath);

    // Create file metadata
    const fileMetadata = {
      _id: new mongoose.Types.ObjectId(),
      originalName: req.file.originalname,
      filename: uniqueFilename,
      path: relativePath,
      url: `/uploads/screen-recordings/${uniqueFilename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      category: 'screen-recordings',
      fileType: recordingType,
      interviewId,
      metadata: {
        recordingSession: {
          startedAt: req.body.startedAt ? new Date(req.body.startedAt) : null,
          endedAt: req.body.endedAt ? new Date(req.body.endedAt) : null,
          duration: req.body.duration || null
        }
      }
    };

    try {
      // Process screen recording
      const processingResults = await this.processScreenRecording(fullPath, fileMetadata, {
        generatePreview,
        extractKeyframes: true,
        analyzeContent: true
      });

      // Update metadata
      fileMetadata.metadata = { ...fileMetadata.metadata, ...processingResults };
      fileMetadata.isProcessed = true;

      // Save file record
      await this.saveFileRecord(fileMetadata);

      // Update interview with screen recording reference
      if (interviewId) {
        const interview = await Interview.findById(interviewId);
        if (interview) {
          await Interview.findByIdAndUpdate(interviewId, {
            $push: {
              screenRecordings: {
                fileId: fileMetadata._id,
                url: fileMetadata.url,
                type: recordingType,
                uploadedAt: new Date(),
                duration: processingResults.duration || null
              }
            }
          });
        }
      }

      // Update user storage usage
      await this.updateUserStorageUsage(req.user.userId, req.file.size);

      res.status(201).json({
        success: true,
        message: 'Screen recording uploaded successfully',
        data: {
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          interviewId,
          recordingType,
          uploadedAt: fileMetadata.uploadedAt,
          processing: processingResults,
          metadata: fileMetadata.metadata
        }
      });

    } catch (error) {
      // Cleanup on error
      await this.cleanupFiles([fullPath]);
      throw new AppError(`Screen recording processing failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Upload audio recording
   * @route   POST /api/upload/audio-recording
   * @access  Private
   */
  uploadAudioRecording = asyncHandler(async (req, res) => {
    const { 
      interviewId,
      audioType = 'interview-audio',
      generateWaveform = true
    } = req.body;

    // Validate audio upload
    if (!req.file) {
      throw new AppError('No audio file uploaded', 400);
    }

    // Validate audio type
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Only MP3, WAV, OGG, WebM, and M4A audio files are allowed', 400);
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `interview-audio-${interviewId || 'general'}-${req.user.userId}-${Date.now()}${fileExtension}`;
    const relativePath = `uploads/interview-audio/${uniqueFilename}`;
    const fullPath = path.join(process.cwd(), relativePath);

    // Ensure directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));

    // Move file to final destination
    await fs.rename(req.file.path, fullPath);

    // Create file metadata
    const fileMetadata = {
      _id: new mongoose.Types.ObjectId(),
      originalName: req.file.originalname,
      filename: uniqueFilename,
      path: relativePath,
      url: `/uploads/interview-audio/${uniqueFilename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      category: 'interview-audio',
      fileType: audioType,
      interviewId,
      metadata: {}
    };

    try {
      // Process audio file
      const processingResults = await this.processAudioFile(fullPath, fileMetadata, {
        generateWaveform,
        extractMetadata: true,
        normalizeAudio: true
      });

      // Update metadata
      fileMetadata.metadata = { ...fileMetadata.metadata, ...processingResults };
      fileMetadata.isProcessed = true;

      // Save file record
      await this.saveFileRecord(fileMetadata);

      // Update interview with audio reference
      if (interviewId) {
        const interview = await Interview.findById(interviewId);
        if (interview) {
          await Interview.findByIdAndUpdate(interviewId, {
            $push: {
              audioRecordings: {
                fileId: fileMetadata._id,
                url: fileMetadata.url,
                type: audioType,
                uploadedAt: new Date(),
                duration: processingResults.duration || null
              }
            }
          });
        }
      }

      // Update user storage usage
      await this.updateUserStorageUsage(req.user.userId, req.file.size);

      res.status(201).json({
        success: true,
        message: 'Audio recording uploaded successfully',
        data: {
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          interviewId,
          audioType,
          uploadedAt: fileMetadata.uploadedAt,
          processing: processingResults,
          metadata: fileMetadata.metadata
        }
      });

    } catch (error) {
      // Cleanup on error
      await this.cleanupFiles([fullPath]);
      throw new AppError(`Audio processing failed: ${error.message}`, 500);
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Document Management ---------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Upload candidate resume
   * @route   POST /api/upload/resume
   * @access  Private
   */
  uploadResume = asyncHandler(async (req, res) => {
    const { 
      isPrimary = true,
      resumeVersion = '1.0',
      extractText = true
    } = req.body;

    // Validate resume upload
    if (!req.file) {
      throw new AppError('No resume file uploaded', 400);
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Only PDF, DOC, and DOCX files are allowed for resumes', 400);
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024;
    if (req.file.size > maxSize) {
      throw new AppError('Resume file size must be less than 25MB', 400);
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `resume-${req.user.userId}-${Date.now()}-v${resumeVersion}${fileExtension}`;
    const relativePath = `uploads/resumes/${uniqueFilename}`;
    const fullPath = path.join(process.cwd(), relativePath);

    // Ensure directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));

    // Move file to final destination
    await fs.rename(req.file.path, fullPath);

    // Create file metadata
    const fileMetadata = {
      _id: new mongoose.Types.ObjectId(),
      originalName: req.file.originalname,
      filename: uniqueFilename,
      path: relativePath,
      url: `/uploads/resumes/${uniqueFilename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      category: 'resumes',
      fileType: 'resume',
      metadata: {
        version: resumeVersion,
        isPrimary,
        extractedText: null,
        pageCount: null,
        wordCount: null
      }
    };

    try {
      // Process resume file
      let processingResults = {};
      
      if (extractText) {
        processingResults = await this.processResumeFile(fullPath, fileMetadata);
      }

      // Update metadata
      fileMetadata.metadata = { ...fileMetadata.metadata, ...processingResults };
      fileMetadata.isProcessed = true;

      // Save file record
      await this.saveFileRecord(fileMetadata);

      // Update user's resume information
      const updateData = {
        $push: {
          resumes: {
            fileId: fileMetadata._id,
            filename: fileMetadata.filename,
            url: fileMetadata.url,
            version: resumeVersion,
            isPrimary,
            uploadedAt: new Date()
          }
        }
      };

      // If this is the primary resume, update the main resume field
      if (isPrimary) {
        updateData.resume = fileMetadata.url;
        updateData.resumeFileId = fileMetadata._id;
      }

      await User.findByIdAndUpdate(req.user.userId, updateData);

      // Update user storage usage
      await this.updateUserStorageUsage(req.user.userId, req.file.size);

      res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully',
        data: {
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          version: resumeVersion,
          isPrimary,
          uploadedAt: fileMetadata.uploadedAt,
          processing: processingResults,
          metadata: fileMetadata.metadata
        }
      });

    } catch (error) {
      // Cleanup on error
      await this.cleanupFiles([fullPath]);
      throw new AppError(`Resume processing failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Upload portfolio files
   * @route   POST /api/upload/portfolio
   * @access  Private
   */
  uploadPortfolio = asyncHandler(async (req, res) => {
    const { 
      title = null,
      description = null,
      category = 'work-samples',
      tags = []
    } = req.body;

    // Validate files upload (can be multiple)
    if (!req.files || req.files.length === 0) {
      throw new AppError('No portfolio files uploaded', 400);
    }

    // Validate file types (images, documents, archives)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed'
    ];

    const portfolioFiles = [];
    let totalSize = 0;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError(`File type ${file.mimetype} not allowed in portfolio`, 400);
      }

      // Validate individual file size (max 50MB per file)
      const maxFileSize = 50 * 1024 * 1024;
      if (file.size > maxFileSize) {
        throw new AppError(`File ${file.originalname} is too large (max 50MB per file)`, 400);
      }

      totalSize += file.size;
    }

    // Validate total upload size (max 200MB per batch)
    const maxTotalSize = 200 * 1024 * 1024;
    if (totalSize > maxTotalSize) {
      throw new AppError('Total portfolio upload size exceeds 200MB limit', 400);
    }

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Generate unique filename
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `portfolio-${req.user.userId}-${Date.now()}-${i}${fileExtension}`;
        const relativePath = `uploads/portfolio/${uniqueFilename}`;
        const fullPath = path.join(process.cwd(), relativePath);

        // Ensure directory exists
        await this.ensureDirectoryExists(path.dirname(fullPath));

        // Move file to final destination
        await fs.rename(file.path, fullPath);

        // Create file metadata
        const fileMetadata = {
          _id: new mongoose.Types.ObjectId(),
          originalName: file.originalname,
          filename: uniqueFilename,
          path: relativePath,
          url: `/uploads/portfolio/${uniqueFilename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user.userId,
          uploadedAt: new Date(),
          category: 'portfolio',
          fileType: category,
          metadata: {
            title: title || file.originalname,
            description,
            tags: Array.isArray(tags) ? tags : [],
            portfolioOrder: i
          }
        };

        // Process file if it's an image
        if (file.mimetype.startsWith('image/')) {
          const imageProcessing = await this.processImageFile(fullPath, fileMetadata, true);
          fileMetadata.metadata = { ...fileMetadata.metadata, ...imageProcessing };
        }

        fileMetadata.isProcessed = true;

        // Save file record
        await this.saveFileRecord(fileMetadata);

        portfolioFiles.push({
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          mimeType: fileMetadata.mimeType,
          title: fileMetadata.metadata.title,
          order: i
        });

      } catch (error) {
        // Cleanup failed file
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to cleanup file:', unlinkError);
        }
        throw new AppError(`Failed to process file ${file.originalname}: ${error.message}`, 500);
      }
    }

    // Update user's portfolio information
    await User.findByIdAndUpdate(req.user.userId, {
      $push: {
        portfolio: {
          $each: portfolioFiles.map(file => ({
            fileId: file.fileId,
            title: file.title,
            url: file.url,
            category,
            uploadedAt: new Date()
          }))
        }
      }
    });

    // Update user storage usage
    await this.updateUserStorageUsage(req.user.userId, totalSize);

    res.status(201).json({
      success: true,
      message: `${portfolioFiles.length} portfolio files uploaded successfully`,
      data: {
        files: portfolioFiles,
        totalFiles: portfolioFiles.length,
        totalSize,
        category,
        title,
        description,
        tags,
        uploadedAt: new Date()
      }
    });
  });

  /**
   * @desc    Upload certificates
   * @route   POST /api/upload/certificates
   * @access  Private
   */
  uploadCertificates = asyncHandler(async (req, res) => {
    const { 
      certificateName,
      issuingOrganization,
      issueDate,
      expiryDate = null,
      credentialId = null
    } = req.body;

    // Validate certificate upload
    if (!req.file) {
      throw new AppError('No certificate file uploaded', 400);
    }

    // Validate required fields
    if (!certificateName || !issuingOrganization || !issueDate) {
      throw new AppError('Certificate name, issuing organization, and issue date are required', 400);
    }

    // Validate file type (PDF, images)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Only PDF, JPEG, and PNG files are allowed for certificates', 400);
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `certificate-${req.user.userId}-${Date.now()}${fileExtension}`;
    const relativePath = `uploads/certificates/${uniqueFilename}`;
    const fullPath = path.join(process.cwd(), relativePath);

    // Ensure directory exists
    await this.ensureDirectoryExists(path.dirname(fullPath));

    // Move file to final destination
    await fs.rename(req.file.path, fullPath);

    // Create file metadata
    const fileMetadata = {
      _id: new mongoose.Types.ObjectId(),
      originalName: req.file.originalname,
      filename: uniqueFilename,
      path: relativePath,
      url: `/uploads/certificates/${uniqueFilename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      category: 'certificates',
      fileType: 'certificate',
      metadata: {
        certificateName,
        issuingOrganization,
        issueDate: new Date(issueDate),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId,
        isExpired: expiryDate ? new Date(expiryDate) < new Date() : false
      }
    };

    try {
      // Process certificate file (extract text if PDF, generate thumbnail if image)
      let processingResults = {};
      
      if (req.file.mimetype === 'application/pdf') {
        processingResults = await this.processCertificatePDF(fullPath, fileMetadata);
      } else if (req.file.mimetype.startsWith('image/')) {
        processingResults = await this.processImageFile(fullPath, fileMetadata, true);
      }

      // Update metadata
      fileMetadata.metadata = { ...fileMetadata.metadata, ...processingResults };
      fileMetadata.isProcessed = true;

      // Save file record
      await this.saveFileRecord(fileMetadata);

      // Update user's certificates
      await User.findByIdAndUpdate(req.user.userId, {
        $push: {
          certificates: {
            fileId: fileMetadata._id,
            name: certificateName,
            issuingOrganization,
            issueDate: new Date(issueDate),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            credentialId,
            url: fileMetadata.url,
            uploadedAt: new Date(),
            isExpired: fileMetadata.metadata.isExpired
          }
        }
      });

      // Update user storage usage
      await this.updateUserStorageUsage(req.user.userId, req.file.size);

      res.status(201).json({
        success: true,
        message: 'Certificate uploaded successfully',
        data: {
          fileId: fileMetadata._id,
          originalName: fileMetadata.originalName,
          filename: fileMetadata.filename,
          url: fileMetadata.url,
          size: fileMetadata.size,
          certificateName,
          issuingOrganization,
          issueDate: fileMetadata.metadata.issueDate,
          expiryDate: fileMetadata.metadata.expiryDate,
          credentialId,
          isExpired: fileMetadata.metadata.isExpired,
          uploadedAt: fileMetadata.uploadedAt,
          processing: processingResults,
          metadata: fileMetadata.metadata
        }
      });

    } catch (error) {
      // Cleanup on error
      await this.cleanupFiles([fullPath]);
      throw new AppError(`Certificate processing failed: ${error.message}`, 500);
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- File Processing -------------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Process video file with compression and thumbnail generation
   * @route   POST /api/upload/process-video/:fileId
   * @access  Private
   */
  processVideoFile = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { 
      compress = true,
      generateThumbnail = true,
      generatePreview = false,
      quality = 'medium'
    } = req.body;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file or is admin
    if (fileRecord.uploadedBy.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to process this file', 403);
    }

    // Validate it's a video file
    if (!fileRecord.mimeType.startsWith('video/')) {
      throw new AppError('File is not a video', 400);
    }

    const originalPath = path.join(process.cwd(), fileRecord.path);
    const processingResults = {};

    try {
      // Generate video thumbnail
      if (generateThumbnail) {
        const thumbnailPath = `uploads/thumbnails/video-thumb-${fileId}.jpg`;
        const fullThumbnailPath = path.join(process.cwd(), thumbnailPath);
        
        await this.ensureDirectoryExists(path.dirname(fullThumbnailPath));

        await new Promise((resolve, reject) => {
          ffmpeg(originalPath)
            .screenshots({
              timestamps: ['10%'],
              filename: `video-thumb-${fileId}.jpg`,
              folder: path.join(process.cwd(), 'uploads/thumbnails'),
              size: '320x240'
            })
            .on('end', resolve)
            .on('error', reject);
        });

        processingResults.thumbnail = {
          url: `/uploads/thumbnails/video-thumb-${fileId}.jpg`,
          generated: true
        };
      }

      // Get video metadata
      const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(originalPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });

      processingResults.metadata = {
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitRate: metadata.format.bit_rate,
        streams: metadata.streams.length,
        resolution: metadata.streams[0] ? 
          `${metadata.streams[0].width}x${metadata.streams[0].height}` : 'unknown'
      };

      // Compress video if requested
      if (compress) {
        const compressedPath = `uploads/compressed/compressed-${fileRecord.filename}`;
        const fullCompressedPath = path.join(process.cwd(), compressedPath);
        
        await this.ensureDirectoryExists(path.dirname(fullCompressedPath));

        const qualitySettings = {
          low: { crf: 28, preset: 'fast' },
          medium: { crf: 23, preset: 'medium' },
          high: { crf: 18, preset: 'slow' }
        };

        const settings = qualitySettings[quality] || qualitySettings.medium;

        await new Promise((resolve, reject) => {
          ffmpeg(originalPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .addOptions([
              `-crf ${settings.crf}`,
              `-preset ${settings.preset}`
            ])
            .output(fullCompressedPath)
            .on('end', resolve)
            .on('error', reject);
        });

        const compressedStats = await fs.stat(fullCompressedPath);
        processingResults.compressed = {
          url: `/uploads/compressed/compressed-${fileRecord.filename}`,
          size: compressedStats.size,
          compressionRatio: ((fileRecord.size - compressedStats.size) / fileRecord.size * 100).toFixed(2)
        };
      }

      // Update file record with processing results
      await this.updateFileRecord(fileId, {
        'metadata.processing': processingResults,
        'metadata.processedAt': new Date(),
        isProcessed: true
      });

      res.status(200).json({
        success: true,
        message: 'Video processed successfully',
        data: {
          fileId,
          processing: processingResults,
          processedAt: new Date()
        }
      });

    } catch (error) {
      throw new AppError(`Video processing failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Process audio file with normalization and waveform generation
   * @route   POST /api/upload/process-audio/:fileId
   * @access  Private
   */
  processAudioFileEndpoint = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { 
      normalize = true,
      generateWaveform = true,
      enhanceQuality = false
    } = req.body;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file or is admin
    if (fileRecord.uploadedBy.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to process this file', 403);
    }

    // Validate it's an audio file
    if (!fileRecord.mimeType.startsWith('audio/')) {
      throw new AppError('File is not an audio file', 400);
    }

    const originalPath = path.join(process.cwd(), fileRecord.path);
    const processingResults = {};

    try {
      // Get audio metadata
      const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(originalPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });

      processingResults.metadata = {
        duration: metadata.format.duration,
        bitRate: metadata.format.bit_rate,
        sampleRate: metadata.streams[0]?.sample_rate,
        channels: metadata.streams[0]?.channels
      };

      // Normalize audio if requested
      if (normalize) {
        const normalizedPath = `uploads/processed/normalized-${fileRecord.filename}`;
        const fullNormalizedPath = path.join(process.cwd(), normalizedPath);
        
        await this.ensureDirectoryExists(path.dirname(fullNormalizedPath));

        await new Promise((resolve, reject) => {
          ffmpeg(originalPath)
            .audioFilters('dynaudnorm')
            .output(fullNormalizedPath)
            .on('end', resolve)
            .on('error', reject);
        });

        processingResults.normalized = {
          url: `/uploads/processed/normalized-${fileRecord.filename}`,
          processed: true
        };
      }

      // Generate waveform data (mock implementation)
      if (generateWaveform) {
        processingResults.waveform = {
          generated: true,
          dataUrl: `/api/audio/waveform/${fileId}`,
          peaks: [] // Would contain actual waveform data
        };
      }

      // Update file record
      await this.updateFileRecord(fileId, {
        'metadata.processing': processingResults,
        'metadata.processedAt': new Date(),
        isProcessed: true
      });

      res.status(200).json({
        success: true,
        message: 'Audio processed successfully',
        data: {
          fileId,
          processing: processingResults,
          processedAt: new Date()
        }
      });

    } catch (error) {
      throw new AppError(`Audio processing failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Generate video thumbnail from timestamp
   * @route   POST /api/upload/video-thumbnail/:fileId
   * @access  Private
   */
  generateVideoThumbnail = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { timestamp = '10%', size = '320x240' } = req.body;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file or is admin
    if (fileRecord.uploadedBy.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to generate thumbnail for this file', 403);
    }

    // Validate it's a video file
    if (!fileRecord.mimeType.startsWith('video/')) {
      throw new AppError('File is not a video', 400);
    }

    const originalPath = path.join(process.cwd(), fileRecord.path);
    const thumbnailFilename = `video-thumb-${fileId}-${Date.now()}.jpg`;
    const thumbnailPath = `uploads/thumbnails/${thumbnailFilename}`;
    const fullThumbnailPath = path.join(process.cwd(), thumbnailPath);

    try {
      // Ensure directory exists
      await this.ensureDirectoryExists(path.dirname(fullThumbnailPath));

      // Generate thumbnail
      await new Promise((resolve, reject) => {
        ffmpeg(originalPath)
          .screenshots({
            timestamps: [timestamp],
            filename: thumbnailFilename,
            folder: path.join(process.cwd(), 'uploads/thumbnails'),
            size: size
          })
          .on('end', resolve)
          .on('error', reject);
      });

      const thumbnailStats = await fs.stat(fullThumbnailPath);
      const thumbnailData = {
        filename: thumbnailFilename,
        url: `/uploads/thumbnails/${thumbnailFilename}`,
        size: thumbnailStats.size,
        timestamp,
        dimensions: size,
        generatedAt: new Date()
      };

      // Update file record with thumbnail info
      await this.updateFileRecord(fileId, {
        'metadata.thumbnails': {
          ...fileRecord.metadata?.thumbnails,
          [timestamp]: thumbnailData
        }
      });

      res.status(201).json({
        success: true,
        message: 'Video thumbnail generated successfully',
        data: {
          fileId,
          thumbnail: thumbnailData
        }
      });

    } catch (error) {
      throw new AppError(`Thumbnail generation failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Extract video metadata
   * @route   GET /api/upload/video-metadata/:fileId
   * @access  Private
   */
  extractVideoMetadata = asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file or is admin
    if (fileRecord.uploadedBy.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to access this file', 403);
    }

    // Validate it's a video file
    if (!fileRecord.mimeType.startsWith('video/')) {
      throw new AppError('File is not a video', 400);
    }

    const originalPath = path.join(process.cwd(), fileRecord.path);

    try {
      // Extract metadata using ffprobe
      const metadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(originalPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

      const extractedMetadata = {
        fileInfo: {
          filename: fileRecord.filename,
          size: fileRecord.size,
          mimeType: fileRecord.mimeType,
          uploadedAt: fileRecord.uploadedAt
        },
        format: {
          formatName: metadata.format.format_name,
          formatLongName: metadata.format.format_long_name,
          duration: parseFloat(metadata.format.duration),
          bitRate: parseInt(metadata.format.bit_rate),
          size: parseInt(metadata.format.size)
        },
        video: videoStream ? {
          codec: videoStream.codec_name,
          profile: videoStream.profile,
          width: videoStream.width,
          height: videoStream.height,
          aspectRatio: videoStream.display_aspect_ratio,
          frameRate: eval(videoStream.r_frame_rate), // Convert fraction to decimal
          bitRate: parseInt(videoStream.bit_rate) || null,
          pixelFormat: videoStream.pix_fmt
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          sampleRate: parseInt(audioStream.sample_rate),
          channels: audioStream.channels,
          channelLayout: audioStream.channel_layout,
          bitRate: parseInt(audioStream.bit_rate) || null,
          duration: parseFloat(audioStream.duration)
        } : null,
        extractedAt: new Date()
      };

      // Update file record with extracted metadata
      await this.updateFileRecord(fileId, {
        'metadata.videoMetadata': extractedMetadata,
        'metadata.metadataExtracted': true,
        'metadata.metadataExtractedAt': new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Video metadata extracted successfully',
        data: {
          fileId,
          metadata: extractedMetadata
        }
      });

    } catch (error) {
      throw new AppError(`Metadata extraction failed: ${error.message}`, 500);
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- File Management -------------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Get file metadata and information
   * @route   GET /api/upload/:fileId/metadata
   * @access  Private
   */
  getFileMetadata = asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file or is admin or has access through interview
    const hasAccess = 
      fileRecord.uploadedBy.toString() === req.user.userId ||
      req.user.role === 'Admin' ||
      await this.checkFileAccessPermission(fileRecord, req.user);

    if (!hasAccess) {
      throw new AppError('Not authorized to access this file', 403);
    }

    // Get file stats
    const filePath = path.join(process.cwd(), fileRecord.path);
    let fileExists = false;
    let fileStats = null;

    try {
      fileStats = await fs.stat(filePath);
      fileExists = true;
    } catch (error) {
      fileExists = false;
    }

    const metadata = {
      fileId: fileRecord._id,
      originalName: fileRecord.originalName,
      filename: fileRecord.filename,
      url: fileRecord.url,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      category: fileRecord.category,
      fileType: fileRecord.fileType,
      uploadedBy: fileRecord.uploadedBy,
      uploadedAt: fileRecord.uploadedAt,
      isProcessed: fileRecord.isProcessed,
      fileExists,
      lastModified: fileStats ? fileStats.mtime : null,
      metadata: fileRecord.metadata || {},
      access: {
        canEdit: fileRecord.uploadedBy.toString() === req.user.userId || req.user.role === 'Admin',
        canDelete: fileRecord.uploadedBy.toString() === req.user.userId || req.user.role === 'Admin',
        canShare: true
      }
    };

    res.status(200).json({
      success: true,
      message: 'File metadata retrieved successfully',
      data: metadata
    });
  });

  /**
   * @desc    Delete file and cleanup
   * @route   DELETE /api/upload/:fileId
   * @access  Private
   */
  deleteFile = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { permanent = false } = req.body;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user owns the file or is admin
    if (fileRecord.uploadedBy.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to delete this file', 403);
    }

    const filePath = path.join(process.cwd(), fileRecord.path);

    try {
      if (permanent) {
        // Permanently delete file from filesystem
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn('File not found on filesystem:', filePath);
        }

        // Delete associated files (thumbnails, processed versions)
        if (fileRecord.metadata?.thumbnails) {
          for (const thumbnail of Object.values(fileRecord.metadata.thumbnails)) {
            try {
              if (thumbnail.path) {
                await fs.unlink(path.join(process.cwd(), thumbnail.path));
              }
            } catch (error) {
              console.warn('Thumbnail cleanup failed:', thumbnail.path);
            }
          }
        }

        // Remove from database
        await this.deleteFileRecord(fileId);

        // Update user storage usage
        await this.updateUserStorageUsage(fileRecord.uploadedBy, -fileRecord.size);

      } else {
        // Soft delete - mark as deleted but keep file
        await this.updateFileRecord(fileId, {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: req.user.userId
        });
      }

      res.status(200).json({
        success: true,
        message: permanent ? 'File permanently deleted' : 'File deleted successfully',
        data: {
          fileId,
          filename: fileRecord.filename,
          deleteType: permanent ? 'permanent' : 'soft',
          deletedAt: new Date(),
          deletedBy: req.user.userId
        }
      });

    } catch (error) {
      throw new AppError(`File deletion failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Get download URL for file
   * @route   GET /api/upload/:fileId/download
   * @access  Private
   */
  getFileUrl = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const { disposition = 'attachment', expires = '1h' } = req.query;

    // Get file record
    const fileRecord = await this.getFileRecord(fileId);
    if (!fileRecord) {
      throw new AppError('File not found', 404);
    }

    // Verify user has access
    const hasAccess = 
      fileRecord.uploadedBy.toString() === req.user.userId ||
      req.user.role === 'Admin' ||
      await this.checkFileAccessPermission(fileRecord, req.user);

    if (!hasAccess) {
      throw new AppError('Not authorized to access this file', 403);
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), fileRecord.path);
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new AppError('File not found on server', 404);
    }

    // Generate secure download URL (in real implementation, would use signed URLs)
    const downloadUrl = `${req.protocol}://${req.get('host')}${fileRecord.url}`;
    
    // Calculate expiration
    const expirationTime = new Date();
    if (expires.endsWith('h')) {
      expirationTime.setHours(expirationTime.getHours() + parseInt(expires));
    } else if (expires.endsWith('m')) {
      expirationTime.setMinutes(expirationTime.getMinutes() + parseInt(expires));
    } else {
      expirationTime.setHours(expirationTime.getHours() + 1); // Default 1 hour
    }

    res.status(200).json({
      success: true,
      message: 'Download URL generated successfully',
      data: {
        fileId,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        downloadUrl,
        disposition,
        expiresAt: expirationTime,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType
      }
    });
  });

  /**
   * @desc    Validate file type and properties
   * @route   POST /api/upload/validate
   * @access  Private
   */
  validateFileType = asyncHandler(async (req, res) => {
    const { 
      filename,
      mimeType,
      size,
      category = 'general',
      maxSize = null
    } = req.body;

    if (!filename || !mimeType || !size) {
      throw new AppError('Filename, MIME type, and size are required', 400);
    }

    try {
      // Validate file properties
      const mockFile = {
        originalname: filename,
        mimetype: mimeType,
        size: parseInt(size)
      };

      await this.validateFile(mockFile, category, maxSize);

      // Check allowed file types by category
      const allowedTypes = {
        'profiles': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        'resumes': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'certificates': ['application/pdf', 'image/jpeg', 'image/png'],
        'interview-videos': ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
        'interview-audio': ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a'],
        'portfolio': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        'documents': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']
      };

      const categoryTypes = allowedTypes[category];
      const isTypeAllowed = !categoryTypes || categoryTypes.includes(mimeType);

      const validation = {
        filename,
        mimeType,
        size: parseInt(size),
        category,
        isValid: isTypeAllowed,
        isTypeAllowed,
        isSizeValid: true, // Already validated in validateFile
        maxAllowedSize: maxSize || this.getMaxSizeForCategory(category),
        supportedTypes: categoryTypes || ['All types allowed'],
        recommendations: this.getFileRecommendations(mimeType, category)
      };

      if (!isTypeAllowed) {
        validation.error = `File type ${mimeType} not allowed for category ${category}`;
      }

      res.status(200).json({
        success: validation.isValid,
        message: validation.isValid ? 'File validation passed' : 'File validation failed',
        data: validation
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'File validation failed',
        data: {
          filename,
          mimeType,
          size: parseInt(size),
          category,
          isValid: false,
          error: error.message
        }
      });
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Storage Management ----------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Get user storage usage statistics
   * @route   GET /api/upload/storage-usage
   * @access  Private
   */
  getStorageUsage = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Get user's file records
    const userFiles = await this.getUserFiles(userId);
    
    // Calculate storage statistics
    const stats = {
      totalFiles: userFiles.length,
      totalSize: 0,
      sizeByCategory: {},
      sizeByFileType: {},
      filesByCategory: {},
      recentUploads: [],
      largestFiles: []
    };

    // Process each file
    userFiles.forEach(file => {
      stats.totalSize += file.size;
      
      // By category
      stats.sizeByCategory[file.category] = (stats.sizeByCategory[file.category] || 0) + file.size;
      stats.filesByCategory[file.category] = (stats.filesByCategory[file.category] || 0) + 1;
      
      // By file type
      const fileType = file.mimeType.split('/')[0]; // image, video, audio, application
      stats.sizeByFileType[fileType] = (stats.sizeByFileType[fileType] || 0) + file.size;
    });

    // Get recent uploads (last 10)
    stats.recentUploads = userFiles
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 10)
      .map(file => ({
        fileId: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        category: file.category,
        uploadedAt: file.uploadedAt,
        url: file.url
      }));

    // Get largest files (top 10)
    stats.largestFiles = userFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(file => ({
        fileId: file._id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.size,
        category: file.category,
        uploadedAt: file.uploadedAt,
        sizeFormatted: this.formatFileSize(file.size)
      }));

    // Calculate percentages
    Object.keys(stats.sizeByCategory).forEach(category => {
      stats.sizeByCategory[category] = {
        size: stats.sizeByCategory[category],
        percentage: ((stats.sizeByCategory[category] / stats.totalSize) * 100).toFixed(2),
        fileCount: stats.filesByCategory[category]
      };
    });

    // Get storage limits (would be from user plan/settings)
    const storageLimit = await this.getUserStorageLimit(userId);
    const usagePercentage = storageLimit > 0 ? ((stats.totalSize / storageLimit) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      message: 'Storage usage retrieved successfully',
      data: {
        user: {
          userId,
          name: req.user.name,
          email: req.user.email
        },
        storage: {
          totalSize: stats.totalSize,
          totalSizeFormatted: this.formatFileSize(stats.totalSize),
          totalFiles: stats.totalFiles,
          storageLimit,
          storageLimitFormatted: this.formatFileSize(storageLimit),
          usagePercentage: parseFloat(usagePercentage),
          remainingSpace: Math.max(0, storageLimit - stats.totalSize),
          remainingSpaceFormatted: this.formatFileSize(Math.max(0, storageLimit - stats.totalSize))
        },
        breakdown: {
          byCategory: stats.sizeByCategory,
          byFileType: stats.sizeByFileType
        },
        files: {
          recentUploads: stats.recentUploads,
          largestFiles: stats.largestFiles
        },
        generatedAt: new Date()
      }
    });
  });

  /**
   * @desc    Clean up temporary and expired files
   * @route   POST /api/upload/cleanup-temp
   * @access  Private (Admin only)
   */
  cleanupTempFiles = asyncHandler(async (req, res) => {
    // Only admins can run cleanup
    if (req.user.role !== 'Admin') {
      throw new AppError('Only administrators can run file cleanup', 403);
    }

    const { 
      olderThanDays = 7,
      includeOrphaned = true,
      dryRun = false
    } = req.body;

    const cleanupResults = {
      tempFiles: { checked: 0, removed: 0, sizeReclaimed: 0 },
      orphanedFiles: { checked: 0, removed: 0, sizeReclaimed: 0 },
      expiredFiles: { checked: 0, removed: 0, sizeReclaimed: 0 },
      errors: []
    };

    try {
      // Clean up temp files
      const tempDir = path.join(process.cwd(), 'uploads', 'temp');
      if (await this.directoryExists(tempDir)) {
        const tempFiles = await fs.readdir(tempDir);
        
        for (const filename of tempFiles) {
          const filePath = path.join(tempDir, filename);
          try {
            const stats = await fs.stat(filePath);
            const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
            
            cleanupResults.tempFiles.checked++;
            
            if (ageInDays > olderThanDays) {
              if (!dryRun) {
                await fs.unlink(filePath);
              }
              cleanupResults.tempFiles.removed++;
              cleanupResults.tempFiles.sizeReclaimed += stats.size;
            }
          } catch (error) {
            cleanupResults.errors.push(`Temp file ${filename}: ${error.message}`);
          }
        }
      }

      // Clean up orphaned files (files without database records)
      if (includeOrphaned) {
        const uploadDirs = ['uploads/profiles', 'uploads/resumes', 'uploads/portfolio', 'uploads/certificates'];
        
        for (const dir of uploadDirs) {
          const dirPath = path.join(process.cwd(), dir);
          if (await this.directoryExists(dirPath)) {
            const files = await fs.readdir(dirPath);
            
            for (const filename of files) {
              const filePath = path.join(dirPath, filename);
              try {
                const stats = await fs.stat(filePath);
                cleanupResults.orphanedFiles.checked++;
                
                // Check if file has database record
                const hasRecord = await this.fileHasRecord(filename);
                
                if (!hasRecord) {
                  if (!dryRun) {
                    await fs.unlink(filePath);
                  }
                  cleanupResults.orphanedFiles.removed++;
                  cleanupResults.orphanedFiles.sizeReclaimed += stats.size;
                }
              } catch (error) {
                cleanupResults.errors.push(`Orphaned file ${filename}: ${error.message}`);
              }
            }
          }
        }
      }

      // Clean up expired files (soft deleted files older than retention period)
      const expiredFiles = await this.getExpiredFiles(olderThanDays);
      for (const fileRecord of expiredFiles) {
        try {
          cleanupResults.expiredFiles.checked++;
          
          const filePath = path.join(process.cwd(), fileRecord.path);
          if (await this.fileExists(filePath)) {
            if (!dryRun) {
              await fs.unlink(filePath);
              await this.deleteFileRecord(fileRecord._id);
            }
            cleanupResults.expiredFiles.removed++;
            cleanupResults.expiredFiles.sizeReclaimed += fileRecord.size;
          }
        } catch (error) {
          cleanupResults.errors.push(`Expired file ${fileRecord.filename}: ${error.message}`);
        }
      }

      const totalSizeReclaimed = 
        cleanupResults.tempFiles.sizeReclaimed +
        cleanupResults.orphanedFiles.sizeReclaimed +
        cleanupResults.expiredFiles.sizeReclaimed;

      const totalFilesRemoved = 
        cleanupResults.tempFiles.removed +
        cleanupResults.orphanedFiles.removed +
        cleanupResults.expiredFiles.removed;

      res.status(200).json({
        success: true,
        message: dryRun ? 'Cleanup analysis completed (dry run)' : 'File cleanup completed successfully',
        data: {
          dryRun,
          summary: {
            totalFilesRemoved,
            totalSizeReclaimed,
            totalSizeReclaimedFormatted: this.formatFileSize(totalSizeReclaimed),
            errorCount: cleanupResults.errors.length
          },
          details: cleanupResults,
          completedAt: new Date()
        }
      });

    } catch (error) {
      throw new AppError(`File cleanup failed: ${error.message}`, 500);
    }
  });

  /**
   * @desc    Migrate files to cloud storage
   * @route   POST /api/upload/migrate-cloud
   * @access  Private (Admin only)
   */
  migrateToCloudStorage = asyncHandler(async (req, res) => {
    // Only admins can run migration
    if (req.user.role !== 'Admin') {
      throw new AppError('Only administrators can run cloud migration', 403);
    }

    const { 
      provider = 'aws-s3',
      batchSize = 10,
      includeCategories = ['all'],
      dryRun = false
    } = req.body;

    // Mock cloud migration implementation
    const migrationResults = {
      totalFiles: 0,
      migratedFiles: 0,
      failedFiles: 0,
      totalSizeMigrated: 0,
      errors: [],
      migrationId: crypto.randomUUID(),
      startedAt: new Date()
    };

    try {
      // Get files to migrate
      const filesToMigrate = await this.getFilesForMigration(includeCategories);
      migrationResults.totalFiles = filesToMigrate.length;

      // Process files in batches
      for (let i = 0; i < filesToMigrate.length; i += batchSize) {
        const batch = filesToMigrate.slice(i, i + batchSize);
        
        for (const fileRecord of batch) {
          try {
            if (!dryRun) {
              // Mock cloud upload
              const cloudUrl = `https://${provider}.example.com/uploads/${fileRecord.filename}`;
              
              // Update file record with cloud URL
              await this.updateFileRecord(fileRecord._id, {
                cloudUrl,
                migratedToCloud: true,
                migratedAt: new Date(),
                cloudProvider: provider
              });
            }
            
            migrationResults.migratedFiles++;
            migrationResults.totalSizeMigrated += fileRecord.size;
            
          } catch (error) {
            migrationResults.failedFiles++;
            migrationResults.errors.push({
              fileId: fileRecord._id,
              filename: fileRecord.filename,
              error: error.message
            });
          }
        }
      }

      res.status(200).json({
        success: true,
        message: dryRun ? 'Cloud migration analysis completed (dry run)' : 'Cloud migration completed successfully',
        data: {
          migrationId: migrationResults.migrationId,
          provider,
          dryRun,
          results: {
            totalFiles: migrationResults.totalFiles,
            migratedFiles: migrationResults.migratedFiles,
            failedFiles: migrationResults.failedFiles,
            successRate: ((migrationResults.migratedFiles / migrationResults.totalFiles) * 100).toFixed(2),
            totalSizeMigrated: migrationResults.totalSizeMigrated,
            totalSizeMigratedFormatted: this.formatFileSize(migrationResults.totalSizeMigrated)
          },
          errors: migrationResults.errors,
          startedAt: migrationResults.startedAt,
          completedAt: new Date()
        }
      });

    } catch (error) {
      throw new AppError(`Cloud migration failed: ${error.message}`, 500);
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Helper Methods --------------------------------------------------------
  // ===========================================================================================================================

  /**
   * Validate uploaded file
   */
  validateFile = async (file, fileType, maxSize = null) => {
    // Default max sizes by file type
    const defaultMaxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      video: 500 * 1024 * 1024, // 500MB
      audio: 100 * 1024 * 1024, // 100MB
      document: 25 * 1024 * 1024, // 25MB
      general: 50 * 1024 * 1024 // 50MB
    };

    const sizeLimit = maxSize || defaultMaxSizes[fileType] || defaultMaxSizes.general;

    if (file.size > sizeLimit) {
      throw new AppError(`File size exceeds limit of ${Math.round(sizeLimit / 1024 / 1024)}MB`, 400);
    }

    // Validate file name
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (sanitizedName !== file.originalname) {
      console.warn('File name was sanitized:', file.originalname, '->', sanitizedName);
    }

    return true;
  };

  /**
   * Ensure directory exists
   */
  ensureDirectoryExists = async (dirPath) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  };

  /**
   * Get file extension from mime type
   */
  getExtensionFromMimeType = (mimeType) => {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'application/pdf': '.pdf',
      'text/plain': '.txt'
    };
    return mimeToExt[mimeType] || '';
  };

  /**
   * Check if user has access to file through interview or other permissions
   */
  checkFileAccessPermission = async (fileRecord, user) => {
    // Check if file is linked to an interview the user has access to
    if (fileRecord.interviewId) {
      const interview = await Interview.findById(fileRecord.interviewId);
      if (interview) {
        return interview.candidateId.toString() === user.userId ||
               interview.recruiterId.toString() === user.userId ||
               user.role === 'Admin';
      }
    }
    
    // Check if file is in a shared portfolio or public category
    if (fileRecord.category === 'portfolio' && fileRecord.metadata?.isPublic) {
      return true;
    }
    
    return false;
  };

  /**
   * Get maximum allowed file size for category
   */
  getMaxSizeForCategory = (category) => {
    const maxSizes = {
      'profiles': 10 * 1024 * 1024,      // 10MB
      'resumes': 25 * 1024 * 1024,       // 25MB
      'certificates': 25 * 1024 * 1024,  // 25MB
      'interview-videos': 500 * 1024 * 1024, // 500MB
      'interview-audio': 100 * 1024 * 1024,  // 100MB
      'portfolio': 50 * 1024 * 1024,     // 50MB per file
      'documents': 25 * 1024 * 1024,     // 25MB
      'screen-recordings': 500 * 1024 * 1024, // 500MB
      'general': 50 * 1024 * 1024        // 50MB
    };
    
    return maxSizes[category] || maxSizes.general;
  };

  /**
   * Get file recommendations based on type and category
   */
  getFileRecommendations = (mimeType, category) => {
    const recommendations = [];
    
    if (mimeType.startsWith('image/')) {
      recommendations.push('Consider using WebP format for better compression');
      recommendations.push('Recommended resolution: up to 1920x1080 for web use');
      if (category === 'profiles') {
        recommendations.push('Square aspect ratio (1:1) works best for profile images');
      }
    } else if (mimeType.startsWith('video/')) {
      recommendations.push('MP4 format with H.264 codec is recommended');
      recommendations.push('Keep file size under 500MB for faster uploads');
      recommendations.push('1080p resolution is optimal for web streaming');
    } else if (mimeType.startsWith('audio/')) {
      recommendations.push('MP3 format provides good compression');
      recommendations.push('44.1kHz sample rate is standard');
      recommendations.push('128-320 kbps bitrate recommended');
    } else if (mimeType === 'application/pdf') {
      recommendations.push('Ensure text is searchable (not scanned images)');
      recommendations.push('Keep file size reasonable by optimizing images');
    }
    
    return recommendations;
  };

  /**
   * Format file size in human readable format
   */
  formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Check if directory exists
   */
  directoryExists = async (dirPath) => {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  };

  /**
   * Check if file exists
   */
  fileExists = async (filePath) => {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Database operations (would be replaced with actual database calls)
   */
  saveFileRecord = async (fileMetadata) => {
    // Would save to File collection
    console.log('Saving file record:', fileMetadata._id);
    return fileMetadata;
  };

  getFileRecord = async (fileId) => {
    // Would query File collection by ID
    // Mock return for demonstration
    console.log('Getting file record:', fileId);
    return {
      _id: fileId,
      filename: 'example.pdf',
      uploadedBy: '507f1f77bcf86cd799439011',
      mimeType: 'application/pdf',
      size: 1024000,
      path: 'uploads/documents/example.pdf',
      url: '/uploads/documents/example.pdf',
      category: 'documents',
      uploadedAt: new Date(),
      metadata: {}
    };
  };

  updateFileRecord = async (fileId, updateData) => {
    // Would update File collection
    console.log('Updating file record:', fileId, updateData);
    return true;
  };

  deleteFileRecord = async (fileId) => {
    // Would delete from File collection
    console.log('Deleting file record:', fileId);
    return true;
  };

  getUserFiles = async (userId) => {
    // Would query user's files from File collection
    console.log('Getting user files:', userId);
    return []; // Mock empty array
  };

  getUserStorageLimit = async (userId) => {
    // Would get user's storage limit from user plan/settings
    return 5 * 1024 * 1024 * 1024; // 5GB default
  };

  getExpiredFiles = async (olderThanDays) => {
    // Would query soft-deleted files older than specified days
    return []; // Mock empty array
  };

  fileHasRecord = async (filename) => {
    // Would check if filename exists in File collection
    return false; // Mock - assume orphaned
  };

  getFilesForMigration = async (includeCategories) => {
    // Would query files that need cloud migration
    return []; // Mock empty array
  };

  updateUserStorageUsage = async (userId, sizeChange) => {
    // Would update user's storage usage statistics
    console.log('Updating storage usage for user:', userId, 'change:', sizeChange);
    return true;
  };

  cleanupFiles = async (filePaths) => {
    // Clean up temporary files
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error('Failed to cleanup file:', filePath, error.message);
      }
    }
  };

  /**
   * File processing methods (would implement actual processing with ffmpeg, sharp, etc.)
   */
  processImageFile = async (filePath, metadata, generateThumbnail = false) => {
    // Mock image processing with sharp
    return {
      processed: true,
      dimensions: { width: 1920, height: 1080 },
      thumbnailGenerated: generateThumbnail,
      thumbnails: generateThumbnail ? {
        small: { width: 150, height: 150, url: '/thumbnails/small.jpg' },
        medium: { width: 300, height: 300, url: '/thumbnails/medium.jpg' }
      } : null
    };
  };

  processVideoFile = async (filePath, metadata, options = {}) => {
    // Mock video processing with ffmpeg
    return {
      processed: true,
      duration: 300, // 5 minutes
      resolution: '1920x1080',
      bitrate: '2500k',
      thumbnailGenerated: options.generateThumbnail || false,
      thumbnailUrl: options.generateThumbnail ? '/thumbnails/video-thumb.jpg' : null
    };
  };

  processAudioFile = async (filePath, metadata, options = {}) => {
    // Mock audio processing with ffmpeg
    return {
      processed: true,
      duration: 180, // 3 minutes
      sampleRate: 44100,
      bitrate: '192k',
      channels: 2,
      waveformGenerated: options.generateWaveform || false
    };
  };

  processScreenRecording = async (filePath, metadata, options = {}) => {
    // Mock screen recording processing
    return {
      processed: true,
      duration: 1200, // 20 minutes
      resolution: '1920x1080',
      frameRate: 30,
      keyframesExtracted: options.extractKeyframes || false
    };
  };

  processResumeFile = async (filePath, metadata) => {
    // Mock resume text extraction (would use pdf-parse, mammoth, etc.)
    return {
      textExtracted: true,
      extractedText: 'Sample resume content...',
      pageCount: 2,
      wordCount: 500,
      sections: ['Contact', 'Experience', 'Education', 'Skills']
    };
  };

  processCertificatePDF = async (filePath, metadata) => {
    // Mock certificate processing
    return {
      textExtracted: true,
      extractedText: 'Certificate content...',
      issuerDetected: true,
      expirationDetected: false,
      verified: false // Would implement actual verification
    };
  };
}

module.exports = new UploadController();