import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userEmail: {
    type: String,
    required: true
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  unread: {
    type: Boolean,
    default: false
  },
  orders: [{
    firstName: String,
    lastName: String,
    contact: String,
    services: [String],
    comment: String,
    status: {
      type: String,
      enum: ['new', 'accepted', 'declined'],
      default: 'new'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

chatSchema.index({ userId: 1 });
chatSchema.index({ lastUpdate: -1 });

export default mongoose.model('Chat', chatSchema);