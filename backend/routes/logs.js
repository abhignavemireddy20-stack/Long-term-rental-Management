import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// GET all audit logs (Admin only) — latest 100
router.get('/', authenticateToken, authorizeRole('Admin'), async (req, res, next) => {
  try {
    const { data: logs, error } = await supabase
      .from('AuditLog')
      .select('*, user:User(name, email, role)')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(logs || []);
  } catch (error) {
    next(error);
  }
});

export default router;
