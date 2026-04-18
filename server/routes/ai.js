import express from 'express';
import { supabase } from '../config/supabase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/templates', protect, async (req, res) => {
  try {
    const { data: adminRow, error } = await supabase
      .from('users')
      .select('id,quick_scripts')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json({
      adminId: adminRow?.id || null,
      scripts: adminRow?.quick_scripts || []
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;

