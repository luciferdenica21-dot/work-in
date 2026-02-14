import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },
  action: { type: String, enum: ['click', 'view', 'section_open', 'section_close', 'service_open', 'service_close', 'visit'], required: true },
  path: { type: String, default: '/' },
  section: { type: String, default: '' },
  element: { type: String, default: '' },
  serviceKey: { type: String, default: '' },
  details: { type: Object, default: {} },
  durationMs: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
