const mongoose = require('mongoose');

// ===========================================================================================================================
// =================================================== Notification Model ===================================================
// ===========================================================================================================================

const notificationSchema = new mongoose.Schema({
  // Core Fields
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Can be null for system notifications
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Classification - Enhanced enum values for better compatibility
  type: {
    type: String,
    enum: [
      'info', 'success', 'warning', 'error', 'system', 'email',
      // Legacy values for backward compatibility
      'interview_scheduled', 'interview_reminder', 'interview_cancelled', 
      'evaluation_ready', 'system_update'
    ],
    default: 'info',
    index: true
  },
  category: {
    type: String,
    enum: ['general', 'interview', 'evaluation', 'system', 'security', 'email', 'test'],
    default: 'general',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'medium', 'high', 'urgent'], // Added 'normal' and kept 'medium' for compatibility
    default: 'normal',
    index: true
  },
  
  // Status Tracking
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Optional Fields
  actionUrl: {
    type: String,
    trim: true,
    maxlength: 500
  },
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  
  // Legacy field for backward compatibility
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    refPath: 'type' // Dynamic reference based on type
  },
  
  // Metadata for extensibility
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Delivery Tracking
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  lastDeliveryAttempt: {
    type: Date,
    default: null
  },
  
  // Legacy field for backward compatibility
  sentAt: {
    type: Date,
    default: Date.now
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// ===========================================================================================================================
// ===================================================== Indexes ============================================================
// ===========================================================================================================================

// Compound indexes for efficient queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, priority: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Legacy indexes for backward compatibility
notificationSchema.index({ sentAt: 1 });

// ===========================================================================================================================
// ===================================================== Methods =============================================================
// ===========================================================================================================================

// Instance Methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.deliveryStatus = 'read';
  return this.save();
};

notificationSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

notificationSchema.methods.canBeDelivered = function() {
  return !this.isExpired() && this.deliveryAttempts < 3;
};

notificationSchema.methods.incrementDeliveryAttempt = function() {
  this.deliveryAttempts += 1;
  this.lastDeliveryAttempt = new Date();
  return this.save();
};

// ===========================================================================================================================
// ===================================================== Statics =============================================================
// ===========================================================================================================================

// Static Methods
notificationSchema.statics.getUnreadCount = function(userId, filters = {}) {
  const query = { 
    recipientId: userId, 
    isRead: false 
  };
  
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = filters.type;
  if (filters.priority) query.priority = filters.priority;
  
  return this.countDocuments(query);
};

notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    type,
    isRead,
    priority,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
  const query = { recipientId: userId };
  
  if (category) query.category = category;
  if (type) query.type = type;
  if (isRead !== undefined) query.isRead = isRead;
  if (priority) query.priority = priority;
  
  const skip = (page - 1) * limit;
  const sortConfig = {};
  sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(query)
    .populate('senderId', 'name email role')
    .sort(sortConfig)
    .skip(skip)
    .limit(limit)
    .lean();
};

notificationSchema.statics.markAllAsRead = function(userId, filters = {}) {
  const query = { 
    recipientId: userId, 
    isRead: false 
  };
  
  if (filters.category) query.category = filters.category;
  if (filters.type) query.type = filters.type;
  
  return this.updateMany(query, {
    isRead: true,
    readAt: new Date(),
    deliveryStatus: 'read'
  });
};

// ===========================================================================================================================
// ===================================================== Middleware ==========================================================
// ===========================================================================================================================

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  
  // Map legacy sentAt to createdAt if createdAt is not set
  if (!this.createdAt && this.sentAt) {
    this.createdAt = this.sentAt;
  }
  
  next();
});

// Pre-validate middleware
notificationSchema.pre('validate', function(next) {
  // Auto-set expiry for certain notification types
  if (!this.expiresAt) {
    if (this.type === 'system' && this.priority === 'urgent') {
      // System urgent notifications expire in 7 days
      this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    } else if (this.category === 'interview') {
      // Interview notifications expire in 30 days
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (this.category === 'test') {
      // Test notifications expire in 1 hour
      this.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    }
  }
  
  // Map legacy type values to new format
  const legacyTypeMapping = {
    'interview_scheduled': { type: 'info', category: 'interview' },
    'interview_reminder': { type: 'info', category: 'interview' },
    'interview_cancelled': { type: 'warning', category: 'interview' },
    'evaluation_ready': { type: 'success', category: 'evaluation' },
    'system_update': { type: 'system', category: 'system' }
  };
  
  if (legacyTypeMapping[this.type]) {
    const mapping = legacyTypeMapping[this.type];
    if (!this.category || this.category === 'general') {
      this.category = mapping.category;
    }
  }
  
  next();
});

// ===========================================================================================================================
// ===================================================== Virtual Fields ======================================================
// ===========================================================================================================================

// Virtual for time since creation
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for human-readable age
notificationSchema.virtual('ageHuman').get(function() {
  const ageMs = this.age;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  const ageHours = Math.floor(ageMinutes / 60);
  const ageDays = Math.floor(ageHours / 24);
  
  if (ageDays > 0) return `${ageDays} day${ageDays > 1 ? 's' : ''} ago`;
  if (ageHours > 0) return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  if (ageMinutes > 0) return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Ensure virtuals are included in JSON output
notificationSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.id;
    return ret;
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
