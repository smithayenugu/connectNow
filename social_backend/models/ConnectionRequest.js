const mongoose = require('mongoose');

const ConnectionRequestSchema = new mongoose.Schema({
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const ConnectionRequest = mongoose.model('ConnectionRequest', ConnectionRequestSchema);

module.exports = ConnectionRequest;
