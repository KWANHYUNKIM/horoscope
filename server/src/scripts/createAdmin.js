require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  await connectDB();
  const adminUsername = 'admin';
  const adminPassword = '1234'; // 실제 서비스에서는 더 안전한 비밀번호 사용

  try {
    let admin = await User.findOne({ username: adminUsername });
    if (!admin) {
      admin = new User({
        username: adminUsername,
        password: adminPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.disconnect();
  }
};

createAdmin();
