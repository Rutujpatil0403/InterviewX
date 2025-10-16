const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true,
  },
  settingValue: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    required: true,
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json'],
  },
  isEditable: {
    type: Boolean,
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: 'User',
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  indexes: [
    { key: { settingKey: 1 }, unique: true },
    { key: { category: 1 } },
  ],
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);