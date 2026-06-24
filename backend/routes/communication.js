import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// GET communication logs for a specific client
router.get('/:clientId', authenticateToken, async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { data: logs, error } = await supabase
      .from('CommunicationLog')
      .select('*')
      .eq('clientId', clientId)
      .order('communicationDate', { ascending: false });

    if (error) throw error;
    res.json(logs || []);
  } catch (error) {
    next(error);
  }
});

// POST log a new communication
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { clientId, communicationType, communicationDate, remarks } = req.body;

    if (!clientId || !communicationType || !communicationDate || !remarks) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const { data: log, error } = await supabase
      .from('CommunicationLog')
      .insert([{
        clientId,
        communicationType,
        communicationDate: new Date(communicationDate).toISOString(),
        remarks,
      }])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    const { data: client } = await supabase.from('Client').select('clientName').eq('id', clientId).single();
    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Logged ${communicationType} with client: ${client?.clientName || 'Unknown'}`,
    }]);

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

export default router;
