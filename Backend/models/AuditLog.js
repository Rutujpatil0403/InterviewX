const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  tableName: {
    type: String,
    required: true,
  },
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  oldValues: {
    type: Object,
    default: null,
  },
  newValues: {
    type: Object,
    default: null,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  indexes: [
    { key: { userId: 1 } },
    { key: { action: 1 } },
    { key: { tableName: 1 } },
    { key: { createdAt: 1 } },
  ],
});

module.exports = mongoose.model('AuditLog', auditLogSchema);