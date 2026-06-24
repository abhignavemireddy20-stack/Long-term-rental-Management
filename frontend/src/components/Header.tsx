import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  LogOut, 
  Calendar,
  X,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';

interface SearchResult {
  id: string;
  clientName: string;
  companyName: string;
  status: string;
}

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [refDate, setRefDate] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sync reference date from localStorage
  const checkRefDate = () => {
    const override = localStorage.getItem('sd_digitals_reference_date');
    setRefDate(override);
  };

  useEffect(() => {
    checkRefDate();
    const interval = setInterval(checkRefDate, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get(`/clients?search=${searchQuery}&limit=5`);
        setSearchResults(res.data.clients);
      } catch (err) {
        console.error('Search failed', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch critical alerts as notifications
  const loadNotifications = async () => {
    try {
      const activeRefDate = localStorage.getItem('sd_digitals_reference_date') || '';
      const res = await api.get(`/renewals?referenceDate=${activeRefDate}`);
      
      // Filter out non-pending or healthy renewals, just show critical/warning ones
      const list = res.data.alerts
        .filter((a: any) => a.analysis.alertStatus === 'Orange' || a.analysis.alertStatus === 'Red' || a.analysis.alertStatus === 'Yellow')
        .slice(0, 5)
        .map((a: any) => ({
          id: a.id,
          title: `${a.clientName} (${a.companyName || 'Photography'})`,
          message: a.analysis.alertMessage,
          status: a.analysis.alertStatus,
        }));
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Breadcrumb calculations
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    if (paths.length === 0) return ['Dashboard', 'Overview'];
    
    return [
      'Dashboard',
      ...paths.map(p => {
        if (p === 'clients') return 'Clients CRM';
        if (p === 'alerts') return 'Alerts Center';
        if (p === 'reports') return 'Reports & Analytics';
        if (p === 'calendar') return 'Calendar View';
        if (p === 'settings') return 'Settings';
        if (p === 'audit-logs') return 'Audit Logs';
        if (p.length > 20) return 'Profile Details'; // Likely uuid
        return p.charAt(0).toUpperCase() + p.slice(1);
      })
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="fixed top-0 right-0 left-0 h-16 z-20 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md transition-colors duration-200" style={{ left: 'var(--sidebar-width, 256px)' }}>
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium select-none">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            <span className={idx === breadcrumbs.length - 1 ? 'text-slate-800 dark:text-slate-200 font-semibold' : ''}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        
        {/* Global Search Bar */}
        <div ref={searchRef} className="relative hidden sm:block w-64 md:w-80">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients, company, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="w-full h-9 pl-9 pr-8 rounded-lg text-xs bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-primary/20 dark:focus:border-secondary/20 focus:outline-none focus:ring-2 focus:ring-primary/5 dark:focus:ring-secondary/5 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50"
              >
                <X className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute right-0 left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                Matching Rental Clients
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    to={`/clients/${result.id}`}
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="flex flex-col gap-0.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800/20 last:border-0"
                  >
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{result.clientName}</span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{result.companyName || 'Independent'}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        result.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        result.status === 'Expired' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {result.status === 'Active' ? 'Ongoing' : result.status === 'Expired' ? 'Rental Completed' : result.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time Travel Override Alert */}
        {refDate && (
          <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] md:text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse">
            <Calendar className="w-3.5 h-3.5" />
            <span>Simulated: {refDate}</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notification Center */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-accent-danger animate-ping" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">System Expiration Alerts</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-accent-danger font-bold">{notifications.length} Urgent</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    🎉 All ongoing contracts are in healthy status!
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      to="/alerts"
                      onClick={() => setShowNotif(false)}
                      className="block p-3.5 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      <div className="flex gap-2">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notif.status === 'Red' ? 'bg-red-500' :
                          notif.status === 'Orange' ? 'bg-amber-500' :
                          'bg-yellow-400'
                        }`} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{notif.title}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{notif.message}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-950/20">
                <Link to="/alerts" onClick={() => setShowNotif(false)} className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors">
                  Open Alerts Center
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary/30 to-secondary/30 text-primary flex items-center justify-center font-bold text-xs">
              {user?.name.split(' ').map(n=>n[0]).join('') || 'U'}
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</span>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</span>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-primary dark:text-secondary">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{user?.role} Session</span>
                </div>
              </div>
              <div className="p-1">
                <Link
                  to="/settings"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
