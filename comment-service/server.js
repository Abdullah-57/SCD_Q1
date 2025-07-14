const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Comment Schema
const commentSchema = new mongoose.Schema({
  blogId: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Comment = mongoose.model('Comment', commentSchema);

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

// Add Comment
app.post('/api/comments', authMiddleware, async (req, res) => {
  try {
    const { blogId, content } = req.body;

    // Verify if blog exists
    try {
      await axios.get(`http://localhost:3003/api/blogs/${blogId}`);
    } catch (error) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = new Comment({
      blogId,
      content,
      author: req.userId
    });

    await comment.save();
    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Comments for a Blog
app.get('/api/comments/:blogId', async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.blogId });
    
    // Get author details for each comment
    const commentsWithAuthor = await Promise.all(comments.map(async (comment) => {
      try {
        const response = await axios.get(`http://localhost:3002/api/profile/${comment.author}`);
        return {
          ...comment.toObject(),
          authorProfile: response.data
        };
      } catch (error) {
        return comment;
      }
    }));

    res.json(commentsWithAuthor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MongoDB connection
mongoose.connect(process.env.COMMENT_MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Comment service running on port ${PORT}`));