import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  IndianRupee, 
  Plus, 
  FileSpreadsheet, 
  BellRing,
  Activity,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../utils/api';
import { useRealtime } from '../hooks/useRealtime';
import { LiveIndicator } from '../components/LiveIndicator';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface DashboardStats {
  kpis: {
    totalClients: number;
    activeClients: number;
    expiringSoon: number;
    expiredContracts: number;
    monthlyRevenue: number;
  };
  charts: {
    signupGrowth: any[];
    typeDistribution: any[];
    statusSplit: any[];
    projectedExpirations: any[];
    revenueRunwayDecay: any[];
    equipmentUtilization: any[];
    topGear: any[];
  };
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [recentAudits, setRecentAudits] = useState<any[]>([]);

  const activeRefDate = localStorage.getItem('sd_digitals_reference_date') || '';

  // Real-time analytics from Supabase (auto-refreshes every 15s)
  const { data: stats, loading, refresh: refreshStats, lastUpdated } = useRealtime<DashboardStats>({
    url: '/analytics',
    params: { referenceDate: activeRefDate },
    intervalMs: 15000,
  });

  const fetchSideData = async () => {
    try {
      const [clientsRes, auditsRes] = await Promise.all([
        api.get('/clients?limit=5'),
        user?.role === 'Admin' ? api.get('/logs') : Promise.resolve({ data: [] })
      ]);
      setRecentClients(clientsRes.data.clients);
      setRecentAudits(auditsRes.data);
    } catch (err) {
      console.error('Failed to load side data', err);
    }
  };

  useEffect(() => {
    fetchSideData();
    const interval = setInterval(fetchSideData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium">Assembling Dashboard Widgets...</span>
      </div>
    );
  }

  const kpis = stats.kpis;

  // Chart configuration
  const doughnutData = {
    labels: stats.charts.statusSplit.map(s => s.status === 'Active' ? 'Ongoing' : s.status === 'Expired' ? 'Rental Completed' : s.status),
    datasets: [{
      data: stats.charts.statusSplit.map(s => s.count),
      backgroundColor: stats.charts.statusSplit.map(s => s.color),
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const barData = {
    labels: stats.charts.projectedExpirations.map(e => e.month),
    datasets: [{
      label: 'Expirations',
      data: stats.charts.projectedExpirations.map(e => e.count),
      backgroundColor: 'rgba(37, 99, 235, 0.7)',
      borderRadius: 6,
    }]
  };

  const kpiConfig = [
    {
      title: 'Total Clients',
      value: kpis.totalClients,
      icon: <Users className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/15',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Ongoing Clients',
      value: kpis.activeClients,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15',
      trend: '94% Ongoing',
      trendUp: true
    },
    {
      title: 'Expiring Soon',
      value: kpis.expiringSoon,
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/15',
      trend: 'Next 30 Days',
      trendUp: false
    },
    {
      title: 'Rental Completed',
      value: kpis.expiredContracts,
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      color: 'bg-red-500/10 text-red-600 border-red-500/15',
      trend: 'Requires Action',
      trendUp: false
    },
    {
      title: 'Monthly Revenue',
      value: `₹${kpis.monthlyRevenue.toLocaleString('en-IN')}`,
      icon: <IndianRupee className="w-5 h-5 text-cyan-500" />,
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/15',
      trend: '+4.5% Growth',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Intro Greetings */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">SD Digitals CRM Dashboard</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hello {user?.name}, here is the current status of your long-term rental accounts.</p>
            <LiveIndicator lastUpdated={lastUpdated} onRefresh={refreshStats} />
          </div>
        </div>
        
        {/* Quick Actions Header */}
        <div className="flex gap-2">
          <Link
            to="/clients?add=true"
            className="flex items-center gap-1.5 px-4 h-9 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-lg shadow-md shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </Link>
          <Link
            to="/reports"
            className="flex items-center gap-1.5 px-4 h-9 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:scale-[1.02] transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Generate Report</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiConfig.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ y: -4 }}
            className="glass-card hover:glow-primary p-5 rounded-2xl flex flex-col justify-between transition-all-custom duration-250 cursor-default"
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl border ${card.color.split(' ')[0]} ${card.color.split(' ')[2]}`}>
                {card.icon}
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                card.trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {card.trend}
              </span>
            </div>
            
            <div className="mt-4">
              <span className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                {card.value}
              </span>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
                {card.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Client Status Doughnut */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-1 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Activity className="w-4.5 h-4.5 text-primary" />
            <span>Client Expiry Status</span>
          </h3>
          <div className="relative flex-grow flex items-center justify-center h-48 lg:h-52">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 10,
                      font: { size: 10, weight: 'bold' },
                      padding: 10,
                    }
                  }
                },
                cutout: '65%'
              }}
            />
          </div>
        </div>

        {/* Expirations Bar Chart */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <BellRing className="w-4.5 h-4.5 text-secondary" />
            <span>Projected Expirations (6 Months)</span>
          </h3>
          <div className="flex-grow h-48 lg:h-52">
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    ticks: { precision: 0, font: { size: 9 } }
                  },
                  x: {
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </div>
        </div>

      </div>

      {/* Widgets & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Clients added list */}
        <div className="glass-card p-6 rounded-3xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Customers & Partners</h3>
            <Link to="/clients" className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1">
              <span>View CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="divide-y divide-slate-150 dark:divide-slate-800/40">
            {recentClients.map((client) => (
              <div key={client.id} className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                    {client.clientName.split(' ').map((n:any)=>n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{client.clientName}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{client.companyName || 'Independent'}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    (client.status === 'Active' || client.status === 'Expiring Soon') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    client.status === 'Expired' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                    'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                  }`}>
                    {(client.status === 'Active' || client.status === 'Expiring Soon') ? 'Ongoing' : client.status === 'Expired' ? 'Rental Completed' : client.status}
                  </span>
                  <Link
                    to={`/clients/${client.id}`}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audits (Admin only) / Recent Activity list */}
        <div className="glass-card p-6 rounded-3xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>{user?.role === 'Admin' ? 'Admin Security Audit Log' : 'Internal Operation Logs'}</span>
            </h3>
            {user?.role === 'Admin' && (
              <Link to="/audit-logs" className="text-xs font-bold text-red-500 hover:underline">
                View Security Log
              </Link>
            )}
          </div>

          <div className="space-y-3 flex-grow overflow-y-auto max-h-[280px]">
            {user?.role !== 'Admin' ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-slate-400">
                🔒 Full system audit trails are restricted to authorized administrators.
              </div>
            ) : recentAudits.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No system log records found.
              </div>
            ) : (
              recentAudits.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-3 text-xs border-b border-slate-100 dark:border-slate-800/40 pb-2.5 last:border-0">
                  <div className="mt-0.5 w-6 h-6 rounded bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500">
                    ⚙️
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{log.action}</span>
                    <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-bold text-slate-500">{log.user?.name} ({log.user?.role})</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
