const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Interview',
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  overallScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  technicalScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  communicationScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  problemSolvingScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  feedback: {
    type: String,
    required: true,
  },
  strengths: {
    type: String,
    default: null,
  },
  weaknesses: {
    type: String,
    default: null,
  },
  recommendations: {
    type: String,
    default: null,
  },
  isPublished: {
    type: Boolean,
    required: true,
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
    { key: { interviewId: 1 } },
    { key: { evaluatedBy: 1 } },
    { key: { overallScore: 1 } },
  ],
});

module.exports = mongoose.model('Evaluation', evaluationSchema);