import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import api from '../utils/api';
import { Toast, type ToastType } from '../components/Toast';

interface Client {
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
}

export const Clients: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Core Data States
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);

  // Search, Filter, Sort States
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('clientName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form Drawer Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Auto Save draft key
  const DRAFT_KEY = 'sd_digitals_client_form_draft';

  // Form Fields
  const [formFields, setFormFields] = useState({
    clientName: '',
    companyName: '',
    clientType: 'Production House',
    phone: '',
    email: '',
    address: '',
    whatsapp: false,
    emailComm: false,
    phoneCall: false,
    rate: '',
    contractStartDate: '',
    renewalDate: '',
    status: 'Active',
    paymentStatus: 'Paid',
    notes: '',
    equipName: '',
    equipCategory: 'Cameras'
  });

  // Validation / Success Shake States
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [showToast, setShowToast] = useState(false);

  // Deletion confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  // Helper to calculate status in real time in the form
  const getFormStatus = () => {
    if (isEdit && (formFields.status === 'Suspended' || formFields.status === 'Inactive')) {
      return formFields.status; // Preserve manual overrides on edit
    }
    if (!formFields.contractStartDate || !formFields.renewalDate) return 'Active';
    
    const refDateStr = localStorage.getItem('sd_digitals_reference_date') || new Date().toISOString().split('T')[0];
    const ref = new Date(refDateStr);
    ref.setHours(0,0,0,0);
    
    const expiry = new Date(formFields.renewalDate);
    expiry.setHours(0,0,0,0);
    
    const diffTime = expiry.getTime() - ref.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    return 'Active';
  };

  // Fetch clients from backend
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients', {
        params: {
          search,
          type: typeFilter,
          status: statusFilter,
          sortBy,
          sortOrder,
          page,
          limit
        }
      });
      setClients(res.data.clients);
      setTotal(res.data.pagination.total);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load clients records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, typeFilter, statusFilter, sortBy, sortOrder, page]);

  // Handle slide-over drawer triggers from queries (e.g. ?add=true)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setIsOpen(true);
      setIsEdit(false);
      // Clean query parameter after trigger
      navigate('/clients', { replace: true });
    }
  }, [location.search]);

  // Load Auto-Saved Draft on Drawer Open
  useEffect(() => {
    if (isOpen && !isEdit) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormFields(parsed);
          triggerToast('Draft form restored successfully.', 'info');
        } catch (e) {
          console.error('Failed to parse draft details', e);
        }
      }
    }
  }, [isOpen, isEdit]);

  // Auto-Save Draft to LocalStorage when form inputs change
  useEffect(() => {
    if (isOpen && !isEdit) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formFields));
    }
  }, [formFields, isOpen, isEdit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (value !== numericValue) {
        setFormError('Phone number must contain only numbers.');
      } else {
        if (formError === 'Phone number must contain only numbers.') {
          setFormError(null);
        }
      }
      setFormFields(prev => ({ ...prev, [name]: numericValue }));
      return;
    }
    setFormFields(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormFields(prev => ({ ...prev, [name]: checked }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const resetForm = () => {
    setFormFields({
      clientName: '',
      companyName: '',
      clientType: 'Production House',
      phone: '',
      email: '',
      address: '',
      whatsapp: false,
      emailComm: false,
      phoneCall: false,
      rate: '',
      contractStartDate: '',
      renewalDate: '',
      status: 'Active',
      paymentStatus: 'Paid',
      notes: '',
      equipName: '',
      equipCategory: 'Cameras'
    });
    setFormError(null);
    setEditId(null);
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleOpenAddDrawer = () => {
    resetForm();
    setIsEdit(false);
    setIsOpen(true);
  };

  const handleOpenEditDrawer = (client: Client) => {
    setIsEdit(true);
    setEditId(client.id);
    setFormError(null);
    
    // Parse communications
    const comms = client.preferredCommunication || '';
    
    // Fallback search rates
    const activeRate = client.notes.match(/[\$₹]([0-9,]+)/)?.[1]?.replace(',','') || '1500';

    setFormFields({
      clientName: client.clientName,
      companyName: client.companyName || '',
      clientType: client.clientType,
      phone: client.phone,
      email: client.email,
      address: client.address || '',
      whatsapp: comms.includes('WhatsApp'),
      emailComm: comms.includes('Email'),
      phoneCall: comms.includes('Phone Call'),
      rate: activeRate,
      contractStartDate: client.contractStartDate ? client.contractStartDate.split('T')[0] : '',
      renewalDate: client.renewalDate ? client.renewalDate.split('T')[0] : '',
      status: client.status,
      paymentStatus: client.paymentStatus || 'Paid',
      notes: client.notes || '',
      equipName: client.equipmentPreferences?.[0]?.equipmentName || '',
      equipCategory: client.equipmentPreferences?.[0]?.category || 'Cameras'
    });
    setIsOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate fields
    const { clientName, email, phone, contractStartDate, renewalDate, rate } = formFields;
    if (!clientName || !email || !phone || !contractStartDate || !renewalDate) {
      triggerFormShake('Please fill out all mandatory fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      triggerFormShake('Please enter a valid email.');
      return;
    }

    const phoneRegex = /^[0-9]+$/;
    if (!phoneRegex.test(phone)) {
      triggerFormShake('Phone number must contain only numbers.');
      return;
    }

    if (new Date(renewalDate) < new Date(contractStartDate)) {
      triggerFormShake('Renewal date cannot be earlier than start date.');
      return;
    }

    // Assemble payload
    const commsArr = [];
    if (formFields.whatsapp) commsArr.push('WhatsApp');
    if (formFields.emailComm) commsArr.push('Email');
    if (formFields.phoneCall) commsArr.push('Phone Call');
    const preferredCommunication = commsArr.join(', ') || 'Email';

    const equipmentPreferences = formFields.equipName 
      ? [{ equipmentName: formFields.equipName, category: formFields.equipCategory }]
      : [];

    const rentalHistory = formFields.equipName
      ? [{
          equipmentName: formFields.equipName,
          rentalStart: new Date(contractStartDate),
          rentalEnd: new Date(renewalDate),
          amount: parseFloat(rate) || 1200.0,
          status: 'Active'
        }]
      : [];

    const payload = {
      clientName,
      companyName: formFields.companyName,
      email,
      phone,
      clientType: formFields.clientType,
      address: formFields.address,
      preferredCommunication,
      contractStartDate,
      renewalDate,
      status: getFormStatus(),
      paymentStatus: formFields.paymentStatus,
      notes: formFields.notes,
      equipmentPreferences,
      rentalHistory
    };

    try {
      if (isEdit && editId) {
        await api.put(`/clients/${editId}`, payload);
        triggerToast('Client record updated successfully!', 'success');
      } else {
        await api.post('/clients', payload);
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 2000);
        triggerToast('Client record added successfully!', 'success');
      }
      
      resetForm();
      setIsOpen(false);
      fetchClients();
    } catch (err: any) {
      console.error(err);
      triggerFormShake(err.response?.data?.error || 'Database submission failed.');
    }
  };

  const triggerFormShake = (msg: string) => {
    setFormError(msg);
  };

  // Client Deletion Click Handler
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  // Client Deletion Handler
  const handleDeleteClient = async (id: string) => {
    try {
      await api.delete(`/clients/${id}`);
      triggerToast(`Client "${deleteTarget?.name || 'Client'}" deleted successfully.`, 'success');
      
      // If we are on a page > 1 and this deletion makes the current page empty, go back a page
      if (page > 1 && clients.length === 1) {
        setPage(prev => prev - 1);
      } else {
        fetchClients();
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.response?.data?.error || 'Deletion failed.', 'error');
    }
  };

  // CSV Export utility
  const exportToCSV = () => {
    if (clients.length === 0) return;
    
    const headers = ['Client ID', 'Client Name', 'Company', 'Client Type', 'Phone', 'Email', 'Preferred Comm', 'Expiry Date', 'Status'];
    const rows = clients.map(c => [
      c.id,
      c.clientName,
      c.companyName || 'N/A',
      c.clientType,
      c.phone,
      c.email,
      c.preferredCommunication,
      c.renewalDate.split('T')[0],
      c.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SD_Digitals_Rental_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV Export triggered successfully.', 'success');
  };

  // Excel Export utility (HTML table wrapper method opens directly in Excel)
  const exportToExcel = () => {
    if (clients.length === 0) return;

    let excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Rental Clients</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorkbook></xml><![endif]--></head>
    <body><table>
      <tr style="font-weight:bold; background-color:#2563EB; color:white;">
        <td>Client ID</td><td>Client Name</td><td>Company Name</td><td>Type</td><td>Phone</td><td>Email</td><td>Start Date</td><td>Expiry Date</td><td>Status</td>
      </tr>`;

    clients.forEach(c => {
      excelTemplate += `<tr>
        <td>${c.id}</td>
        <td>${c.clientName}</td>
        <td>${c.companyName || 'N/A'}</td>
        <td>${c.clientType}</td>
        <td>${c.phone}</td>
        <td>${c.email}</td>
        <td>${c.contractStartDate.split('T')[0]}</td>
        <td>${c.renewalDate.split('T')[0]}</td>
        <td>${c.status}</td>
      </tr>`;
    });

    excelTemplate += `</table></body></html>`;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `SD_Digitals_Clients_CRM_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Excel Export initiated successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast popup */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Clients CRM Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Add, update, and manage camera lease agreements and photography client indexes.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleOpenAddDrawer}
            className="flex items-center justify-center gap-1.5 px-4 h-9 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-lg shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] transition-all flex-grow md:flex-grow-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
          
          <div className="relative group">
            <button
              className="flex items-center justify-center gap-1.5 px-3 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-xl hidden group-hover:block overflow-hidden z-50">
              <button onClick={exportToCSV} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Export CSV</span>
              </button>
              <button onClick={exportToExcel} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800/30 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter / Search controls */}
      <div className="glass-panel dark:glass-panel p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative flex items-center col-span-1">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Name, Company, Email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-4 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 dark:focus:border-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/5 dark:focus:ring-secondary/5 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-colors"
          />
        </div>
        
        {/* Client Type */}
        <div className="flex items-center">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mr-2 uppercase tracking-wide">Type</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-full h-9 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:outline-none px-3 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Types</option>
            <option value="Production House">Production House</option>
            <option value="Wedding Photographer">Wedding Photographer</option>
            <option value="YouTuber">YouTuber</option>
            <option value="Videographer">Videographer</option>
            <option value="Event Company">Event Company</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mr-2 uppercase tracking-wide">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full h-9 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/50 border border-transparent focus:outline-none px-3 font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Ongoing</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Rental Completed</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Main client data table */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-slate-200/40 dark:border-slate-800/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/55 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800/40 text-xs font-bold text-slate-450 dark:text-slate-400 select-none">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40" onClick={() => handleSort('clientName')}>
                  <div className="flex items-center gap-1">
                    <span>Client Name</span>
                    {sortBy === 'clientName' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40" onClick={() => handleSort('companyName')}>
                  <div className="flex items-center gap-1">
                    <span>Company Name</span>
                    {sortBy === 'companyName' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="px-6 py-4">Client Type</th>
                <th className="px-6 py-4">Equipment Category</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40" onClick={() => handleSort('renewalDate')}>
                  <div className="flex items-center gap-1">
                    <span>Renewal Date</span>
                    {sortBy === 'renewalDate' && (sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                  </div>
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-350">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-slate-400 font-semibold">Pulling records database...</span>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 font-semibold">
                    No matching rental clients found.
                  </td>
                </tr>
              ) : (
                clients.map((client) => {
                  return (
                    <motion.tr
                      key={client.id}
                      whileHover={{ backgroundColor: 'rgba(37, 99, 235, 0.02)' }}
                      className="border-b border-slate-100 dark:border-slate-800/20 last:border-0"
                    >
                      <td className="px-6 py-4.5 font-bold text-slate-800 dark:text-slate-200">
                        {client.clientName}
                      </td>
                      <td className="px-6 py-4.5 font-medium">
                        {client.companyName || <span className="opacity-40 italic">Independent</span>}
                      </td>
                      <td className="px-6 py-4.5">
                        {client.clientType}
                      </td>
                      <td className="px-6 py-4.5">
                        {client.equipmentPreferences?.[0]?.category || <span className="opacity-45 italic">No Pref</span>}
                      </td>
                      <td className="px-6 py-4.5 font-semibold">
                        {new Date(client.renewalDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4.5 flex flex-wrap items-center gap-1.5">
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
                      </td>
                      <td className="px-6 py-4.5 text-right flex items-center justify-end gap-1.5 h-full">
                        <button
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-550 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditDrawer(client)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-550 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user?.role === 'Admin' && (
                          <button
                            onClick={() => handleDeleteClick(client.id, client.clientName)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-550 hover:text-red-600 dark:text-slate-450 dark:hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table pagination navigation */}
        {total > limit && (
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/40 flex justify-between items-center select-none">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing Page {page} of {Math.ceil(total / limit)} ({total} total clients)
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 transition-colors font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page === Math.ceil(total / limit)}
                onClick={() => setPage(prev => prev + 1)}
                className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 disabled:opacity-40 transition-colors font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Overlay Container (Add/Edit) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black backdrop-blur-xs"
            />

            {/* Slide Drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200/50 dark:border-slate-800/60"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-55/10 dark:bg-slate-950/20">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{isEdit ? 'Modify Client Account' : 'Register New Partner'}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{isEdit ? 'Edit properties and dates' : 'Draft autosaves automatically'}</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-650" />
                </button>
              </div>

              {/* Form Scroll Area */}
              <form onSubmit={handleFormSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
                
                {/* Error Banner */}
                {formError && (
                  <div className="flex items-center gap-2 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold text-primary tracking-widest uppercase">1. Basic Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Client Name *</label>
                      <input
                        type="text"
                        name="clientName"
                        value={formFields.clientName}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium"
                      />
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Company Name</label>
                      <input
                        type="text"
                        name="companyName"
                        value={formFields.companyName}
                        onChange={handleInputChange}
                        placeholder="Apex Productions"
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium"
                      />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Client Type *</label>
                      <select
                        name="clientType"
                        value={formFields.clientType}
                        onChange={handleInputChange}
                        className="w-full h-10 px-2 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <option value="Production House">Production House</option>
                        <option value="Wedding Photographer">Wedding Photographer</option>
                        <option value="YouTuber">YouTuber</option>
                        <option value="Videographer">Videographer</option>
                        <option value="Event Company">Event Company</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold text-primary tracking-widest uppercase">2. Contact & Communication</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formFields.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john@example.com"
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium"
                      />
                    </div>
                    
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Phone Number *</label>
                      <input
                        type="text"
                        name="phone"
                        value={formFields.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+1 (555) 012-3456"
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium"
                      />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Physical Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formFields.address}
                        onChange={handleInputChange}
                        placeholder="123 Creative Studio Dr, LA"
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium"
                      />
                    </div>

                    {/* Preferences Checkboxes */}
                    <div className="col-span-2 space-y-2">
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">Communication Preference Channels</label>
                      <div className="flex flex-wrap gap-4 text-xs font-semibold select-none">
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
                          <input type="checkbox" name="whatsapp" checked={formFields.whatsapp} onChange={handleCheckboxChange} className="rounded border-slate-300 dark:border-slate-800 text-primary focus:ring-primary" />
                          <span>WhatsApp</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
                          <input type="checkbox" name="emailComm" checked={formFields.emailComm} onChange={handleCheckboxChange} className="rounded border-slate-300 dark:border-slate-800 text-primary focus:ring-primary" />
                          <span>Email Notification</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-350">
                          <input type="checkbox" name="phoneCall" checked={formFields.phoneCall} onChange={handleCheckboxChange} className="rounded border-slate-300 dark:border-slate-800 text-primary focus:ring-primary" />
                          <span>Direct Call</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Rental Contract Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-extrabold text-primary tracking-widest uppercase">3. Rental Contract Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Monthly Lease Value (₹) *</label>
                      <input
                        type="number"
                        name="rate"
                        value={formFields.rate}
                        onChange={handleInputChange}
                        placeholder="1800"
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Payment Status *</label>
                      <select
                        name="paymentStatus"
                        value={formFields.paymentStatus}
                        onChange={handleInputChange}
                        className="w-full h-10 px-2 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-700 dark:text-slate-350 font-semibold"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400">Status Badge (Automated)</label>
                      <div className="flex items-center h-10 px-3 bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 rounded-lg text-xs font-bold select-none">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          getFormStatus() === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                          getFormStatus() === 'Expired' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          getFormStatus() === 'Suspended' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-455' :
                          getFormStatus() === 'Inactive' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-455' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {getFormStatus() === 'Active' ? 'Ongoing' : 
                           getFormStatus() === 'Expired' ? 'Rental Completed' : 
                           getFormStatus()}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Contract Start *</span>
                      </label>
                      <input
                        type="date"
                        name="contractStartDate"
                        value={formFields.contractStartDate}
                        onChange={handleInputChange}
                        required
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-semibold"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                        <span>Renewal Expiry *</span>
                      </label>
                      <input
                        type="date"
                        name="renewalDate"
                        value={formFields.renewalDate}
                        onChange={handleInputChange}
                        required
                        className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Equipment Preferences */}
                {!isEdit && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-extrabold text-primary tracking-widest uppercase">4. Initial Equipment Assignment</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400">Equipment Type</label>
                        <select
                          name="equipCategory"
                          value={formFields.equipCategory}
                          onChange={handleInputChange}
                          className="w-full h-10 px-2 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:outline-none text-slate-700 dark:text-slate-300 font-semibold"
                        >
                          <option value="Cameras">Cameras</option>
                          <option value="Lenses">Lenses</option>
                          <option value="Lighting">Lighting</option>
                          <option value="Audio Equipment">Audio Equipment</option>
                        </select>
                      </div>

                      <div className="col-span-2 sm:col-span-1 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400">Model Name</label>
                        <input
                          type="text"
                          name="equipName"
                          value={formFields.equipName}
                          onChange={handleInputChange}
                          placeholder="Arri Alexa Mini LF"
                          className="w-full h-10 px-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 5: Remarks / Notes */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400">Internal Accounts Remarks</label>
                  <textarea
                    name="notes"
                    value={formFields.notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Enter gear specs, custom rates discount, delivery coordinates..."
                    className="w-full p-3 rounded-lg text-xs bg-slate-100/50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800/40 focus:border-primary focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200 transition-all font-medium leading-relaxed"
                  />
                </div>

              </form>

              {/* Bottom Actions Drawer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-55/10 dark:bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFormSubmit}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center min-w-28"
                >
                  {isSuccess ? (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Completed!</span>
                    </motion.div>
                  ) : (
                    <span>{isEdit ? 'Update Details' : 'Register Account'}</span>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="glass-card max-w-sm w-full mx-4 p-6 rounded-3xl border border-white/10 dark:border-white/5 bg-white dark:bg-slate-900 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Delete Client Account?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">{deleteTarget.name}</strong> and all associated history/renewals? This action is permanent.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  handleDeleteClient(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="px-4 h-9 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all active:scale-[0.97] cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 h-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
