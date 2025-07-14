# Microservices Blog Application

This project is a blog application built using a microservices architecture. It consists of multiple independent services that work together to provide a complete blogging platform.

## Services Architecture

1. **API Gateway** (Port 3000)
   - Entry point for all client requests
   - Routes requests to appropriate microservices
   - Handles request/response transformation

2. **Auth Service** (Port 3001)
   - Handles user authentication
   - User registration and login
   - JWT token generation and verification

3. **User Service** (Port 3002)
   - Manages user profiles
   - Profile updates and retrieval
   - User information management

4. **Blog Service** (Port 3003)
   - Blog post creation and management
   - View count tracking
   - Blog listing and retrieval

5. **Comment Service** (Port 3004)
   - Comment management for blog posts
   - Comment creation and retrieval
   - Links comments to blogs and users

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Install dependencies for each service:
   ```bash
   cd api-gateway && npm install
   cd ../auth-service && npm install
   cd ../user-service && npm install
   cd ../blog-service && npm install
   cd ../comment-service && npm install
   ```

4. Start MongoDB instances for each service

5. Start each service:
   ```bash
   # Terminal 1
   cd api-gateway && npm start

   # Terminal 2
   cd auth-service && npm start

   # Terminal 3
   cd user-service && npm start

   # Terminal 4
   cd blog-service && npm start

   # Terminal 5
   cd comment-service && npm start
   ```

## API Endpoints

### Auth Service
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login

### User Service
- GET `/api/profile` - Get user profile
- POST `/api/profile` - Update user profile

### Blog Service
- POST `/api/blogs` - Create new blog
- GET `/api/blogs` - Get all blogs
- POST `/api/blogs/view/:blogId` - Increment blog view count

### Comment Service
- POST `/api/comments` - Add comment to blog
- GET `/api/comments/:blogId` - Get comments for a blog

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Inter-Service Communication

Services communicate with each other using HTTP requests. The authentication service provides a token verification endpoint that other services use to validate user tokens.

## Database Structure

Each service has its own MongoDB database to ensure service independence:

- Auth Service DB: User authentication data
- User Service DB: User profile information
- Blog Service DB: Blog posts and view counts
- Comment Service DB: Blog comments