import express from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// GET all clients (with search, filter, sort, pagination)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { search, type, status, sortBy, sortOrder, page, limit } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const validSortFields = ['clientName', 'companyName', 'renewalDate', 'status', 'clientType'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'clientName';
    const ascending = sortOrder !== 'desc';

    // Build query
    let query = supabase
      .from('Client')
      .select('*, equipmentPreferences:EquipmentPreference(*), rentalHistory:RentalHistory(*)', { count: 'exact' })
      .order(sortField, { ascending })
      .range(from, to);

    if (search) {
      query = query.or(`clientName.ilike.%${search}%,companyName.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (type && type !== 'All') {
      query = query.eq('clientType', type);
    }
    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    const { data: clients, count, error } = await query;

    if (error) throw error;

    res.json({
      clients: clients || [],
      pagination: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET single client by ID
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: client, error } = await supabase
      .from('Client')
      .select(`
        *,
        equipmentPreferences:EquipmentPreference(*),
        rentalHistory:RentalHistory(*),
        communicationLogs:CommunicationLog(*),
        renewals:Renewal(*)
      `)
      .eq('id', id)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Sort sub-relations
    if (client.rentalHistory) client.rentalHistory.sort((a, b) => new Date(b.rentalStart) - new Date(a.rentalStart));
    if (client.communicationLogs) client.communicationLogs.sort((a, b) => new Date(b.communicationDate) - new Date(a.communicationDate));
    if (client.renewals) client.renewals.sort((a, b) => new Date(b.renewalDate) - new Date(a.renewalDate));

    res.json(client);
  } catch (error) {
    next(error);
  }
});

// CREATE a client
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const {
      clientName, companyName, email, phone, clientType, address,
      preferredCommunication, contractStartDate, renewalDate,
      status, paymentStatus, notes, equipmentPreferences, rentalHistory,
    } = req.body;

    if (!clientName || !email || !phone || !clientType || !contractStartDate || !renewalDate) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const phoneRegex = /^[0-9+\s\-().]+$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must contain only numbers' });
    }

    // Compute status
    const refDateHeader = req.headers['x-reference-date'];
    const refDate = refDateHeader ? new Date(refDateHeader) : new Date();
    refDate.setHours(0, 0, 0, 0);
    const expiry = new Date(renewalDate);
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
    const computedStatus = diffDays < 0 ? 'Expired' : 'Active';

    const { data: newClient, error: clientErr } = await supabase
      .from('Client')
      .insert([{
        clientName,
        companyName: companyName || '',
        email, phone, clientType,
        address: address || '',
        preferredCommunication: preferredCommunication || 'Email',
        contractStartDate: new Date(contractStartDate).toISOString(),
        renewalDate: new Date(renewalDate).toISOString(),
        status: computedStatus,
        paymentStatus: paymentStatus || 'Paid',
        notes: notes || '',
      }])
      .select()
      .single();

    if (clientErr) throw clientErr;

    // Insert related records
    if (equipmentPreferences && equipmentPreferences.length > 0) {
      await supabase.from('EquipmentPreference').insert(
        equipmentPreferences.map(p => ({ ...p, clientId: newClient.id }))
      );
    }

    if (rentalHistory && rentalHistory.length > 0) {
      await supabase.from('RentalHistory').insert(
        rentalHistory.map(h => ({
          ...h,
          clientId: newClient.id,
          rentalStart: new Date(h.rentalStart).toISOString(),
          rentalEnd: new Date(h.rentalEnd).toISOString(),
        }))
      );
    }

    // Create renewal record
    await supabase.from('Renewal').insert([{
      clientId: newClient.id,
      renewalDate: new Date(renewalDate).toISOString(),
      alertStatus: 'Green',
      renewalStatus: 'Pending',
    }]);

    // Audit log
    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Added a new client: ${clientName} (${companyName || 'No Company'})`,
    }]);

    res.status(201).json(newClient);
  } catch (error) {
    next(error);
  }
});

// UPDATE a client
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      clientName, companyName, email, phone, clientType, address,
      preferredCommunication, contractStartDate, renewalDate,
      status, paymentStatus, notes,
    } = req.body;

    // Fetch existing
    const { data: existing, error: findErr } = await supabase
      .from('Client')
      .select('*')
      .eq('id', id)
      .single();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (phone !== undefined) {
      const phoneRegex = /^[0-9+\s\-().]+$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Phone number must contain only numbers' });
      }
    }

    let finalStatus = status !== undefined ? status : existing.status;
    if (renewalDate !== undefined && finalStatus !== 'Suspended' && finalStatus !== 'Inactive') {
      const refDateHeader = req.headers['x-reference-date'];
      const refDate = refDateHeader ? new Date(refDateHeader) : new Date();
      refDate.setHours(0, 0, 0, 0);
      const expiry = new Date(renewalDate);
      expiry.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expiry.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
      finalStatus = diffDays < 0 ? 'Expired' : 'Active';
    }

    const updateData = {
      clientName: clientName ?? existing.clientName,
      companyName: companyName ?? existing.companyName,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      clientType: clientType ?? existing.clientType,
      address: address ?? existing.address,
      preferredCommunication: preferredCommunication ?? existing.preferredCommunication,
      contractStartDate: contractStartDate ? new Date(contractStartDate).toISOString() : existing.contractStartDate,
      renewalDate: renewalDate ? new Date(renewalDate).toISOString() : existing.renewalDate,
      status: finalStatus,
      paymentStatus: paymentStatus ?? existing.paymentStatus,
      notes: notes ?? existing.notes,
    };

    const { data: updated, error: updateErr } = await supabase
      .from('Client')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Update renewal date if changed
    if (renewalDate) {
      const { data: renewals } = await supabase
        .from('Renewal')
        .select('id')
        .eq('clientId', id)
        .eq('renewalStatus', 'Pending')
        .limit(1);

      if (renewals && renewals.length > 0) {
        await supabase
          .from('Renewal')
          .update({ renewalDate: new Date(renewalDate).toISOString() })
          .eq('id', renewals[0].id);
      }
    }

    // Audit log
    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Updated client record for: ${updated.clientName}`,
    }]);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE a client (Admin only)
router.delete('/:id', authenticateToken, authorizeRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: client, error: findErr } = await supabase
      .from('Client')
      .select('clientName')
      .eq('id', id)
      .single();

    if (findErr || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { error: deleteErr } = await supabase
      .from('Client')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    // Audit log
    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Deleted client: ${client.clientName} and all associated data`,
    }]);

    res.json({ message: `Client ${client.clientName} deleted successfully` });
  } catch (error) {
    next(error);
  }
});

// POST equipment preference
router.post('/:id/preferences', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { equipmentName, category } = req.body;

    if (!equipmentName || !category) {
      return res.status(400).json({ error: 'Equipment Name and Category are required' });
    }

    const { data: pref, error } = await supabase
      .from('EquipmentPreference')
      .insert([{ clientId: id, equipmentName, category }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(pref);
  } catch (error) {
    next(error);
  }
});

// DELETE equipment preference
router.delete('/:id/preferences/:prefId', authenticateToken, async (req, res, next) => {
  try {
    const { prefId } = req.params;
    const { error } = await supabase.from('EquipmentPreference').delete().eq('id', prefId);
    if (error) throw error;
    res.json({ message: 'Equipment preference deleted' });
  } catch (error) {
    next(error);
  }
});

// POST rental history entry
router.post('/:id/rental-history', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { equipmentName, rentalStart, rentalEnd, amount, status } = req.body;

    if (!equipmentName || !rentalStart || !rentalEnd || !amount || !status) {
      return res.status(400).json({ error: 'All rental history fields are required' });
    }

    const { data: history, error } = await supabase
      .from('RentalHistory')
      .insert([{
        clientId: id,
        equipmentName,
        rentalStart: new Date(rentalStart).toISOString(),
        rentalEnd: new Date(rentalEnd).toISOString(),
        amount: parseFloat(amount),
        status,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(history);
  } catch (error) {
    next(error);
  }
});

export default router;
