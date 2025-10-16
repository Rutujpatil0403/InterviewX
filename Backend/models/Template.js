const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  questions: {
    type: Array,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
  },
  estimatedDuration: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  indexes: [
    { key: { category: 1 } },
    { key: { difficulty: 1 } },
    { key: { createdBy: 1 } },
    { key: { isActive: 1 } },
  ],
});

module.exports = mongoose.model('Template', templateSchema);
