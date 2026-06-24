import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();

// Helper to calculate days remaining
function getDaysRemaining(endDateStr, referenceDateStr) {
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  ref.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper to determine alert status and urgency
function analyzeExpiry(endDate, statusOverride, referenceDateStr) {
  if (statusOverride === 'Suspended' || statusOverride === 'Inactive') {
    return {
      daysRemaining: getDaysRemaining(endDate, referenceDateStr),
      alertStatus: 'Grey', urgency: 'inactive',
      label: statusOverride, needsAction: false,
      alertMessage: `Account is ${statusOverride.toLowerCase()}.`
    };
  }

  const daysRemaining = getDaysRemaining(endDate, referenceDateStr);
  let alertStatus = 'Green', urgency = 'normal', label = 'Active';
  let needsAction = false, alertMessage = '';

  if (daysRemaining < 0) {
    alertStatus = 'Red'; urgency = 'expired'; label = 'Expired'; needsAction = true;
    alertMessage = `Expired ${Math.abs(daysRemaining)} days ago (on ${new Date(endDate).toISOString().split('T')[0]})`;
  } else if (daysRemaining <= 7) {
    alertStatus = 'Orange'; urgency = 'critical'; label = 'Critical'; needsAction = true;
    alertMessage = daysRemaining === 0 ? `Expires today!` : `Expires in ${daysRemaining} days (Critical Warning)`;
  } else if (daysRemaining <= 30) {
    alertStatus = 'Yellow'; urgency = 'warning'; label = 'Warning'; needsAction = true;
    alertMessage = `Expires in ${daysRemaining} days (Upcoming Renewal)`;
  } else {
    alertMessage = `Expires in ${daysRemaining} days`;
  }

  return { daysRemaining, alertStatus, urgency, label, needsAction, alertMessage };
}

// GET all renewal alerts & statuses
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { referenceDate } = req.query;

    const { data: clients, error } = await supabase
      .from('Client')
      .select('id, clientName, companyName, email, phone, clientType, contractStartDate, renewalDate, status, paymentStatus');

    if (error) throw error;

    const alerts = (clients || []).map(client => {
      const analysis = analyzeExpiry(client.renewalDate, client.status, referenceDate);
      return {
        id: client.id,
        clientName: client.clientName,
        companyName: client.companyName,
        email: client.email,
        phone: client.phone,
        clientType: client.clientType,
        contractStartDate: client.contractStartDate,
        renewalDate: client.renewalDate,
        status: client.status,
        paymentStatus: client.paymentStatus,
        analysis
      };
    });

    // Sort: most urgent first
    const orderPriority = { Red: 0, Orange: 1, Yellow: 2, Green: 3, Grey: 4 };
    alerts.sort((a, b) => {
      const pA = orderPriority[a.analysis.alertStatus] ?? 5;
      const pB = orderPriority[b.analysis.alertStatus] ?? 5;
      if (pA !== pB) return pA - pB;
      return a.analysis.daysRemaining - b.analysis.daysRemaining;
    });

    res.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.analysis.alertStatus === 'Orange' || a.analysis.alertStatus === 'Red').length,
        warning: alerts.filter(a => a.analysis.alertStatus === 'Yellow').length,
        active: alerts.filter(a => a.analysis.alertStatus === 'Green').length,
        inactive: alerts.filter(a => a.analysis.alertStatus === 'Grey').length
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET email template for a client
router.get('/:clientId/email', authenticateToken, async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { referenceDate } = req.query;

    const { data: client, error } = await supabase
      .from('Client')
      .select('*, equipmentPreferences:EquipmentPreference(*), rentalHistory:RentalHistory(*)')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const analysis = analyzeExpiry(client.renewalDate, client.status, referenceDate);
    const days = analysis.daysRemaining;
    const rentalItem = client.equipmentPreferences?.[0]?.equipmentName || 'Rental Account Package';

    let subject = '', urgencyText = '';

    if (days < 0) {
      subject = `ACTION REQUIRED: Expiry Notice - ${rentalItem} - SD Digitals`;
      urgencyText = `expired on ${new Date(client.renewalDate).toISOString().split('T')[0]} (${Math.abs(days)} days ago). To avoid equipment return protocols or service fees, we need to finalize a lease renewal agreement immediately.`;
    } else if (days <= 7) {
      subject = `URGENT: Upcoming Expiry Alert - ${rentalItem} - SD Digitals`;
      urgencyText = `is scheduled to expire in ${days} days (on ${new Date(client.renewalDate).toISOString().split('T')[0]}). Please review the renewal terms below to confirm extension.`;
    } else {
      subject = `Renewal Reminder - ${rentalItem} - SD Digitals`;
      urgencyText = `is coming up for renewal in ${days} days (on ${new Date(client.renewalDate).toISOString().split('T')[0]}). We would love to discuss extending your contract.`;
    }

    const body = `Dear ${client.clientName},\n\nThis is a notification from SD Digitals regarding your rental account for:\n"${rentalItem}"\n\nOur records indicate that your contract ${urgencyText}\n\nCurrent Agreement Details:\n- Company Name: ${client.companyName || 'N/A'}\n- Primary Contact Email: ${client.email}\n- Contact Phone: ${client.phone}\n- Preferred Communication Mode: ${client.preferredCommunication}\n\nWe highly value your partnership and would be pleased to offer a direct renewal under our flexible terms. Please reply directly to this email or call us.\n\nBest regards,\nSD Digitals Account Manager\ninfo@sddigitals.com\n+1 (555) 010-0900`;

    res.json({ subject, body, recipient: client.email });
  } catch (error) {
    next(error);
  }
});

// POST renew/extend a contract
router.post('/:clientId/renew', authenticateToken, async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { months, renewalDate } = req.body;

    const { data: client, error: findErr } = await supabase
      .from('Client')
      .select('*')
      .eq('id', clientId)
      .single();

    if (findErr || !client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    let newRenewalDate, extensionMonths = 0;

    if (renewalDate) {
      newRenewalDate = new Date(renewalDate);
      if (isNaN(newRenewalDate.getTime())) {
        return res.status(400).json({ error: 'Invalid renewal date provided' });
      }
      const diffDays = Math.ceil(Math.abs(newRenewalDate - new Date(client.renewalDate)) / (1000 * 60 * 60 * 24));
      extensionMonths = Math.round(diffDays / 30) || 1;
    } else {
      extensionMonths = parseInt(months) || 6;
      newRenewalDate = new Date(client.renewalDate);
      newRenewalDate.setMonth(newRenewalDate.getMonth() + extensionMonths);
    }

    // Update client
    const { data: updatedClient, error: updateErr } = await supabase
      .from('Client')
      .update({
        contractStartDate: client.renewalDate,
        renewalDate: newRenewalDate.toISOString(),
        status: 'Active'
      })
      .eq('id', clientId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Resolve pending renewal
    const { data: pending } = await supabase
      .from('Renewal')
      .select('id')
      .eq('clientId', clientId)
      .eq('renewalStatus', 'Pending')
      .limit(1);

    if (pending && pending.length > 0) {
      await supabase.from('Renewal').update({ renewalStatus: 'Resolved' }).eq('id', pending[0].id);
    }

    // Create new pending renewal
    await supabase.from('Renewal').insert([{
      clientId,
      renewalDate: newRenewalDate.toISOString(),
      alertStatus: 'Green',
      renewalStatus: 'Pending'
    }]);

    // Rental history entry
    await supabase.from('RentalHistory').insert([{
      clientId,
      equipmentName: renewalDate ? 'Contract Extension - Custom Date' : `Contract Extension - ${extensionMonths} Months`,
      rentalStart: client.renewalDate,
      rentalEnd: newRenewalDate.toISOString(),
      amount: 0.0,
      status: 'Active'
    }]);

    // Audit log
    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Renewed/Extended contract for client: ${client.clientName}. New Expiry: ${newRenewalDate.toISOString().split('T')[0]}`,
    }]);

    res.json({ message: 'Contract successfully renewed!', client: updatedClient });
  } catch (error) {
    next(error);
  }
});

export default router;
