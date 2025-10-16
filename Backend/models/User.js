const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: /^.+@.+\..+$/,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Recruiter', 'Candidate', 'Admin'],
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: null,
  },
  department: {
    type: String,
    default: null,
  },
  company: {
    type: String,
    default: null,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
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
  
  // Notification Preferences
  notificationPreferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      email: {
        interviewReminders: true,
        evaluationAlerts: true,
        systemNotifications: true,
        weeklyDigest: false
      },
      push: {
        interviewReminders: true,
        evaluationAlerts: true,
        systemNotifications: false,
        instantMessages: true
      },
      categories: {
        interview: true,
        evaluation: true,
        system: true,
        general: true,
        security: true
      },
      frequency: {
        immediate: true,
        digest: false,
        weekly: false
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      }
    }
  },
  notificationPreferencesUpdated: {
    type: Date,
    default: null
  },
}, {
  indexes: [
    { key: { email: 1 }, unique: true },
    { key: { role: 1 } },
    { key: { isActive: 1 } },
  ],
});

// Static method to verify password and return user ID if valid
userSchema.statics.verifyPassword = async function(email, password) {
  try {
    const user = await this.findOne({ email, isActive: true });
    if (!user) {
      return null;
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user._id : null;
  } catch (error) {
    return null;
  }
};

// Static method to update last login
userSchema.statics.updateLastLogin = async function(userId) {
  try {
    await this.findByIdAndUpdate(userId, { 
      lastLogin: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
};

// Static method to update password
userSchema.statics.updatePassword = async function(userId, oldPassword, newPassword) {
  try {
    const user = await this.findById(userId);
    if (!user) {
      return false;
    }
    
    // Verify old password
    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isOldPasswordCorrect) {
      return false;
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await this.findByIdAndUpdate(userId, { 
      passwordHash: hashedNewPassword,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
};

// Static method to update user profile
userSchema.statics.updateProfile = async function(userId, updateData) {
  try {
    const user = await this.findByIdAndUpdate(
      userId, 
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    return user;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Static method to get all users with filters and pagination
userSchema.statics.getAll = async function(filters, page, limit) {
  try {
    const skip = (page - 1) * limit;
    const query = {};
    
    if (filters.role) query.role = filters.role;
    if (filters.department) query.department = filters.department;
    if (filters.company) query.company = filters.company;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const users = await this.find(query)
      .select('-passwordHash')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await this.countDocuments(query);
    
    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Static method to delete user
userSchema.statics.delete = async function(userId) {
  try {
    await this.findByIdAndDelete(userId);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Static method to get user statistics
userSchema.statics.getStatistics = async function() {
  try {
    const totalUsers = await this.countDocuments();
    const activeUsers = await this.countDocuments({ isActive: true });
    const inactiveUsers = await this.countDocuments({ isActive: false });
    
    const usersByRole = await this.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    const recentUsers = await this.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole,
      recentUsers
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);