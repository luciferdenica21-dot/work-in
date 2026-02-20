import mongoose from 'mongoose';

const signatureRequestSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  file: {
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
    url: { type: String, default: '' }
  },
  managerSignatureUrl: { type: String, default: '' },
  clientSignatureUrl: { type: String, default: '' },
  status: { type: String, enum: ['created', 'manager_signed', 'completed'], default: 'created', index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

signatureRequestSchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.model('SignatureRequest', signatureRequestSchema);
