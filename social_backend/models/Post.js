const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    file: String,
    userId: String,
    likes: { type: Number, default: 0 },
    likedBy: [{ type: String }], // userId strings
    savedBy: [{ type: String }], // userId strings who saved this post
    comments: {
        type: [{
            text: String,
            userId: String,
            username: String,
            userProfilePicture: String,
        }],
        default: []
    },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
