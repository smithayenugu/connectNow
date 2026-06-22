// Usage: node populate_test_data.js
// This script populates MongoDB with test users and chat messages for your app.

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/mydatabase'; // <-- Change to your DB name

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  userId: { type: String, unique: true, index: true, required: true }
});
const User = mongoose.model('mycollections', userSchema);

const chatSchema = new mongoose.Schema({
  from: String,
  to: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});
const ChatMessage = mongoose.model('ChatMessage', chatSchema);

async function main() {
  await mongoose.connect(MONGO_URI);

  // Create test users
  const users = [
    { userId: 'smitha_09', name: 'Smitha', email: 'smitha@example.com', password: 'pass1' },
    { userId: 'smitha_yenugu09', name: 'Smitha Yenugu', email: 'yenugu@example.com', password: 'pass2' }
  ];
  await User.deleteMany({ userId: { $in: users.map(u => u.userId) } });
  await User.insertMany(users);

  // Create test chat messages
  const messages = [
    { from: 'smitha_09', to: 'smitha_yenugu09', text: 'Hello from Smitha!', timestamp: new Date() },
    { from: 'smitha_yenugu09', to: 'smitha_09', text: 'Hi Smitha, this is Yenugu!', timestamp: new Date() }
  ];
  await ChatMessage.deleteMany({
    $or: [
      { from: 'smitha_09', to: 'smitha_yenugu09' },
      { from: 'smitha_yenugu09', to: 'smitha_09' }
    ]
  });
  await ChatMessage.insertMany(messages);

  console.log('Inserted test users and chat messages.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
