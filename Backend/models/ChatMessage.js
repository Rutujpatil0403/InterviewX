const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Interview',
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  messageText: {
    type: String,
    required: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system', 'code', 'image'],
  },
  fileURL: {
    type: String,
    default: null,
  },
  isEdited: {
    type: Boolean,
    required: true,
  },
  editedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  indexes: [
    { key: { interviewId: 1 } },
    { key: { senderId: 1 } },
    { key: { createdAt: 1 } },
  ],
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);