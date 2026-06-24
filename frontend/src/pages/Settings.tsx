import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  Calendar, 
  CheckCircle,
  Database,
  Moon,
  Sun,
  AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { Toast, type ToastType } from '../components/Toast';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Reference Date States
  const [refDateInput, setRefDateInput] = useState('');
  const [currentRefDate, setCurrentRefDate] = useState<string | null>(null);

  // User Manager States (Admin only)
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'Staff' });
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const checkRefDate = () => {
    const saved = localStorage.getItem('sd_digitals_reference_date');
    setCurrentRefDate(saved);
    if (saved) {
      setRefDateInput(saved);
    } else {
      setRefDateInput(new Date().toISOString().split('T')[0]);
    }
  };

  // Fetch users for user manager
  const fetchUsers = async () => {
    if (user?.role !== 'Admin') return;
    setUsersLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load system staff lists.', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    checkRefDate();
    fetchUsers();
  }, [user]);

  // Handle Date travel override
  const handleSaveRefDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refDateInput) {
      localStorage.removeItem('sd_digitals_reference_date');
      setCurrentRefDate(null);
      triggerToast('System date reset to actual local date.', 'success');
    } else {
      localStorage.setItem('sd_digitals_reference_date', refDateInput);
      setCurrentRefDate(refDateInput);
      triggerToast(`Simulated time travel configured to: ${refDateInput}`, 'success');
    }
  };

  const handleResetRefDate = () => {
    localStorage.removeItem('sd_digitals_reference_date');
    setCurrentRefDate(null);
    setRefDateInput(new Date().toISOString().split('T')[0]);
    triggerToast('System date reset to actual local date.', 'success');
  };

  // Handle Add user (Admin)
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError(null);
    const { name, email, password, role } = newUserForm;

    if (!name || !email || !password || !role) {
      setAddUserError('All registration fields are required.');
      return;
    }

    try {
      await api.post('/auth/register', { name, email, password, role });
      triggerToast(`User account "${name}" created successfully.`, 'success');
      setNewUserForm({ name: '', email: '', password: '', role: 'Staff' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setAddUserError(err.response?.data?.error || 'Registration failed.');
    }
  };

  // Handle Delete User (Admin)
  const handleDeleteUser = async (targetId: string) => {
    try {
      await api.delete(`/auth/users/${targetId}`);
      triggerToast(`User account terminated successfully.`, 'success');
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.error || 'Termination failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full mx-4 p-6 rounded-3xl border border-white/10 dark:border-white/5 bg-white dark:bg-slate-900 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Terminate User Account?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">{deleteTarget.name}</strong>? This action is permanent.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  handleDeleteUser(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 h-9 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all active:scale-[0.97] cursor-pointer"
              >
                Yes, Terminate
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header section */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">Manage preferences, simulate contract dates, and supervise user log access permissions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Configurations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Time Travel Overrides */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-150 dark:border-slate-800/30 pb-3">
              <Calendar className="w-4.5 h-4.5 text-primary" />
              <span>Simulated Date Travel (Expirations Testing)</span>
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Overriding the system date shifts how contract ex-dates are evaluated. This lets you simulate years or months into the future to verify that the alerts engines transition status colors (Green to Yellow, Orange, and Red) correctly.
            </p>

            <form onSubmit={handleSaveRefDate} className="flex flex-wrap gap-4 items-end text-xs">
              <div className="flex-grow min-w-48 space-y-1.5 select-none">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Reference Evaluation Date</label>
                <input
                  type="date"
                  value={refDateInput}
                  onChange={(e) => setRefDateInput(e.target.value)}
                  className="w-full h-9.5 px-3 rounded-lg bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-800 dark:text-slate-200 font-semibold"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-4 h-9.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold">Apply Travel</button>
                {currentRefDate && (
                  <button type="button" onClick={handleResetRefDate} className="px-3 h-9.5 bg-red-500/10 text-red-600 rounded-lg font-bold border border-red-500/20">Reset</button>
                )}
              </div>
            </form>
            
            {currentRefDate ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 animate-pulse" />
                <span>Simulated calendar date override active: <strong>{currentRefDate}</strong>. Contract ex-dates will analyze relative to this date.</span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5" />
                <span>Actual system local date calendar is active. Expiration engines align with today's real date.</span>
              </div>
            )}
          </div>

          {/* Theme selection panel */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-150 dark:border-slate-800/30 pb-3">
              <Sun className="w-4.5 h-4.5 text-primary" />
              <span>UI Theme Color Modes</span>
            </h3>
            
            <div className="flex items-center justify-between text-xs select-none">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Toggle Interface Styling</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-all text-slate-700 dark:text-slate-200 shadow-sm"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4.5 h-4.5 text-slate-600" />
                    <span>Dark Mode Style</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4.5 h-4.5 text-amber-500" />
                    <span>Light Mode Style</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Diagnostics & Health */}
        <div className="space-y-6 lg:col-span-1">
          
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-150 dark:border-slate-800/30 pb-3">
              <Database className="w-4.5 h-4.5 text-primary" />
              <span>Prisma SQLite Database Status</span>
            </h3>

            <div className="space-y-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/20 pb-2">
                <span>Database Engine:</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">SQLite / dev.db</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/20 pb-2">
                <span>Database Client:</span>
                <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Connected
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/20 pb-2">
                <span>Active ORM:</span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">Prisma ORM v5.22</span>
              </div>
            </div>
          </div>

        </div>

        {/* Full row width: User credentials management (restricted) */}
        <div className="col-span-1 lg:col-span-3">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800/30 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <SettingsIcon className="w-4.5 h-4.5 text-primary" />
                <span>Supervisor User Manager Access</span>
              </h3>
              
              {user?.role === 'Admin' && (
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Staff</span>
                </button>
              )}
            </div>

            {/* If Staff: show restricted warning */}
            {user?.role !== 'Admin' ? (
              <div className="p-8 text-center text-xs text-slate-400 font-semibold flex flex-col items-center gap-1">
                <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
                <span>Supervising system logins are restricted to Admins. Staff credentials lack access permissions.</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Add User form slider */}
                {showAddUser && (
                  <form onSubmit={handleAddUserSubmit} className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl space-y-3.5 text-xs animate-slideDown max-w-xl">
                    {addUserError && (
                      <div className="flex items-center gap-1.5 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-semibold">
                        <AlertCircle className="w-4 h-4" />
                        <span>{addUserError}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Full Name</label>
                        <input type="text" required placeholder="Adam Admin" value={newUserForm.name} onChange={(e)=>setNewUserForm(prev=>({...prev, name: e.target.value}))} className="w-full h-8.5 px-3 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Email Address</label>
                        <input type="email" required placeholder="adam@sddigitals.com" value={newUserForm.email} onChange={(e)=>setNewUserForm(prev=>({...prev, email: e.target.value}))} className="w-full h-8.5 px-3 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-400">Password</label>
                        <input type="password" required placeholder="••••••••" value={newUserForm.password} onChange={(e)=>setNewUserForm(prev=>({...prev, password: e.target.value}))} className="w-full h-8.5 px-3 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <label className="font-bold text-slate-400">System Permission Role</label>
                        <select value={newUserForm.role} onChange={(e)=>setNewUserForm(prev=>({...prev, role: e.target.value}))} className="w-full h-8.5 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none font-semibold text-slate-700 dark:text-slate-350">
                          <option value="Staff">Staff (Can add clients, update records, view reports)</option>
                          <option value="Admin">Admin (Can full CRUD, delete clients, export logs, configure settings)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="submit" className="px-4 py-1.5 bg-primary text-white rounded font-bold">Register</button>
                      <button type="button" onClick={()=>setShowAddUser(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded font-bold">Cancel</button>
                    </div>
                  </form>
                )}

                {/* Users list table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Email</th>
                        <th className="pb-2">Role</th>
                        <th className="pb-2">Joined Date</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-350">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center">Loading user records...</td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id}>
                            <td className="py-3 font-bold text-slate-850 dark:text-slate-200">{u.name}</td>
                            <td className="py-3 font-semibold">{u.email}</td>
                            <td className="py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'Admin' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                             <td className="py-3 text-right">
                              <button
                                onClick={() => setDeleteTarget({ id: u.id, name: u.name })}
                                disabled={u.id === user?.id}
                                className="p-1 rounded text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
