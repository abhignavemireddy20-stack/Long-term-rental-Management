import React, { useState, useEffect, useCallback } from 'react';

import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Activity, 
  Camera, 
  IndianRupee,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CalendarDays,
  RefreshCcw
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  RadialLinearScale,
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import api from '../utils/api';
import { Toast, type ToastType } from '../components/Toast';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  RadialLinearScale,
  Tooltip, 
  Legend, 
  Filler
);

interface AnalyticsData {
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

export const Reports: React.FC = () => {
  
  // Data States
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [timeFilter, setTimeFilter] = useState('Monthly'); // Daily, Weekly, Monthly, Yearly
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Toast States
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  const loadAnalytics = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const activeRef = localStorage.getItem('sd_digitals_reference_date') || '';
      const res = await api.get(`/analytics`, {
        params: {
          referenceDate: activeRef,
          filterRange: showCustomRange ? 'Custom' : timeFilter,
          customStart: showCustomRange ? customStart : '',
          customEnd: showCustomRange ? customEnd : ''
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to compile reports summaries.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter, showCustomRange, customStart, customEnd]);

  useEffect(() => {
    // Only auto-load for non-custom ranges
    if (!showCustomRange) {
      loadAnalytics();
    }
  }, [timeFilter, showCustomRange]);

  // Auto-trigger when both custom dates are filled
  useEffect(() => {
    if (showCustomRange && customStart && customEnd && customEnd >= customStart) {
      loadAnalytics();
    }
  }, [customStart, customEnd, showCustomRange]);

  const getRevenueLabel = () => {
    if (showCustomRange) return 'Custom Period';
    return timeFilter;
  };

  const getRevenueKey = () => {
    if (showCustomRange) return 'Period';
    switch (timeFilter) {
      case 'Daily': return 'Daily';
      case 'Weekly': return 'Weekly';
      case 'Yearly': return 'Annual';
      default: return 'Monthly';
    }
  };

  // Export full detailed analytics reports as CSV
  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Report Metric', 'Summary / Details'];
    const rows = [
      ['Total Partnerships Indexed', data.kpis.totalClients],
      ['Ongoing Leases', data.kpis.activeClients],
      ['Expiring Next 30 Days', data.kpis.expiringSoon],
      ['Rental Completed', data.kpis.expiredContracts],
      [`Projected ${getRevenueLabel()} Revenue`, `₹${data.kpis.monthlyRevenue.toLocaleString('en-IN')}`],
      ['Top Gear Requested', data.charts.topGear[0]?.name || 'N/A'],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `SD_Digitals_Detailed_Reports_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV Report triggered successfully.', 'success');
  };

  // Excel HTML Export wrapper
  const handleExportExcel = () => {
    if (!data) return;
    let excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>SD Digitals Reports</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>
      <h2>SD Digitals Business Metrics Overview</h2>
      <table border="1">
        <tr style="background-color:#2563EB; color:white; font-weight:bold;">
          <td>Business KPI Metrics</td><td>Values</td>
        </tr>
        <tr><td>Total Registered Clients</td><td>${data.kpis.totalClients}</td></tr>
        <tr><td>Ongoing Rental Leases</td><td>${data.kpis.activeClients}</td></tr>
        <tr><td>Warnings (30 days remaining)</td><td>${data.kpis.expiringSoon}</td></tr>
        <tr><td>Completed Rentals Queue</td><td>${data.kpis.expiredContracts}</td></tr>
        <tr><td>Cumulative ${getRevenueLabel()} Revenue Rate</td><td>₹${data.kpis.monthlyRevenue.toLocaleString('en-IN')}</td></tr>
      </table>
      
      <br/>
      <h2>Client Category Share</h2>
      <table border="1">
        <tr style="background-color:#06B6D4; color:white; font-weight:bold;">
          <td>Segment Name</td><td>Clients Count</td>
        </tr>`;

    data.charts.typeDistribution.forEach(t => {
      excelTemplate += `<tr><td>${t.type}</td><td>${t.count}</td></tr>`;
    });

    excelTemplate += `</table></body></html>`;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SD_Digitals_Business_Analytics_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Excel Report sheet downloaded.', 'success');
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium font-sans">Compiling Business Analytics Charts...</span>
      </div>
    );
  }

  // KPI Cards config
  const kpiCards = [
    {
      title: 'Total Clients',
      value: data.kpis.totalClients,
      icon: <Users className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/15',
      sub: 'In filter period',
      trendUp: true
    },
    {
      title: 'Ongoing Leases',
      value: data.kpis.activeClients,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15',
      sub: 'Active + Expiring',
      trendUp: true
    },
    {
      title: 'Expiring Soon',
      value: data.kpis.expiringSoon,
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/15',
      sub: 'Next 30 days',
      trendUp: false
    },
    {
      title: 'Rental Completed',
      value: data.kpis.expiredContracts,
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      color: 'bg-red-500/10 text-red-600 border-red-500/15',
      sub: 'Requires follow-up',
      trendUp: false
    },
    {
      title: `${getRevenueKey()} Revenue`,
      value: `₹${data.kpis.monthlyRevenue.toLocaleString('en-IN')}`,
      icon: <IndianRupee className="w-5 h-5 text-cyan-500" />,
      color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/15',
      sub: `Projected ${getRevenueLabel()}`,
      trendUp: true
    }
  ];

  // Chart configs
  const lineGrowthData = {
    labels: data.charts.signupGrowth.map(g => g.month),
    datasets: [{
      label: 'Cumulative Client Partnerships',
      data: data.charts.signupGrowth.map(g => g.cumulativeClients),
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      fill: true,
      tension: 0.35,
      borderWidth: 3,
      pointBackgroundColor: '#2563EB',
    }]
  };

  const barTypeData = {
    labels: data.charts.typeDistribution.map(t => t.type),
    datasets: [{
      label: 'Clients Count',
      data: data.charts.typeDistribution.map(t => t.count),
      backgroundColor: [
        'rgba(37, 99, 235, 0.75)', // Blue
        'rgba(6, 182, 212, 0.75)', // Cyan
        'rgba(245, 158, 11, 0.75)', // Amber
        'rgba(16, 185, 129, 0.75)', // Emerald
        'rgba(139, 92, 246, 0.75)', // Violet
        'rgba(100, 116, 139, 0.75)', // Slate
      ],
      borderRadius: 6,
    }]
  };

  const doughnutData = {
    labels: data.charts.statusSplit.map(s => s.status === 'Active' ? 'Ongoing' : s.status === 'Expired' ? 'Rental Completed' : s.status),
    datasets: [{
      data: data.charts.statusSplit.map(s => s.count),
      backgroundColor: data.charts.statusSplit.map(s => s.color),
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const lineRevenueRunwayData = {
    labels: data.charts.revenueRunwayDecay.map(r => r.month),
    datasets: [{
      label: `Ongoing ${getRevenueLabel()} Revenue Runway (₹)`,
      data: data.charts.revenueRunwayDecay.map(r => r.projectedRevenue),
      borderColor: '#06B6D4',
      backgroundColor: 'rgba(6, 182, 212, 0.08)',
      fill: true,
      tension: 0.35,
      borderWidth: 3,
      pointBackgroundColor: '#06B6D4',
    }]
  };

  const radarGearData = {
    labels: data.charts.equipmentUtilization.map(eq => eq.category),
    datasets: [{
      label: 'Preference Frequency',
      data: data.charts.equipmentUtilization.map(eq => eq.count),
      backgroundColor: 'rgba(37, 99, 235, 0.15)',
      borderColor: '#2563EB',
      borderWidth: 2,
      pointBackgroundColor: '#2563EB',
    }]
  };

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Header title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Reports & Business Analytics</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Business health reviews, projected lease runways, and category distribution charts.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-1.5 px-3 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative group">
            <button className="flex items-center justify-center gap-1.5 px-4 h-9 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-lg shadow-md shadow-primary/10">
              <Download className="w-4 h-4" />
              <span>Export PDF/Excel</span>
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-xl hidden group-hover:block overflow-hidden z-50">
              <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Export CSV</span>
              </button>
              <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800/30 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span>Export Excel</span>
              </button>
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                <span>Print PDF Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Date Filtering bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-1 bg-slate-150/50 dark:bg-slate-800/50 p-1 rounded-lg select-none">
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeFilter(range);
                setShowCustomRange(false);
              }}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                timeFilter === range && !showCustomRange
                  ? 'bg-white dark:bg-slate-900 text-primary dark:text-secondary shadow-sm shadow-black/5'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            onClick={() => setShowCustomRange(true)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              showCustomRange
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-secondary shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Custom Range
          </button>
        </div>

        {showCustomRange && (
          <div className="flex gap-2 items-center text-xs animate-fadeIn">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200"
            />
            <span className="text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={() => loadAnalytics(true)}
              disabled={!customStart || !customEnd || refreshing}
              className="px-3.5 py-1 bg-primary text-white font-semibold rounded hover:bg-primary-dark disabled:opacity-40"
            >
              {refreshing ? 'Loading...' : 'Filter'}
            </button>
          </div>
        )}

        {/* Active filter badge */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {showCustomRange ? (customStart && customEnd ? `${customStart} → ${customEnd}` : 'Select dates') : `${timeFilter} View`}
          </span>
          {refreshing && <span className="text-slate-400 animate-pulse">Updating...</span>}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            className="glass-card p-4 rounded-2xl flex flex-col gap-3 hover:shadow-lg transition-all"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${card.color.split(' ')[0]} ${card.color.split(' ')[2]}`}>
              {card.icon}
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
                {card.value}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">
                {card.title}
              </div>
              <div className={`text-[10px] font-semibold mt-1 ${card.trendUp ? 'text-emerald-500' : 'text-amber-500'}`}>
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts layouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Monthly client growth */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Customer Signups & Partnerships Growth ({getRevenueLabel()})</span>
          </h3>
          <div className="h-60">
            <Line
              data={lineGrowthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { ticks: { precision: 0 } }
                }
              }}
            />
          </div>
        </div>

        {/* Doughnut: Active vs Expired Status */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-secondary" />
            <span>Contract Status Breakdown</span>
          </h3>
          <div className="h-60 flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10 } }
                },
                cutout: '70%'
              }}
            />
          </div>
        </div>

        {/* Bar: Client Type Distribution */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Partner Client Segments</span>
          </h3>
          <div className="h-60">
            <Bar
              data={barTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { ticks: { precision: 0 } }
                }
              }}
            />
          </div>
        </div>

        {/* Line Area: Decaying revenue runway */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-cyan-500" />
            <span>Projected Decaying {getRevenueLabel()} Revenue Runway (No Renewals)</span>
          </h3>
          <div className="h-60">
            <Line
              data={lineRevenueRunwayData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        {/* Radar: Equipment Category Utilization */}
        <div className="glass-card p-6 rounded-3xl lg:col-span-1">
          <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-primary" />
            <span>Equipment Preference Categories</span>
          </h3>
          <div className="h-60 flex items-center justify-center">
            <Radar
              data={radarGearData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    ticks: { display: false }
                  }
                }
              }}
            />
          </div>
        </div>

      </div>

      {/* Top 5 Gear popularity table */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-secondary animate-pulse" />
          <span>SD Digitals Top 5 Most Requested Equipment Models</span>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{getRevenueLabel()} Period</span>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 select-none">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Model / Product Name</th>
                <th className="pb-3 text-center">Rental Preference Counts</th>
                <th className="pb-3 text-right">Rentals Rate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs text-slate-700 dark:text-slate-350">
              {data.charts.topGear.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">No equipment preferences found for this period.</td>
                </tr>
              ) : (
                data.charts.topGear.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/20">
                    <td className="py-3 font-bold text-slate-400 text-sm">#{idx + 1}</td>
                    <td className="py-3 font-bold text-slate-800 dark:text-slate-200">{item.name}</td>
                    <td className="py-3 text-center font-extrabold">{item.count} Accounts</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        idx === 0 ? 'bg-amber-500/10 text-amber-600' :
                        idx <= 2 ? 'bg-emerald-500/10 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {idx === 0 ? '🔥 Top Demand' : idx <= 2 ? 'High Demand' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
