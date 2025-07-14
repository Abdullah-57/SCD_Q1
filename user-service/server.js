const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// User Profile Schema
const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  bio: String,
  avatar: String
});

const Profile = mongoose.model('Profile', profileSchema);

// Auth Middleware
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const response = await axios.post('http://localhost:3001/api/auth/verify', {}, {
      headers: { authorization: authHeader }
    });
    
    if (response.data.valid) {
      req.userId = response.data.userId;
      next();
    } else {
      res.status(401).json({ message: 'Invalid token.' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Authentication service error.' });
  }
}

// Update Profile
app.post('/api/profile', authMiddleware, async (req, res) => {
  const { bio, avatar } = req.body;

  try {
    let profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      profile = new Profile({ userId: req.userId });
    }

    if (bio) profile.bio = bio;
    if (avatar) profile.avatar = avatar;

    await profile.save();
    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Profile
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MongoDB connection
mongoose.connect(process.env.USER_MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));