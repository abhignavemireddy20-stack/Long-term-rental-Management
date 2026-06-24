import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Plus, 
  Trash2, 
  Calendar,
  MessageSquare,
  History,
  FileClock,
  Camera,
  CheckCircle,
  Clock
} from 'lucide-react';
import api from '../utils/api';
import { Toast, type ToastType } from '../components/Toast';

interface ClientDetailData {
  id: string;
  clientName: string;
  companyName: string;
  clientType: string;
  phone: string;
  email: string;
  address: string;
  preferredCommunication: string;
  contractStartDate: string;
  renewalDate: string;
  status: string;
  paymentStatus: string;
  notes: string;
  equipmentPreferences: any[];
  rentalHistory: any[];
  communicationLogs: any[];
  renewals: any[];
}

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data States
  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Inline Form States
  const [showAddPref, setShowAddPref] = useState(false);
  const [prefForm, setPrefForm] = useState({ name: '', category: 'Cameras' });

  const [showAddRent, setShowAddRent] = useState(false);
  const [rentForm, setRentForm] = useState({ name: '', start: '', end: '', amount: '', status: 'Active' });

  const [showAddComm, setShowAddComm] = useState(false);
  const [commForm, setCommForm] = useState({ type: 'Call', date: new Date().toISOString().split('T')[0], remarks: '' });

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const loadClientDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/clients/${id}`);
      setClient(res.data);
    } catch (err) {
      console.error(err);
      triggerToast('Client details not found or inaccessible.', 'error');
      setTimeout(() => navigate('/clients'), 2000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientDetails();
  }, [id]);

  if (loading || !client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium font-sans">Retrieved Account Indexes...</span>
      </div>
    );
  }

  // Handle Equipment preference submission
  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prefForm.name) return;

    try {
      await api.post(`/clients/${id}/preferences`, {
        equipmentName: prefForm.name,
        category: prefForm.category
      });
      triggerToast('Equipment preference added.', 'success');
      setPrefForm({ name: '', category: 'Cameras' });
      setShowAddPref(false);
      loadClientDetails();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to add equipment preference.', 'error');
    }
  };

  // Handle Equipment preference deletion
  const handleDeletePreference = async (prefId: string) => {
    try {
      await api.delete(`/clients/${id}/preferences/${prefId}`);
      triggerToast('Equipment preference deleted.', 'success');
      loadClientDetails();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete equipment preference.', 'error');
    }
  };

  // Handle Rental history submission
  const handleAddRental = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, start, end, amount, status } = rentForm;
    if (!name || !start || !end || !amount) {
      alert('All rental history fields are required');
      return;
    }

    try {
      await api.post(`/clients/${id}/rental-history`, {
        equipmentName: name,
        rentalStart: start,
        rentalEnd: end,
        amount: parseFloat(amount),
        status
      });
      triggerToast('Rental history record logged successfully.', 'success');
      setRentForm({ name: '', start: '', end: '', amount: '', status: 'Active' });
      setShowAddRent(false);
      loadClientDetails();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save rental history.', 'error');
    }
  };

  // Handle Communication Log submission
  const handleAddComm = async (e: React.FormEvent) => {
    e.preventDefault();
    const { type, date, remarks } = commForm;
    if (!remarks) return;

    try {
      await api.post('/communication', {
        clientId: id,
        communicationType: type,
        communicationDate: date,
        remarks
      });
      triggerToast('Interaction log created successfully.', 'success');
      setCommForm({ type: 'Call', date: new Date().toISOString().split('T')[0], remarks: '' });
      setShowAddComm(false);
      loadClientDetails();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to log interaction.', 'error');
    }
  };

  // Categorize preferences
  const gearCategories = {
    Cameras: client.equipmentPreferences.filter(p => p.category === 'Cameras'),
    Lenses: client.equipmentPreferences.filter(p => p.category === 'Lenses'),
    Lighting: client.equipmentPreferences.filter(p => p.category === 'Lighting'),
    Audio: client.equipmentPreferences.filter(p => p.category === 'Audio Equipment'),
  };

  return (
    <div className="space-y-8">
      
      {/* Toast Alert */}
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Breadcrumb back navigation */}
      <div className="flex items-center gap-2">
        <Link to="/clients" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to CRM Directory</span>
        </Link>
      </div>

      {/* Section 1: Customer Card Overview */}
      <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 text-primary flex items-center justify-center font-extrabold text-2xl select-none shadow-md shadow-primary/5">
            {client.clientName.split(' ').map(n=>n[0]).join('')}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">{client.clientName}</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                (client.status === 'Active' || client.status === 'Expiring Soon') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                client.status === 'Expired' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                client.status === 'Suspended' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400' :
                'bg-slate-500/10 text-slate-600 dark:text-slate-400'
              }`}>
                {(client.status === 'Active' || client.status === 'Expiring Soon') ? 'Ongoing' : client.status === 'Expired' ? 'Rental Completed' : client.status}
              </span>
              
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                client.paymentStatus === 'Paid' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' :
                'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {client.paymentStatus || 'Paid'}
              </span>
            </div>
            <p className="text-xs font-bold text-primary dark:text-secondary">{client.companyName || 'Independent Creator'} • <span className="text-slate-500 dark:text-slate-400">{client.clientType}</span></p>
          </div>
        </div>

        {/* Contact info list grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2.5 gap-x-6 text-xs text-slate-600 dark:text-slate-350">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">{client.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">{client.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-semibold truncate max-w-xs">{client.address || 'No Address Logged'}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Equipment Preferences Panels */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Camera className="w-4.5 h-4.5 text-primary" />
            <span>Photography Gear Preferences</span>
          </h3>
          <button
            onClick={() => setShowAddPref(!showAddPref)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Preference</span>
          </button>
        </div>

        {/* Add Preference Inline Form */}
        {showAddPref && (
          <form onSubmit={handleAddPreference} className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-end animate-fadeIn">
            <div className="flex-grow min-w-48 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase">Model / Equipment Name</label>
              <input
                type="text"
                required
                value={prefForm.name}
                onChange={(e)=>setPrefForm(prev => ({...prev, name: e.target.value}))}
                placeholder="e.g. Sony FE 85mm f/1.2 GM"
                className="w-full h-9 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-455 uppercase">Category</label>
              <select
                value={prefForm.category}
                onChange={(e)=>setPrefForm(prev => ({...prev, category: e.target.value}))}
                className="h-9 px-2 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-700 dark:text-slate-300 font-semibold"
              >
                <option value="Cameras">Cameras</option>
                <option value="Lenses">Lenses</option>
                <option value="Lighting">Lighting</option>
                <option value="Audio Equipment">Audio Equipment</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 h-9 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark">Add</button>
              <button type="button" onClick={() => setShowAddPref(false)} className="px-3 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-350">Cancel</button>
            </div>
          </form>
        )}

        {/* Category cards container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(gearCategories) as Array<keyof typeof gearCategories>).map((catName) => {
            const list = gearCategories[catName];
            return (
              <div key={catName} className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[140px]">
                <div className="border-b border-slate-150 dark:border-slate-800/30 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">{catName}</h4>
                </div>
                <div className="mt-3 flex-grow space-y-2">
                  {list.length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-medium italic">No models registered.</span>
                  ) : (
                    list.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="truncate max-w-[85%]">{item.equipmentName}</span>
                        <button
                          onClick={() => handleDeletePreference(item.id)}
                          className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Rental History vs Interaction timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rental History Panel */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-2 flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/30 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-primary" />
              <span>Rental History & Contracts</span>
            </h3>
            <button
              onClick={() => setShowAddRent(!showAddRent)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold rounded-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Contract</span>
            </button>
          </div>

          {/* Add Rental history form */}
          {showAddRent && (
            <form onSubmit={handleAddRental} className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl space-y-4 text-xs animate-slideDown">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="font-bold text-slate-400">Equipment Name / Contract Package *</label>
                  <input type="text" required placeholder="Sony FX6 Package Bundle" value={rentForm.name} onChange={(e)=>setRentForm(prev=>({...prev, name: e.target.value}))} className="w-full h-8.5 px-3 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="font-bold text-slate-400">Start Date *</label>
                  <input type="date" required value={rentForm.start} onChange={(e)=>setRentForm(prev=>({...prev, start: e.target.value}))} className="w-full h-8.5 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="font-bold text-slate-400">End Date *</label>
                  <input type="date" required value={rentForm.end} onChange={(e)=>setRentForm(prev=>({...prev, end: e.target.value}))} className="w-full h-8.5 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="font-bold text-slate-400">Total Value (₹) *</label>
                  <input type="number" required placeholder="5400" value={rentForm.amount} onChange={(e)=>setRentForm(prev=>({...prev, amount: e.target.value}))} className="w-full h-8.5 px-3 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <label className="font-bold text-slate-400">Rental Status</label>
                  <select value={rentForm.status} onChange={(e)=>setRentForm(prev=>({...prev, status: e.target.value}))} className="w-full h-8.5 px-2 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none font-semibold text-slate-700 dark:text-slate-350">
                    <option value="Active">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="submit" className="px-4 py-1.5 bg-primary text-white rounded font-semibold">Save</button>
                <button type="button" onClick={()=>setShowAddRent(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded font-semibold">Cancel</button>
              </div>
            </form>
          )}

          {/* Rental history items */}
          <div className="space-y-3 flex-grow overflow-y-auto max-h-[350px] pr-1">
            {client.rentalHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">No historical agreements found.</div>
            ) : (
              client.rentalHistory.map((rent) => (
                <div key={rent.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/10 rounded-xl">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{rent.equipmentName}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{rent.rentalStart.split('T')[0]} to {rent.rentalEnd.split('T')[0]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">₹{rent.amount.toLocaleString('en-IN')}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      rent.status === 'Completed' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                      rent.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {rent.status === 'Active' ? 'Ongoing' : rent.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Interaction/Communication Logs Panel */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-1 flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/30 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-primary" />
              <span>Communication History</span>
            </h3>
            <button
              onClick={() => setShowAddComm(!showAddComm)}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-800"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Interaction Log Inline Form */}
          {showAddComm && (
            <form onSubmit={handleAddComm} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-800/40 rounded-xl space-y-3 text-xs animate-slideDown">
              <div className="flex gap-2">
                <select value={commForm.type} onChange={(e)=>setCommForm(prev=>({...prev, type: e.target.value}))} className="w-1/2 h-8 px-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 font-semibold">
                  <option value="Call">Direct Call</option>
                  <option value="Email">Email Message</option>
                  <option value="WhatsApp">WhatsApp Message</option>
                </select>
                <input type="date" required value={commForm.date} onChange={(e)=>setCommForm(prev=>({...prev, date: e.target.value}))} className="w-1/2 h-8 px-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 font-semibold" />
              </div>
              <textarea required rows={2.5} placeholder="Write log remarks..." value={commForm.remarks} onChange={(e)=>setCommForm(prev=>({...prev, remarks: e.target.value}))} className="w-full p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 focus:outline-none" />
              <div className="flex gap-2 justify-end">
                <button type="submit" className="px-3 py-1 bg-primary text-white rounded font-semibold">Log</button>
                <button type="button" onClick={()=>setShowAddComm(false)} className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-650 dark:text-slate-350 rounded font-semibold">Cancel</button>
              </div>
            </form>
          )}

          {/* Timeline listing */}
          <div className="space-y-4 flex-grow overflow-y-auto max-h-[350px] pr-1 select-none relative">
            <div className="absolute left-[13px] top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-slate-800" />
            
            {client.communicationLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 italic">No communication logs recorded.</div>
            ) : (
              client.communicationLogs.map((log) => (
                <div key={log.id} className="relative flex gap-4 pl-7 text-xs">
                  <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm ${
                    log.communicationType === 'Call' ? 'bg-blue-500' :
                    log.communicationType === 'Email' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}>
                    {log.communicationType === 'Call' ? '📞' : log.communicationType === 'Email' ? '✉️' : '💬'}
                  </div>
                  
                  <div className="flex flex-col gap-0.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/10 rounded-xl p-3 flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{log.communicationType} Log</span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-500">{new Date(log.communicationDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{log.remarks}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Section 4: Renewal Timeline history */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/30 pb-3 mb-4">
          <FileClock className="w-4.5 h-4.5 text-primary" />
          <span>Agreement Renewal Lifespans</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {client.renewals.length === 0 ? (
            <div className="col-span-4 p-4 text-center text-xs text-slate-400 italic">No renewal lifecycle items available.</div>
          ) : (
            client.renewals.map((r, idx) => (
              <div key={r.id} className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/10 rounded-2xl flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Renewal Cycle {idx + 1}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    r.alertStatus === 'Red' ? 'bg-red-500' :
                    r.alertStatus === 'Orange' ? 'bg-amber-500' :
                    r.alertStatus === 'Yellow' ? 'bg-yellow-400' :
                    'bg-emerald-500'
                  }`} />
                </div>
                <div className="mt-3">
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Expiry: {new Date(r.renewalDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-400 mt-1 font-bold">
                    {r.renewalStatus === 'Pending' ? <Clock className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    <span>{r.renewalStatus === 'Pending' ? 'Ongoing' : r.renewalStatus}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
