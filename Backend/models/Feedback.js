const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Interview',
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  processRating: {
    type: Number,
    default: null,
    min: 1,
    max: 5,
  },
  recruiterRating: {
    type: Number,
    default: null,
    min: 1,
    max: 5,
  },
  platformRating: {
    type: Number,
    default: null,
    min: 1,
    max: 5,
  },
  comments: {
    type: String,
    default: null,
  },
  suggestions: {
    type: String,
    default: null,
  },
  wouldRecommend: {
    type: Boolean,
    default: null,
  },
  isAnonymous: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  indexes: [
    { key: { interviewId: 1 } },
    { key: { candidateId: 1 } },
    { key: { overallRating: 1 } },
  ],
});

module.exports = mongoose.model('Feedback', feedbackSchema);