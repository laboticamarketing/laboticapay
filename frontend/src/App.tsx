import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ManagerDashboard = React.lazy(() => import('./pages/ManagerDashboard').then(module => ({ default: module.ManagerDashboard })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers').then(module => ({ default: module.AdminUsers })));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings').then(module => ({ default: module.AdminSettings })));
const AdminLogs = React.lazy(() => import('./pages/AdminLogs').then(module => ({ default: module.AdminLogs })));
const NewLink = React.lazy(() => import('./pages/NewLink').then(module => ({ default: module.NewLink })));
const Links = React.lazy(() => import('./pages/Links').then(module => ({ default: module.Links })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Checkout = React.lazy(() => import('./pages/Checkout').then(module => ({ default: module.Checkout })));
const CustomerProfile = React.lazy(() => import('./pages/CustomerProfile').then(module => ({ default: module.CustomerProfile })));
const Customers = React.lazy(() => import('./pages/Customers').then(module => ({ default: module.Customers })));
const CustomerEdit = React.lazy(() => import('./pages/CustomerEdit').then(module => ({ default: module.CustomerEdit })));
const Team = React.lazy(() => import('./pages/Team').then(module => ({ default: module.Team })));
const Reports = React.lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const [role, setRole] = useState<'attendant' | 'manager' | 'admin'>('attendant');

  /*
  const getDashboardByRole = () => {
    switch (role) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      default:
        return <Dashboard />;
    }
  };
  */

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
        success: {
          style: {
            background: '#22c55e',
          },
        },
        error: {
          style: {
            background: '#ef4444',
          },
        },
      }} />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Checkout Flow (Public facing but separate layout) */}
          <Route path="/checkout/:orderId/*" element={<Checkout />} />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout role={role} setRole={setRole} />
            </ProtectedRoute>
          }>
            {/* Conditional Home Route based on Role */}
            {/* MVP: Always show Dashboard (Attendant) */}
            <Route index element={<Dashboard />} />

            <Route path="new-link" element={<NewLink />} />
            <Route path="links" element={<Links />} />
            <Route path="customers" element={<Customers />} />
            <Route path="profile" element={<Profile />} />
            <Route path="customer-profile/:id" element={<CustomerProfile />} />
            <Route path="customer-edit/:id?" element={<CustomerEdit />} />

            {/* Manager Specific Routes (Disabled for MVP) */}
            {/* <Route path="team" element={<Team />} /> */}
            {/* <Route path="reports" element={<Reports />} /> */}

            {/* Admin Specific Routes (Disabled for MVP) */}
            {/* <Route path="users" element={<AdminUsers />} /> */}
            {/* <Route path="system-settings" element={<AdminSettings />} /> */}
            {/* <Route path="audit-logs" element={<AdminLogs />} /> */}
            {/* <Route path="financial-reports" element={<div className="p-8 text-slate-900 dark:text-white">Relatórios Financeiros Avançados</div>} /> */}

            {/* <Route path="settings" element={<div className="p-8 text-slate-900 dark:text-white">Configurações Gerais</div>} /> */}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;