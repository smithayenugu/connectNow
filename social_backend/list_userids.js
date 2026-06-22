// Script to list all userIds in users and posts collections
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({}, { strict: false });
const postSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('mycollections', userSchema);
const Post = mongoose.model('Post', postSchema, 'posts');

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const users = await User.find({}, { userId: 1, name: 1 });
    const posts = await Post.find({}, { userId: 1, title: 1 });
    console.log('User IDs in users collection:');
    users.forEach(u => console.log(`userId: ${u.userId}, name: ${u.name}`));
    console.log('\nUser IDs in posts collection:');
    posts.forEach(p => console.log(`userId: ${p.userId}, post title: ${p.title}`));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
