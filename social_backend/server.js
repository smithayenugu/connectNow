const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const UserModel = require('./models/User');
const registerRouter = require('./router/register');
const loginRouter = require('./router/login');
const googleAuthRouter = require('./router/googleAuth');
const ConnectionRequest = require('./models/ConnectionRequest');


const app = express();
app.use(bodyParser.json());

// CORS must come BEFORE all routes
app.use(cors({
  origin: ['http://localhost:3000', 'https://connect-now-bice.vercel.app'],
  credentials: true
}));

// --- Chat Model ---
const chatSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  replyPost: {
    postId: String,
    title: String,
    content: String,
    file: String,
    authorName: String
  },
  timestamp: { type: Date, default: Date.now },
  edited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  seenBy: { type: [String], default: [] }
});
const ChatMessage = mongoose.model('ChatMessage', chatSchema);

// --- Chat Endpoints ---
// Get all unique conversations for a user (list of other users they've chatted with)
app.get('/api/chat/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('GET /api/chat/conversations', { userId });
    // Find all messages where this user is either sender or receiver
    const allMessages = await ChatMessage.find({
      $or: [
        { from: { $eq: userId } },
        { to: { $eq: userId } }
      ]
    }).sort({ timestamp: -1 });

    console.log(`Found ${allMessages.length} total messages for user ${userId}`);

    // Build unique conversation partners with last message and unread count
    const partnerMap = {};
    allMessages.forEach(msg => {
      const partnerId = msg.from === userId ? msg.to : msg.from;
      if (!partnerMap[partnerId]) {
        partnerMap[partnerId] = {
          partnerId,
          lastMessage: msg.isDeleted ? 'Message deleted' : msg.text,
          lastTimestamp: msg.timestamp
        };
      }
    });

    // Count unread messages for each conversation (messages from partner not seen by current user)
    const unreadCounts = {};
    // We need all messages per partner to count unread
    const partnerIds = Object.keys(partnerMap);
    for (const partnerId of partnerIds) {
      const msgs = await ChatMessage.find({
        from: partnerId,
        to: userId,
        isDeleted: { $ne: true }
      });
      // Unread = messages where userId is not in seenBy
      const unread = msgs.filter(m => !m.seenBy || !m.seenBy.includes(userId)).length;
      unreadCounts[partnerId] = unread;
    }

    // Fetch names for all partners
    const users = await UserModel.find(
      { userId: { $in: partnerIds } },
      { userId: 1, name: 1, profilePicture: 1 }
    );
    const userMap = {};
    users.forEach(u => {
      userMap[u.userId] = { name: u.name, profilePicture: u.profilePicture };
    });

    const conversations = partnerIds.map(id => ({
      ...partnerMap[id],
      partnerName: userMap[id]?.name || 'Unknown',
      partnerProfilePicture: userMap[id]?.profilePicture,
      unreadCount: unreadCounts[id] || 0
    }));

    // Sort by most recent message first
    conversations.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));

    console.log(`Found ${conversations.length} conversations for user ${userId}`);
    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Error fetching conversations', details: error.message });
  }
});

// Get messages between two users
app.get('/api/chat', async (req, res) => {
  const { user1, user2 } = req.query;
  console.log('GET /api/chat', { user1, user2 });
  if (!user1 || !user2) return res.json({ messages: [] });
  const messages = await ChatMessage.find({
    $or: [
      { $and: [ { from: { $eq: user1 } }, { to: { $eq: user2 } } ] },
      { $and: [ { from: { $eq: user2 } }, { to: { $eq: user1 } } ] }
    ]
  }).sort({ timestamp: 1 });
  // Lookup sender names for each message
  const userIds = [...new Set(messages.map(m => m.from))];
  const users = await UserModel.find({ userId: { $in: userIds } });
  const userMap = {};
  users.forEach(u => { userMap[u.userId] = { name: u.name, profilePicture: u.profilePicture }; });
  // Debug: log userIds and userMap
  console.log('Chat sender userIds:', userIds);
  console.log('UserMap:', userMap);
  const messagesWithNames = messages.map(m => ({
    ...m.toObject(),
    senderName: (userMap[m.from] && userMap[m.from].name) || 'Unknown',
    // add profile picture of the sender for per-message avatar rendering
    senderProfilePicture: m.from && userMap[m.from] ? userMap[m.from].profilePicture : undefined
  }));
  // Log which userIds are missing
  messagesWithNames.forEach(m => {
    if (m.senderName === 'Unknown') {
      console.log('Missing userId for message:', m.from, m.text);
    }
  });
  console.log(`Found ${messagesWithNames.length} messages between ${user1} and ${user2}`);
  res.json({ messages: messagesWithNames });
});

// Send a message
app.post('/api/chat', async (req, res) => {
  const { from, to, text, replyPost } = req.body;
  console.log('POST /api/chat', { from, to, text, replyPost });
  if (!from || !to || !text) return res.status(400).json({ error: 'Missing fields' });
  const msg = new ChatMessage({
    from,
    to,
    text,
    replyPost: replyPost && replyPost.postId ? replyPost : undefined
  });
  await msg.save();
  console.log('Saved chat message:', msg);
  res.json({ success: true });
});

// Edit a message (only the sender can edit)
app.put('/api/chat/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text, userId } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    if (message.from !== userId) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }
    if (message.isDeleted) {
      return res.status(400).json({ error: 'Cannot edit a deleted message' });
    }

    message.text = text.trim();
    message.edited = true;
    await message.save();
    
    console.log('Edited chat message:', message);
    res.json({ success: true, message });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Error editing message', details: error.message });
  }
});

// Delete a message (soft delete - only the sender can delete)
app.delete('/api/chat/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    if (message.from !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }
    if (message.isDeleted) {
      return res.status(400).json({ error: 'Message already deleted' });
    }

    message.isDeleted = true;
    message.text = 'This message was deleted';
    await message.save();
    
    console.log('Deleted chat message:', messageId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Error deleting message', details: error.message });
  }
});

// Mark messages as seen when user opens a conversation
app.post('/api/chat/seen', async (req, res) => {
  try {
    const { userId, partnerId } = req.body;
    if (!userId || !partnerId) {
      return res.status(400).json({ error: 'userId and partnerId are required' });
    }

    // Find all messages from partner to user that haven't been seen by user
    const result = await ChatMessage.updateMany(
      {
        from: partnerId,
        to: userId,
        seenBy: { $ne: userId }
      },
      {
        $addToSet: { seenBy: userId }
      }
    );

    console.log(`Marked ${result.modifiedCount} messages as seen for user ${userId} from ${partnerId}`);
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error marking messages as seen:', error);
    res.status(500).json({ error: 'Error marking messages as seen', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password for Gmail
    },
  });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('Missing MONGO_URI in environment. Add it to your .env or environment variables.');
  process.exit(1);
}

// Force Google DNS for SRV resolution if the system DNS is unreliable.
// This helps avoid ECONNREFUSED when resolving Atlas SRV records on Windows.
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('DNS servers forced to:', dns.getServers());
} catch (err) {
  console.warn('Failed to set DNS servers, continuing with system defaults:', err.message);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

const Post = require('./models/Post');

app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/auth/google', googleAuthRouter);

// Send a connection request
app.post('/api/connection-request', async (req, res) => {
  const { fromUserId, toUserId } = req.body;
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: 'fromUserId and toUserId are required' });
  }
  if (fromUserId === toUserId) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }
  // Prevent duplicate same-direction requests and avoid creating a request when the other side already has a pending request.
  const existingSameDirection = await ConnectionRequest.findOne({
    fromUserId,
    toUserId,
    status: { $in: ['pending', 'accepted'] }
  });
  if (existingSameDirection) {
    if (existingSameDirection.status === 'pending') {
      return res.status(409).json({ error: 'Request already sent' });
    } else if (existingSameDirection.status === 'accepted') {
      return res.status(409).json({ error: 'You are already following this user' });
    }
  }

  const oppositePending = await ConnectionRequest.findOne({
    fromUserId: toUserId,
    toUserId: fromUserId,
    status: 'pending'
  });
  if (oppositePending) {
    return res.status(409).json({ error: 'Request already pending from other user' });
  }
  const request = new ConnectionRequest({ fromUserId, toUserId });
  await request.save();
  res.status(201).json(request);
});

// Accept a connection request
app.post('/api/connection-request/:id/accept', async (req, res) => {
  const { id } = req.params;
  const request = await ConnectionRequest.findById(id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  request.status = 'accepted';
  await request.save();
  res.json(request);
});

// Reject a connection request
app.post('/api/connection-request/:id/reject', async (req, res) => {
  const { id } = req.params;
  const request = await ConnectionRequest.findById(id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  request.status = 'rejected';
  await request.save();
  res.json(request);
});

// Remove a connection (unfollow)
app.post('/api/connection-request/:otherUserId/remove', async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { userId } = req.body;

    console.log('Unfollow request:', { userId, otherUserId });

    // Check both directions: user followed otherUser OR otherUser followed user
    const request = await ConnectionRequest.findOneAndDelete({
      $or: [
        { fromUserId: userId, toUserId: otherUserId, status: 'accepted' },
        { fromUserId: otherUserId, toUserId: userId, status: 'accepted' }
      ]
    });

    console.log('Unfollow deleted:', request);

    if (!request) {
      return res.status(404).json({ error: 'Following relationship not found' });
    }
    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ error: 'Error removing connection', details: error.message });
  }
});

// Cancel a pending connection request (only the sender can cancel)
app.post('/api/connection-request/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const request = await ConnectionRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.fromUserId !== userId) return res.status(403).json({ error: 'You can only cancel your own requests' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be canceled' });
    await ConnectionRequest.findByIdAndDelete(id);
    res.json({ message: 'Request canceled successfully' });
  } catch (error) {
    console.error('Error canceling request:', error);
    res.status(500).json({ error: 'Error canceling request', details: error.message });
  }
});

// List received connection requests for a user
app.get('/api/connection-request/received/:userId', async (req, res) => {
  const { userId } = req.params;
  const requests = await ConnectionRequest.find({ toUserId: userId });
  res.json(requests);
});

// List sent connection requests for a user
app.get('/api/connection-request/sent/:userId', async (req, res) => {
  const { userId } = req.params;
  const requests = await ConnectionRequest.find({ fromUserId: userId });
  res.json(requests);
});

// Update user profile
app.put('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone } = req.body;
    const user = await UserModel.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error updating user', details: error.message });
  }
});

// Upload profile picture
app.post('/api/user/:userId/profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (req.file) {
      user.profilePicture = req.file.filename;
      await user.save();
      res.json({ profilePicture: req.file.filename });
    } else {
      res.status(400).json({ error: 'No file uploaded' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error uploading profile picture', details: error.message });
  }
});

// Update a post
app.put('/api/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (title) post.title = title;
    if (content) post.content = content;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error updating post', details: error.message });
  }
});

// Upload post picture
app.post('/api/posts/:postId/picture', upload.single('postPicture'), async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    if (req.file) {
      // Delete old file if exists
      if (post.file) {
        const oldFilePath = path.join(uploadsDir, post.file);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      post.file = req.file.filename;
      await post.save();
      res.json({ file: req.file.filename });
    } else {
      res.status(400).json({ error: 'No file uploaded' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error uploading post picture', details: error.message });
  }
});

// Get posts by a specific user
app.get('/api/posts/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.params.userId });
        res.json(await attachPostUserDetails(posts));
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function attachPostUserDetails(posts) {
    const postList = Array.isArray(posts) ? posts : [posts];
    const authorIds = postList.map(post => post.userId).filter(Boolean);
    const commentUserIds = postList.flatMap(post =>
        (post.comments || []).map(comment => comment.userId).filter(Boolean)
    );
    const userIds = [...new Set([...authorIds, ...commentUserIds])];

    const users = await UserModel.find(
      { userId: { $in: userIds } },
      { userId: 1, name: 1, profilePicture: 1 }
    );

    const userMap = {};
    users.forEach(u => {
      userMap[u.userId] = {
        name: u.name,
        profilePicture: u.profilePicture
      };
    });

    const enrichedPosts = postList.map(post => {
      const plainPost = post.toObject ? post.toObject() : post;
      const author = userMap[plainPost.userId] || {};

      return {
        ...plainPost,
        username: plainPost.username || author.name || 'Unknown',
        userProfilePicture: plainPost.userProfilePicture || author.profilePicture || null,
        savedBy: plainPost.savedBy || [],
        comments: (plainPost.comments || []).map(comment => {
          const plainComment = comment.toObject ? comment.toObject() : comment;
          const commenter = plainComment.userId ? userMap[plainComment.userId] : {};
          return {
            ...plainComment,
            username: plainComment.username || commenter.name || 'Unknown',
            userProfilePicture: plainComment.userProfilePicture || commenter.profilePicture || null
          };
        })
      };
    });

    return Array.isArray(posts) ? enrichedPosts : enrichedPosts[0];
}

// Get posts NOT by a specific user (others' posts)
app.get('/api/posts/others/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ userId: { $ne: req.params.userId } });
        res.json(await attachPostUserDetails(posts));
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(await attachPostUserDetails(posts));
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/posts', upload.single('file'), async (req, res) => {
    try {
        const { title, content, userId } = req.body;
        const file = req.file ? req.file.filename : undefined;

        if (!title || !content || !userId) {
            return res.status(400).json({ error: 'Title, content, and userId are required fields' });
        }

        const post = new Post({ title, content, file, userId });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/posts/like/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.body.userId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        if (!post.likedBy) post.likedBy = [];
        if (post.likedBy.includes(userId)) {
            return res.status(400).json({ error: 'Already liked' });
        }
        post.likedBy.push(userId);
        post.likes = post.likedBy.length;
        await post.save();
        res.json(await attachPostUserDetails(post));
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/posts/unlike/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.body.userId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        if (!post.likedBy) post.likedBy = [];
        post.likedBy = post.likedBy.filter(id => id !== userId);
        post.likes = post.likedBy.length;
        await post.save();
        res.json(await attachPostUserDetails(post));
    } catch (error) {
        console.error('Error unliking post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Save a post
app.post('/api/posts/save/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.body.userId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        if (!post.savedBy) post.savedBy = [];
        if (post.savedBy.includes(userId)) {
            return res.status(400).json({ error: 'Already saved' });
        }
        post.savedBy.push(userId);
        await post.save();
        res.json(await attachPostUserDetails(post));
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Unsave a post
app.post('/api/posts/unsave/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.body.userId;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }
        if (!post.savedBy) post.savedBy = [];
        post.savedBy = post.savedBy.filter(id => id !== userId);
        await post.save();
        res.json(await attachPostUserDetails(post));
    } catch (error) {
        console.error('Error unsaving post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get saved posts for a user
app.get('/api/posts/saved/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ savedBy: req.params.userId });
        res.json(await attachPostUserDetails(posts));
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/api/posts/comment/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { text, userId } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (!post.comments) {
            post.comments = [];
        }
        const user = userId ? await UserModel.findOne(
            { userId },
            { name: 1, profilePicture: 1 }
        ) : null;

        post.comments.push({
            text: text.trim(),
            userId,
            username: user?.name || 'Unknown',
            userProfilePicture: user?.profilePicture || null
        });
        await post.save();

        res.json(await attachPostUserDetails(post));
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/posts/comment/:postId/:commentId', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { text, userId } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (!userId || comment.userId !== userId) {
            return res.status(403).json({ error: 'You can only edit your own comments' });
        }

        comment.text = text.trim();
        await post.save();

        res.json(await attachPostUserDetails(post));
    } catch (error) {
        console.error('Error editing comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/api/posts/comment/:postId/:commentId', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { userId } = req.body;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (!userId || (comment.userId !== userId && post.userId !== userId)) {
            return res.status(403).json({ error: 'You can only delete your own comments or comments on your own posts' });
        }

        post.comments.pull({ _id: commentId });
        await post.save();

        res.json(await attachPostUserDetails(post));
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/search-users', async (req, res) => {
  const { username } = req.query;
  if (!username || !username.trim()) {
    return res.json({ users: [] });
  }
  try {
    const users = await UserModel.find(
      { name: { $regex: username, $options: 'i' } },
      { name: 1, email: 1, userId: 1 } // Return name, email, and userId for profile links
    ).limit(10);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ users: [], error: 'Error searching users' });
  }
});

// Forgot password - send reset link via email
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate a reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send email with reset link (no fallback)
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - ConnectNow',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset for your ConnectNow account.</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #4e54c8; color: #fff; text-decoration: none; border-radius: 8px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
    return res.json({ 
      message: 'Password reset link has been sent to your email. Please check your inbox (and spam folder).'
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Verify reset token
app.get('/api/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ valid: true, email: user.email });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Error verifying token' });
  }
});

// Reset password
app.post('/api/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password and clear reset fields
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now sign in.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

app.get('/user/:userId', async (req, res) => {
  try {
    const user = await UserModel.findOne(
      { userId: req.params.userId },
      { password: 0, __v: 0 }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Delete a post (only the post owner can delete)
app.delete('/api/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete uploaded media file if present
    if (post.file) {
      const filePath = path.join(uploadsDir, post.file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Post.findByIdAndDelete(postId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Error deleting post', details: error.message });
  }
});


