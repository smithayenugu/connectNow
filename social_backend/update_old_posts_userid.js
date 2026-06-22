// Script to update old posts to add userId
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const userId = process.argv[2]; // Pass userId as a command-line argument

if (!userId) {
  console.error('Usage: node update_old_posts_userid.js <userId>');
  process.exit(1);
}

const postSchema = new mongoose.Schema({}, { strict: false });
const Post = mongoose.model('Post', postSchema, 'posts');

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const result = await Post.updateMany(
      { userId: { $exists: false } },
      { $set: { userId } }
    );
    console.log(`Updated ${result.modifiedCount} posts with userId: ${userId}`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
