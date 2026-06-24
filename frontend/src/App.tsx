import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Alerts } from './pages/Alerts';
import { Reports } from './pages/Reports';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication Endpoint */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Frame */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:id" element={<ClientDetail />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Redirection fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
