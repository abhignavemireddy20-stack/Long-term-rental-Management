import React, { useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Mail, 
  CheckCircle, 
  Clock, 
  Copy, 
  X, 
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Toast, type ToastType } from '../components/Toast';
import { LiveIndicator } from '../components/LiveIndicator';

interface AlertItem {
  id: string;
  clientName: string;
  companyName: string;
  email: string;
  phone: string;
  clientType: string;
  contractStartDate: string;
  renewalDate: string;
  status: string;
  analysis: {
    daysRemaining: number;
    alertStatus: 'Green' | 'Yellow' | 'Orange' | 'Red' | 'Grey';
    urgency: string;
    label: string;
    needsAction: boolean;
    alertMessage: string;
  };
}

export const Alerts: React.FC = () => {
  
  // Data States
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Email Template Modal States
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedClientEmail, setSelectedClientEmail] = useState<any>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Renewal Resolve Modal States
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [selectedClientRenew, setSelectedClientRenew] = useState<any>(null);
  const [renewMonths, setRenewMonths] = useState(6);
  const [renewLoading, setRenewLoading] = useState(false);
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [customRenewalDate, setCustomRenewalDate] = useState('');

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const activeRefDate = localStorage.getItem('sd_digitals_reference_date') || '';
      const res = await api.get(`/renewals?referenceDate=${activeRefDate}`);
      setAlerts(res.data.alerts);
      setSummary(res.data.summary);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      triggerToast('Failed to compute expiration queues.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 12000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Email Template
  const handleOpenEmailModal = async (client: AlertItem) => {
    setEmailLoading(true);
    setSelectedClientEmail(null);
    setEmailModalOpen(true);
    
    try {
      const activeRefDate = localStorage.getItem('sd_digitals_reference_date') || '';
      const res = await api.get(`/renewals/${client.id}/email?referenceDate=${activeRefDate}`);
      setSelectedClientEmail({
        clientName: client.clientName,
        ...res.data
      });
    } catch (err) {
      console.error(err);
      triggerToast('Failed to compile email templates.', 'error');
      setEmailModalOpen(false);
    } finally {
      setEmailLoading(false);
    }
  };

  // Copy Email Body to Clipboard
  const handleCopyEmail = () => {
    if (!selectedClientEmail) return;
    navigator.clipboard.writeText(selectedClientEmail.body);
    triggerToast('Email text copied to clipboard!', 'success');
  };

  // Open Renew Modal
  const handleOpenRenewModal = (client: AlertItem) => {
    setSelectedClientRenew(client);
    setRenewMonths(6);
    setIsCustomDate(false);
    setCustomRenewalDate('');
    setRenewModalOpen(true);
  };

  // Handle Resolve (Renew Lease)
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientRenew) return;

    if (isCustomDate && !customRenewalDate) {
      triggerToast('Please specify a custom renewal date.', 'error');
      return;
    }

    setRenewLoading(true);
    try {
      const payload = isCustomDate 
        ? { renewalDate: customRenewalDate } 
        : { months: renewMonths };

      await api.post(`/renewals/${selectedClientRenew.id}/renew`, payload);
      
      const successMsg = isCustomDate 
        ? `Contract resolved! Lease extended to ${customRenewalDate}.`
        : `Contract resolved! Lease extended by ${renewMonths} months.`;

      triggerToast(successMsg, 'success');
      setRenewModalOpen(false);
      fetchAlerts();
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.error || 'Renewal submission failed.', 'error');
    } finally {
      setRenewLoading(false);
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium font-sans">Evaluating Contract Alert Statuses...</span>
      </div>
    );
  }

  // Filter alert categories for tab review
  const criticalList = alerts.filter(a => a.analysis.alertStatus === 'Red' || a.analysis.alertStatus === 'Orange');
  const warningList = alerts.filter(a => a.analysis.alertStatus === 'Yellow');

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Header section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Renewal Alerts Center</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Auto-generated contract warnings. Generate email followups and manage lease agreements.</p>
            <LiveIndicator lastUpdated={lastUpdated} onRefresh={fetchAlerts} />
          </div>
        </div>
      </div>

      {/* Alert KPI Summary Grid */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Critical Alerts</span>
            <span className="text-2xl font-extrabold text-red-500 tracking-tight mt-1">{summary.critical}</span>
            <span className="text-[9px] text-slate-450 font-bold mt-0.5">Expired / &lt;= 7 Days Left</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Upcoming Warnings</span>
            <span className="text-2xl font-extrabold text-amber-500 tracking-tight mt-1">{summary.warning}</span>
            <span className="text-[9px] text-slate-450 font-bold mt-0.5">8 to 30 Days Left</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ongoing Leases</span>
            <span className="text-2xl font-extrabold text-emerald-500 tracking-tight mt-1">{summary.active}</span>
            <span className="text-[9px] text-slate-450 font-bold mt-0.5">More than 30 Days</span>
          </div>
          <div className="glass-card p-4 rounded-2xl flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Suspended Accounts</span>
            <span className="text-2xl font-extrabold text-slate-500 tracking-tight mt-1">{summary.inactive}</span>
            <span className="text-[9px] text-slate-450 font-bold mt-0.5">Inactive or Dispute</span>
          </div>
        </div>
      )}

      {/* Expiry queues listing */}
      <div className="space-y-6">
        
        {/* Critical Alerts Zone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/40">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">Critical Warnings ({criticalList.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalList.length === 0 ? (
              <div className="md:col-span-2 p-5 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl">
                🎉 No critical lease expiration alerts.
              </div>
            ) : (
              criticalList.map((alert) => (
                <div key={alert.id} className="glass-card p-5 rounded-2xl border-l-4 border-l-red-500 flex flex-col justify-between min-h-[160px] animate-fadeIn">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{alert.clientName}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{alert.companyName || 'Independent'} • {alert.clientType}</p>
                    </div>
                     <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-600 animate-pulse">
                      {alert.analysis.label === 'Expired' ? 'Rental Completed' : alert.analysis.label === 'Active' ? 'Ongoing' : alert.analysis.label}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-450 mt-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>{alert.analysis.alertMessage}</span>
                  </p>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/30 flex justify-between items-center text-xs">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Expiry: {alert.renewalDate.split('T')[0]}</span>
                    
                    <div className="flex gap-2 font-bold select-none">
                      <button
                        onClick={() => handleOpenEmailModal(alert)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-md"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email alert</span>
                      </button>
                      <button
                        onClick={() => handleOpenRenewModal(alert)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Resolve alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Warning Alerts Zone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800/40">
            <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350">Upcoming Warnings ({warningList.length})</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warningList.length === 0 ? (
              <div className="md:col-span-2 p-5 text-center text-xs text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl">
                No upcoming contract expirations warnings.
              </div>
            ) : (
              warningList.map((alert) => (
                <div key={alert.id} className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex flex-col justify-between min-h-[160px] animate-fadeIn">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{alert.clientName}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{alert.companyName || 'Independent'} • {alert.clientType}</p>
                    </div>
                     <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600">
                      {alert.analysis.label === 'Expired' ? 'Rental Completed' : alert.analysis.label === 'Active' ? 'Ongoing' : alert.analysis.label}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-455 mt-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{alert.analysis.alertMessage}</span>
                  </p>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/30 flex justify-between items-center text-xs">
                    <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">Expiry: {alert.renewalDate.split('T')[0]}</span>
                    
                    <div className="flex gap-2 font-bold select-none">
                      <button
                        onClick={() => handleOpenEmailModal(alert)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-md"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email alert</span>
                      </button>
                      <button
                        onClick={() => handleOpenRenewModal(alert)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Resolve alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal: Generate Email Alert template */}
      <AnimatePresence>
        {emailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setEmailModalOpen(false)}
              className="absolute inset-0 bg-black backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-250/20 dark:border-slate-800/40"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-55/10 dark:bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Copy Renewal Reminder Email</h3>
                </div>
                <button onClick={() => setEmailModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Email Content Box */}
              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                {emailLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 font-semibold">Generating email templates...</span>
                  </div>
                ) : !selectedClientEmail ? (
                  <div className="text-center text-xs text-slate-400 italic">No template generated.</div>
                ) : (
                  <div className="space-y-3 font-semibold text-slate-700 dark:text-slate-350 text-xs">
                    <div className="p-3 bg-slate-100/60 dark:bg-slate-850/60 rounded-xl space-y-1.5 border border-slate-150/40 dark:border-slate-800/20">
                      <div>
                        <span className="text-slate-400">Recipient:</span> <code className="text-primary dark:text-secondary">{selectedClientEmail.recipient}</code>
                      </div>
                      <div>
                        <span className="text-slate-400">Subject:</span> <span className="text-slate-800 dark:text-slate-200">{selectedClientEmail.subject}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="text-slate-400">Email Body:</span>
                      <textarea
                        readOnly
                        rows={10}
                        value={selectedClientEmail.body}
                        className="w-full p-4 rounded-xl bg-slate-100/40 dark:bg-slate-850/30 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none font-mono text-[10px] leading-relaxed resize-none text-slate-800 dark:text-slate-250 select-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-55/10 dark:bg-slate-950/20 select-none">
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  onClick={handleCopyEmail}
                  disabled={emailLoading || !selectedClientEmail}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-primary/10"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy to Clipboard</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Resolve/Renew Contract Period selector */}
      <AnimatePresence>
        {renewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setRenewModalOpen(false)}
              className="absolute inset-0 bg-black backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden border border-slate-250/20 dark:border-slate-800/40"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-55/10 dark:bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Extend / Renew Agreement</h3>
                </div>
                <button onClick={() => setRenewModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleRenewSubmit} className="p-6 space-y-4">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-350 space-y-2 leading-relaxed">
                  <p>You are about to resolve the expiration warning for client <span className="font-extrabold text-slate-800 dark:text-white">"{selectedClientRenew?.clientName}"</span>.</p>
                  <p>This action will set the old renewal date as the new start date, and shift the expiry forward.</p>
                </div>
                
                <div className="space-y-2 select-none">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-450 uppercase">
                      {isCustomDate ? 'Custom Expiry Date' : 'Lease Extension Period'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomDate(!isCustomDate)}
                      className="text-[10px] font-bold text-primary hover:underline transition-all"
                    >
                      {isCustomDate ? 'Use predefined period' : 'Set custom date'}
                    </button>
                  </div>
                  
                  {isCustomDate ? (
                    <input
                      type="date"
                      required
                      value={customRenewalDate}
                      onChange={(e)=>setCustomRenewalDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-800 dark:text-slate-200 font-semibold"
                    />
                  ) : (
                    <select
                      value={renewMonths}
                      onChange={(e)=>setRenewMonths(parseInt(e.target.value))}
                      className="w-full h-10 px-2 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      <option value={1}>1 Month Extension</option>
                      <option value={3}>3 Months Extension</option>
                      <option value={6}>6 Months (Half-Year Extension)</option>
                      <option value={12}>12 Months (Full-Year Extension)</option>
                    </select>
                  )}
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex justify-end gap-2 text-xs select-none">
                  <button
                    type="button"
                    onClick={() => setRenewModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg font-semibold text-slate-650 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={renewLoading}
                    className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-md shadow-primary/10 flex items-center justify-center min-w-24"
                  >
                    {renewLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>Renew Lease</span>
                    )}
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
