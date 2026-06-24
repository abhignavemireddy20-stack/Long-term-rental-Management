import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Calendar, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { Toast, type ToastType } from '../components/Toast';

interface AuditLogItem {
  id: string;
  action: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export const AuditLogs: React.FC = () => {
  const { user } = useAuth();
  
  // Data States
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const loadAuditLogs = async () => {
    if (user?.role !== 'Admin') return;
    try {
      setLoading(true);
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load system security logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [user]);

  if (user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 rounded-3xl p-8 max-w-xl mx-auto">
        <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-semibold leading-relaxed">
          The security audit logs are strictly restricted to system administrators. Your account lacks high-clearance role permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">Supervise internal events, client deletions, database updates, and login sessions.</p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="flex items-center gap-1.5 px-3 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors select-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Logs timeline card */}
      <div className="glass-card rounded-3xl p-6 shadow-xl border border-slate-200/40 dark:border-slate-800/30">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400 font-semibold font-sans">Compiling audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-semibold italic">No system audit records found.</div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 text-xs border-b border-slate-100 dark:border-slate-800/30 pb-3 last:border-0 hover:bg-slate-50/20 p-2 rounded-xl transition-all">
                {/* Event Icon indicator */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 bg-slate-100 dark:bg-slate-800 ${
                  log.action.includes('Deleted') ? 'text-red-500 bg-red-500/10' :
                  log.action.includes('Logged in') ? 'text-emerald-500 bg-emerald-500/10' :
                  'text-primary bg-primary/10'
                }`}>
                  {log.action.includes('Deleted') ? '🗑️' : log.action.includes('Logged in') ? '🔑' : '⚙️'}
                </div>

                <div className="flex-grow flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-850 dark:text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                      Operator: {log.user.name} ({log.user.email} • <span className="text-primary dark:text-secondary">{log.user.role}</span>)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-500 font-bold sm:text-right select-none flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
