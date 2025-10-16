const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/interviewx', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateUserRole(email, newRole) {
  try {
    console.log(`Updating user ${email} to role ${newRole}...`);
    
    const user = await User.findOneAndUpdate(
      { email: email },
      { role: newRole },
      { new: true }
    );

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`User ${email} updated successfully:`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get email and role from command line arguments
const email = process.argv[2];
const role = process.argv[3] || 'Recruiter';

if (!email) {
  console.log('Usage: node update-user-role.js <email> [role]');
  console.log('Available roles: Admin, Recruiter, Candidate');
  console.log('Default role: Recruiter');
  process.exit(1);
}

if (!['Admin', 'Recruiter', 'Candidate'].includes(role)) {
  console.log('Invalid role. Available roles: Admin, Recruiter, Candidate');
  process.exit(1);
}

updateUserRole(email, role);