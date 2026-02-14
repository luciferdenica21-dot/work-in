import express from 'express';
import mongoose from 'mongoose';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/events', protect, async (req, res) => {
  try {
    const { sessionId, action, path, section, element, serviceKey, details, durationMs, timestamp } = req.body || {};
    if (!action) return res.status(400).json({ message: 'action is required' });
    const event = await AnalyticsEvent.create({
      userId: req.user?._id,
      sessionId: sessionId || '',
      action,
      path: path || req.originalUrl,
      section: section || '',
      element: element || '',
      serviceKey: serviceKey || '',
      details: details || {},
      durationMs: Number(durationMs) || 0,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });
    res.json({ success: true, eventId: event._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/bind-session', protect, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ message: 'sessionId is required' });
    const result = await AnalyticsEvent.updateMany(
      { sessionId, $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $set: { userId: req.user._id } }
    );
    res.json({ success: true, matched: result.matchedCount || result.nMatched, modified: result.modifiedCount || result.nModified });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user/:userId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({
        visits: [],
        clicksBySection: [],
        timeBySection: [],
        timeByService: [],
        recentEvents: []
      });
    }
    const stats = await AnalyticsEvent.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          visits: [
            { $match: { action: 'visit' } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                lastVisit: { $max: '$timestamp' },
              }
            }
          ],
          clicksBySection: [
            { $match: { action: 'click' } },
            {
              $group: {
                _id: '$section',
                count: { $sum: 1 }
              }
            }
          ],
          timeBySection: [
            { $match: { action: 'section_close' } },
            {
              $group: {
                _id: '$section',
                durationMs: { $sum: '$durationMs' }
              }
            }
          ],
          timeByService: [
            { $match: { action: 'service_close' } },
            {
              $group: {
                _id: '$serviceKey',
                durationMs: { $sum: '$durationMs' }
              }
            }
          ],
          recentEvents: [
            { $sort: { timestamp: -1 } },
            { $limit: 100 }
          ]
        }
      }
    ]);
    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
