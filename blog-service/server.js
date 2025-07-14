const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Blog Schema
const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Blog = mongoose.model('Blog', blogSchema);

// View Schema
const viewSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  views: { type: Number, default: 0 }
});

const View = mongoose.model('View', viewSchema);

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

// Create Blog
app.post('/api/blogs', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    const blog = new Blog({ title, content, author: req.userId });
    await blog.save();

    const blogView = new View({ blogId: blog._id });
    await blogView.save();

    res.status(201).json({ message: 'Blog created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find();
    // Get author details for each blog
    const blogsWithAuthor = await Promise.all(blogs.map(async (blog) => {
      try {
        const response = await axios.get(`http://localhost:3002/api/profile/${blog.author}`);
        return {
          ...blog.toObject(),
          authorProfile: response.data
        };
      } catch (error) {
        return blog;
      }
    }));
    res.json(blogsWithAuthor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment blog views
app.post('/api/blogs/view/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    let view = await View.findOne({ blogId });

    if (view) {
      view.views++;
      await view.save();
    } else {
      view = new View({ blogId, views: 1 });
      await view.save();
    }

    res.status(200).json({ message: 'View count incremented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blog views
app.get('/api/blogs/views/:blogId', async (req, res) => {
  try {
    const view = await View.findOne({ blogId: req.params.blogId });
    res.json({ views: view ? view.views : 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// MongoDB connection
mongoose.connect(process.env.BLOG_MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Blog service running on port ${PORT}`));