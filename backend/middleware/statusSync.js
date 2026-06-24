import supabase from '../config/supabase.js';

export async function syncClientStatuses(referenceDate) {
  const { data: clients, error } = await supabase
    .from('Client')
    .select('id, renewalDate, status');

  if (error) {
    console.error('Failed to fetch clients for status sync:', error.message);
    return;
  }

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const updates = [];

  for (const client of (clients || [])) {
    // Preserve manual overrides
    if (client.status === 'Suspended' || client.status === 'Inactive') continue;

    const expiry = new Date(client.renewalDate);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiry.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
    const computedStatus = diffDays < 0 ? 'Expired' : 'Active';

    if (client.status !== computedStatus) {
      updates.push({ id: client.id, status: computedStatus });
    }
  }

  // Batch update changed clients
  for (const update of updates) {
    await supabase.from('Client').update({ status: update.status }).eq('id', update.id);
  }
}

export async function statusSyncMiddleware(req, res, next) {
  if (
    req.method === 'GET' &&
    (req.originalUrl.includes('/api/clients') ||
     req.originalUrl.includes('/api/renewals') ||
     req.originalUrl.includes('/api/analytics'))
  ) {
    try {
      const headerDate = req.headers['x-reference-date'];
      const queryDate = req.query.referenceDate;
      const refDate = headerDate ? new Date(headerDate) : (queryDate ? new Date(queryDate) : new Date());
      await syncClientStatuses(refDate);
    } catch (err) {
      console.error('Client status synchronization failed:', err.message);
    }
  }
  next();
}
