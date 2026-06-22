// Script to fix post userIds and ensure they match users in the database
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const postSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('mycollections', userSchema);
const Post = mongoose.model('Post', postSchema, 'posts');

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // Get all users
    const users = await User.find({}, { userId: 1, name: 1 });
    const userMap = {};
    users.forEach(u => { userMap[u.userId] = u.name; });

    // Find posts with userIds that do not match any user
    const posts = await Post.find();
    let fixed = 0;
    for (const post of posts) {
      if (!userMap[post.userId]) {
        // Try to find a user with a matching email or name (if you want to add logic here)
        // For now, just log the issue
        console.log(`Post ${post._id} has unknown userId: ${post.userId}`);
      }
    }
    console.log('Check complete. If you want to auto-fix, add logic to match users by email or name.');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
