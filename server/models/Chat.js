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
    firstName: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    services: {
      type: [String],
      required: true,
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one service is required'
      }
    },
    comment: {
      type: String,
      default: '',
      trim: true
    },
    files: [{
      id: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      size: {
        type: Number,
        required: true
      },
      type: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }],
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

// Удален дублирующий индекс для userId, так как unique: true выше уже создает его
chatSchema.index({ lastUpdate: -1 });

export default mongoose.model('Chat', chatSchema);