# ConnectNow – Full-Stack Social Media Platform

A production-grade social networking application with real-time messaging, user connections, and rich media support. Built with modern web technologies and deployed on scalable cloud infrastructure.

**Live Demo:** [https://connect-now-bice.vercel.app](https://connect-now-bice.vercel.app)  
**GitHub Repository:** [smithayenugu/connectNow](https://github.com/smithayenugu/connectNow)

---

## 🚀 Features

### Core Social Features
- **Posts & Media** – Create, edit, and delete posts with optional image uploads
- **Interactions** – Like, comment, and share posts with real-time engagement tracking
- **User Connections** – Follow/unfollow users, manage connection requests with accept/reject functionality
- **Direct Messaging** – Real-time one-on-one messaging with message history, edit, and delete capabilities
- **User Profiles** – Customizable profiles with profile pictures, post history, follower/following counts
- **Search** – Discover and connect with other users through user search

### User Experience
- **Saved Posts** – Bookmark posts for later viewing
- **Dark/Light Theme** – Toggle between dark and light modes
- **Responsive Design** – Fully responsive UI optimized for desktop and mobile
- **Authentication** – Email/password signup with Google OAuth integration for seamless login
- **Password Reset** – Email-based forgot password / reset password flow

### Currently Not Implemented
- Real-time push notifications (planned for future updates)

---

## 🛠 Tech Stack

### Frontend
- **React.js** – Component-based UI with hooks and state management
- **HTML5 & CSS3** – Semantic markup and modern styling
- **Responsive Design** – Mobile-first approach with media queries

### Backend
- **Node.js & Express.js** – RESTful API with proper request validation and error handling
- **Authentication** – JWT-based auth with Google OAuth integration
- **Password Security** – BCrypt hashing with password reset functionality

### Database & Infrastructure
- **MongoDB Atlas** – NoSQL document database with optimized indexing
- **Database Schema** – Properly normalized schemas for users, posts, comments, messages, and connections
- **Query Optimization** – Indexed queries for efficient data retrieval

### Deployment
- **Frontend:** Vercel (Next.js/React hosting with automatic deployments)
- **Backend:** Render (Node.js hosting with environment management)
- **Database:** MongoDB Atlas (cloud-hosted with connection pooling)
- **Media:** Cloudinary (cloud-hosted image storage)

---

## 📊 Architecture

### Database Schema Highlights
```
Users
├── Profile (picture, bio, follower/following counts)
├── Authentication (email, hashed password, OAuth credentials)
└── Metadata (created_at, updated_at)

Posts
├── Content (title, description, images)
├── Author (user reference)
├── Relationships (likes, comments, shares)
└── Timestamps

Comments
├── Post reference
├── Author reference
└── Nested replies support

Messages
├── Sender & Recipient references
├── Edit/Delete tracking
└── Conversation history

Connections
├── Following relationships
└── Connection request management
```

### API Design
- RESTful endpoints for all CRUD operations
- Proper HTTP status codes and error responses
- Input validation and sanitization
- User authorization checks for sensitive operations (edit/delete)

---

## 🎯 Key Technical Achievements

### 1. Real-Time Messaging
- Efficient message delivery with proper timestamps
- Edit and delete capabilities with audit trails
- Conversation history management

### 2. Cloud Media Storage Migration
- Migrated image uploads from local disk storage to Cloudinary, solving the data-loss problem caused by Render's ephemeral filesystem on free-tier deployments
- Updated both backend (Cloudinary SDK + multer-storage-cloudinary) and frontend (URL handling) to support persistent, CDN-backed image delivery

### 3. Database Schema & Relationships
- Complex document references between users, posts, and comments
- Optimized indexes for frequently queried fields (email, userId, postId)
- Proper handling of one-to-many and many-to-many relationships

### 4. User Authorization
- Role-based access control (users can only edit/delete their own posts and messages)
- Secure password handling with bcrypt
- OAuth integration for social login

### 5. Responsive Frontend
- Mobile-optimized layout that works seamlessly across all devices
- Theme persistence with local storage
- Smooth navigation with React Router

### 6. Search Functionality
- User search with case-insensitive matching
- Efficient database queries for discoverability

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/smithayenugu/connectNow.git
   cd connectNow
   ```

2. **Frontend Setup** (React on Vercel)
   ```bash
   cd social_frontend
   npm install
   npm start
   ```
   The app will run on `http://localhost:3000`

3. **Backend Setup** (Node.js/Express on Render)
   ```bash
   cd social_backend
   npm install
   ```

4. **Environment Variables** 
   Create a `.env` file in the `social_backend` folder:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/connectnow
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   EMAIL_USER=your_email_for_password_reset
   EMAIL_PASS=your_email_app_password
   ```

5. **Start the Backend**
   ```bash
   npm start
   ```
   The API will run on `http://localhost:5000`

6. Open your browser and navigate to `http://localhost:3000`

---

## 📱 How to Use

### Sign Up / Login
- Create an account with email and password, or use Google OAuth
- All passwords are securely hashed using bcrypt

### Creating Posts
1. Click **"Create"** in the sidebar
2. Add a title, description, and optional image
3. Click **"Create Post"** to publish

### Connecting with Users
1. Use **"Search users"** at the top to find other users
2. Visit their profile and **"Connect"** to send a follow request
3. Manage pending requests in **"Connection Requests"**

### Messaging
1. Navigate to **"Chat"** section
2. Click on a connection to open the conversation
3. Type and send messages in real-time
4. Edit or delete your own messages

### Saving Posts
- Click the **bookmark icon** on any post to save it
- View all saved posts in **"Saved Posts"** section

### Customize Your Profile
- Click **"Profile"** → **"Edit Profile"** to update your information
- Add a profile picture and bio

---

## 📁 Project Structure

```
connectNow/
├── screenshots/             # App screenshots for README
│   ├── login.png
│   ├── feed.png
│   ├── create-post.png
│   ├── messaging.png
│   ├── profile.png
|   ├── save-posts.png
|   ├── chat.png
|   ├── comments.png
|   ├── connections.png
|   ├── light-theme.png
|   └── connection-request.png
|   
│
├── social_frontend/         # React Frontend (Deployed on Vercel)
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page-level components
│   │   ├── styles/          # CSS files
│   │   └── App.js           # Main app component
│   └── package.json
│   
│
├── social_backend/          # Node.js/Express Backend (Deployed on Render)
│   ├── models/              # MongoDB schemas (User, Post, Message, etc.)
│   ├── router/              # API routes and endpoints
│   ├── scripts/             # Helper scripts and utilities
│   ├── server.js            # Express server entry point
│   ├── package.json
│   └── package-lock.json
│
└── README.md                # Main project README
```

---

## 🧪 Testing the App

**Test Account:**
- Email: `test@example.com`
- Password: `TestPassword123`

Or create your own account and start connecting with other users!

---

## 🔒 Security Features

✅ **Password Security** – Bcrypt hashing with salt rounds  
✅ **Authentication** – JWT tokens with expiration  
✅ **Authorization** – User-specific access control  
✅ **Input Validation** – Server-side validation of all inputs  
✅ **OAuth Integration** – Secure Google login  
✅ **Password Reset** – Secure email-based password recovery  
✅ **CORS Configuration** – Restricted to known frontend origins only

---

## 🚦 Performance Optimizations

- **Database Indexing** – Optimized queries for posts, users, and messages
- **Pagination** – Infinite scroll for posts to reduce load
- **Image Optimization** – Efficient image storage and retrieval
- **Lazy Loading** – Load posts and messages on demand

---

## 📈 Future Enhancements

- [ ] Push notifications for messages and post interactions
- [ ] Video/audio calling integration
- [ ] Post analytics and engagement insights
- [ ] Hashtag and mention support
- [ ] Post collections and curated feeds
- [ ] User verification badges
- [ ] Advanced privacy controls

---



## 💬 Questions?

For questions or feedback, feel free to reach out:
- **Email:** smithayenugu@gmail.com
- **LinkedIn:** [Smitha Yenugu](https://linkedin.com/in/smitha-yenugu)
- **GitHub:** [@smithayenugu](https://github.com/smithayenugu)

---

**Built with ❤️ by Smitha Yenugu**
