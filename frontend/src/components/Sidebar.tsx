import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  AlertOctagon, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Camera
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [criticalCount, setCriticalCount] = useState<number>(0);

  // Poll/fetch critical alerts count
  const fetchAlertCount = async () => {
    try {
      const res = await api.get('/renewals');
      setCriticalCount(res.data.summary.critical);
    } catch (err) {
      console.error('Failed to load alert summary in sidebar', err);
    }
  };

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 20000); // refresh count every 20s
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Clients CRM', path: '/clients', icon: <Users className="w-5 h-5" /> },
    { 
      name: 'Alerts Center', 
      path: '/alerts', 
      icon: <AlertOctagon className="w-5 h-5" />, 
      badge: criticalCount > 0 ? criticalCount : undefined 
    },
    { name: 'Reports & Analytics', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Calendar View', path: '/calendar', icon: <CalendarIcon className="w-5 h-5" /> },
  ];

  if (user?.role === 'Admin') {
    // Audit logs/settings can be visible
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 bottom-0 z-30 flex flex-col glass-panel shadow-xl transition-colors duration-200"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary text-white shadow-md shadow-primary/20 flex-shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col select-none"
            >
              <span className="font-bold text-base tracking-tight text-slate-800 dark:text-slate-100">SD Digitals</span>
              <span className="text-[10px] font-semibold text-primary dark:text-secondary tracking-widest uppercase">CRM Admin</span>
            </motion.div>
          )}
        </div>
        
        {/* Collapse button on Desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200/50 dark:border-slate-800/40 bg-white/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-grow py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between p-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary dark:text-secondary font-semibold border border-primary/15 dark:border-secondary/15 shadow-sm shadow-primary/5' 
                  : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary dark:text-secondary' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'}`}>
                  {item.icon}
                </div>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm tracking-wide"
                  >
                    {item.name}
                  </motion.span>
                )}
              </div>
              
              {/* Alert Badge */}
              {item.badge !== undefined && (
                <div className={`
                  flex items-center justify-center h-5 rounded-full text-[10px] font-bold px-1.5
                  ${collapsed ? 'absolute top-1.5 right-1.5' : ''}
                  bg-accent-danger text-white ring-2 ring-white dark:ring-slate-900 animate-pulse
                `}>
                  {item.badge}
                </div>
              )}

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap shadow-md z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Config Links (Settings) */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/40 space-y-1">
        {user?.role === 'Admin' && (
          <NavLink
            to="/audit-logs"
            className={({ isActive }) => `
              flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
              ${isActive 
                ? 'bg-gradient-to-r from-red-500/10 to-amber-500/10 text-red-600 dark:text-red-400 font-semibold border border-red-500/15' 
                : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-transparent'}
            `}
          >
            <ShieldAlert className="w-5 h-5 text-red-500" />
            {!collapsed && <span className="text-sm">Audit Logs</span>}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap shadow-md z-50">
                Audit Logs (Admin)
              </div>
            )}
          </NavLink>
        )}

        <NavLink
          to="/settings"
          className={({ isActive }) => `
            flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative
            ${isActive 
              ? 'bg-gradient-to-r from-primary/10 to-secondary/10 text-primary dark:text-secondary font-semibold border border-primary/15' 
              : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-transparent'}
          `}
        >
          <Settings className="w-5 h-5 text-slate-500" />
          {!collapsed && <span className="text-sm">Settings</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap shadow-md z-50">
              Settings
            </div>
          )}
        </NavLink>

        {/* User Account Info */}
        {!collapsed && (
          <div className="flex items-center gap-3 p-2 mt-4 bg-slate-100/60 dark:bg-slate-900/60 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              {user?.name.split(' ').map(n=>n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.role}</span>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
