// Script to auto-fix post userIds by matching user email or name
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
    const users = await User.find({}, { userId: 1, name: 1, email: 1 });
    const userMap = {};
    users.forEach(u => { userMap[u.userId] = u; });

    // Find posts with userIds that do not match any user
    const posts = await Post.find();
    let fixed = 0;
    for (const post of posts) {
      if (!userMap[post.userId]) {
        // Try to match by email or name if available in post
        let matchedUser = null;
        if (post.email) {
          matchedUser = users.find(u => u.email === post.email);
        }
        if (!matchedUser && post.author) {
          matchedUser = users.find(u => u.name === post.author);
        }
        if (matchedUser) {
          await Post.updateOne({ _id: post._id }, { $set: { userId: matchedUser.userId } });
          console.log(`Fixed post ${post._id}: set userId to ${matchedUser.userId}`);
          fixed++;
        } else {
          console.log(`Could not auto-fix post ${post._id} (userId: ${post.userId})`);
        }
      }
    }
    console.log(`Auto-fix complete. Fixed ${fixed} posts.`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
