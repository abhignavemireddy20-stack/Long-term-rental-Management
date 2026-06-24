import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Menu } from 'lucide-react';

export const Layout: React.FC = () => {
  const { token, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync sidebar width CSS variable
  useEffect(() => {
    const root = document.documentElement;
    const width = collapsed ? '80px' : '256px';
    root.style.setProperty('--sidebar-width', width);
  }, [collapsed]);

  // Handle mobile resize auto-collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize(); // Call on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Session...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F172A] text-slate-800 dark:text-slate-200 transition-colors duration-200 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          {/* Sidebar container */}
          <div className="relative w-64 h-full bg-white dark:bg-slate-900 shadow-2xl flex-shrink-0 z-50">
            <Sidebar collapsed={false} setCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-grow flex flex-col min-w-0">
        <Header />

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden fixed bottom-5 right-5 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Content Box */}
        <main
          className="flex-grow pt-20 px-6 pb-8 overflow-y-auto transition-all duration-300"
          style={{ paddingLeft: 'calc(var(--sidebar-width, 256px) + 1.5rem)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
