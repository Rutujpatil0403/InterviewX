const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Interview',
  },
  messages: {
    type: Array,
    required: true,
  },
  messageType: {
    type: String,
    required: true,
    enum: ['question', 'answer', 'system', 'note'],
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'User',
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  indexes: [
    { key: { interviewId: 1 } },
    { key: { timestamp: 1 } },
  ],
});

module.exports = mongoose.model('Transcript', transcriptSchema);