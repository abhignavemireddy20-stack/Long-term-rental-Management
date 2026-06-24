import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays
} from 'lucide-react';
import api from '../utils/api';
import { Toast, type ToastType } from '../components/Toast';

interface CalendarEvent {
  clientId: string;
  clientName: string;
  companyName: string;
  dateStr: string; // YYYY-MM-DD
  type: 'renewal' | 'followup' | 'expiry';
  status: string; // Red, Orange, Yellow, Green
  title: string;
}

export const Calendar: React.FC = () => {
  const navigate = useNavigate();

  // Date States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      const activeRefDate = localStorage.getItem('sd_digitals_reference_date') || '';
      
      // Fetch renewals to map events
      const [renewalsRes] = await Promise.all([
        api.get(`/renewals?referenceDate=${activeRefDate}`),
      ]);

      const calendarEventsList: CalendarEvent[] = [];

      // 1. Expirations & Renewals
      renewalsRes.data.alerts.forEach((alert: any) => {
        const renewalDateStr = alert.renewalDate.split('T')[0];
        
        calendarEventsList.push({
          clientId: alert.id,
          clientName: alert.clientName,
          companyName: alert.companyName,
          dateStr: renewalDateStr,
          type: alert.analysis.daysRemaining < 0 ? 'expiry' : 'renewal',
          status: alert.analysis.alertStatus,
          title: `${alert.analysis.label}: ${alert.clientName}`
        });

        // 2. Mock Follow-ups (say, 5 days prior to Expiry)
        const expiryDate = new Date(alert.renewalDate);
        const followupDate = new Date(expiryDate);
        followupDate.setDate(expiryDate.getDate() - 5);
        const followupDateStr = followupDate.toISOString().split('T')[0];

        if (alert.analysis.daysRemaining >= 0 && alert.analysis.daysRemaining <= 30) {
          calendarEventsList.push({
            clientId: alert.id,
            clientName: alert.clientName,
            companyName: alert.companyName,
            dateStr: followupDateStr,
            type: 'followup',
            status: 'Yellow',
            title: `Follow Up: ${alert.clientName}`
          });
        }
      });

      setEvents(calendarEventsList);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load scheduling calendar feeds.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
    
    // Poll reference date updates
    const interval = setInterval(loadCalendarEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  // Helper values for rendering calendar
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day index (0-6) for Mon to Sun layout adjustment

  const adjustIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align Mon as first day

  // Generate calendar cells (days list)
  const cells = [];
  
  // Empty space offsets for previous month
  for (let i = 0; i < adjustIndex; i++) {
    cells.push(null);
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleResetToday = () => {
    setCurrentDate(new Date());
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium">Assembling Calendar Events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast message={toastMessage} type={toastType} isVisible={showToast} onClose={() => setShowToast(false)} />

      {/* Header sections */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Calendar Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Visual calendar of lease expirations, client follow-ups, and contract reviews.</p>
        </div>

        {/* Calendar Navigators */}
        <div className="flex gap-2 w-full md:w-auto select-none">
          <button
            onClick={handleResetToday}
            className="px-3 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            Today
          </button>
          
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            <button onClick={handlePrevMonth} className="px-2.5 h-8.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors border-r border-slate-200 dark:border-slate-700">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={handleNextMonth} className="px-2.5 h-8.5 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Card layout */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-slate-200/40 dark:border-slate-800/30">
        
        {/* Month Label banner */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800/40 flex justify-between items-center px-6">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 select-none">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span>{monthNames[month]} {year}</span>
          </h2>
          
          {/* Color Indicators Legend */}
          <div className="hidden sm:flex gap-4 text-[10px] font-bold select-none text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Contract Expiry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Renewal Warning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span>Followup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Safe Lease</span>
            </div>
          </div>
        </div>

        {/* Days Grid Header */}
        <div className="grid grid-cols-7 text-center font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest text-[9px] py-3 border-b border-slate-100 dark:border-slate-800/40 select-none bg-slate-50/10 dark:bg-slate-950/5">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Days Cells Grid */}
        <div className="grid grid-cols-7 grid-rows-6 border-b border-slate-100 dark:border-slate-800/25 min-h-[480px] divide-x divide-y divide-slate-100 dark:divide-slate-850/50 bg-white/40 dark:bg-slate-900/10">
          {cells.map((day, index) => {
            if (day === null) {
              return <div key={index} className="bg-slate-50/25 dark:bg-slate-950/10" />;
            }

            // Parse Date string for comparison
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.dateStr === dateStr);

            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            return (
              <div key={index} className="p-2.5 min-h-[85px] flex flex-col justify-between hover:bg-slate-50/20 group transition-all">
                <div className="flex justify-between items-start select-none">
                  <span className={`text-xs font-bold ${
                    isToday 
                      ? 'w-6 h-6 bg-primary text-white flex items-center justify-center rounded-lg shadow-sm shadow-primary/20 scale-105' 
                      : 'text-slate-800 dark:text-slate-350'
                  }`}>
                    {day}
                  </span>
                </div>
                
                {/* Events list within day */}
                <div className="mt-2 space-y-1.5 flex-grow overflow-y-auto max-h-[70px]">
                  {dayEvents.map((ev, evIdx) => {
                    const badgeColors = {
                      Red: 'bg-red-500/10 text-red-600 border-red-500/15',
                      Orange: 'bg-amber-500/10 text-amber-600 border-amber-500/15',
                      Yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/15',
                      Green: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/15',
                      Grey: 'bg-slate-500/10 text-slate-600 border-slate-500/15',
                    };
                    const color = badgeColors[ev.status as keyof typeof badgeColors] || 'bg-slate-500/10 text-slate-600';

                    return (
                      <div
                        key={evIdx}
                        onClick={() => navigate(`/clients/${ev.clientId}`)}
                        className={`px-2 py-0.5 rounded border text-[9px] font-semibold truncate hover:scale-[1.01] hover:brightness-[0.98] transition-all cursor-pointer ${color}`}
                        title={ev.title}
                      >
                        {ev.type === 'expiry' && '🔴 '}
                        {ev.type === 'renewal' && '📅 '}
                        {ev.type === 'followup' && '📞 '}
                        {ev.title.split(': ')[1] || ev.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
