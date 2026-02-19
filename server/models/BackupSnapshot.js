import mongoose from 'mongoose';

const backupSnapshotSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  totals: {
    chats: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    orders: { type: Number, default: 0 }
  },
  users: [
    {
      chatId: { type: mongoose.Schema.Types.ObjectId },
      userEmail: { type: String, default: '' },
      messages: [
        {
          id: { type: String, default: '' },
          at: { type: Date },
          from: { type: String, default: '' },
          text: { type: String, default: '' },
          attachments: [
            {
              originalName: { type: String, default: '' },
              mimetype: { type: String, default: '' },
              size: { type: Number, default: 0 },
              url: { type: String, default: '' }
            }
          ]
        }
      ],
      orders: [
        {
          orderIndex: { type: Number, default: 0 },
          status: { type: String, default: 'new' },
          createdAt: { type: Date },
          firstName: { type: String, default: '' },
          lastName: { type: String, default: '' },
          contact: { type: String, default: '' },
          services: [{ type: String }],
          comment: { type: String, default: '' },
          files: [
            {
              name: { type: String, default: '' },
              type: { type: String, default: '' },
              size: { type: Number, default: 0 },
              url: { type: String, default: '' }
            }
          ],
          priceGel: { type: Number, default: 0 },
          priceUsd: { type: Number, default: 0 },
          priceEur: { type: Number, default: 0 },
          managerComment: { type: String, default: '' },
          managerDate: { type: Date }
        }
      ]
    }
  ]
});

backupSnapshotSchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.model('BackupSnapshot', backupSnapshotSchema);
