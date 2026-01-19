import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  senderId: {
    type: String, // Can be 'manager' or userId (ObjectId as string)
    required: true
  },
  senderEmail: {
    type: String,
    default: ''
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ chatId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);