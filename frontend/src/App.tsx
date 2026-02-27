import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Lazy imports for code splitting
import { lazy, Suspense } from 'react';
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('@/pages/CustomerDetailPage'));

const PaymentLinksPage = lazy(() => import('@/pages/PaymentLinksPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NewLinkPage = lazy(() => import('@/pages/NewLinkPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 rounded-lg bg-primary-500 animate-pulse" />
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;
  if (isAuthenticated) return <Navigate to="/admin" replace />;

  return <Outlet />;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Public checkout — no auth required */}
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        <Route path="/checkout/:orderId/success" element={<CheckoutPage />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="new-link" element={<NewLinkPage />} />
            <Route path="orders" element={<PaymentLinksPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="profile" element={<SettingsPage />} />
            {/* Redirects for backward compatibility */}
            <Route path="links" element={<Navigate to="/admin/orders" replace />} />
            <Route path="settings" element={<Navigate to="/admin/profile" replace />} />
          </Route>
        </Route>

        {/* Redirect root to admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}
