import React, { lazy, Suspense } from 'react';
import { 
  createBrowserRouter, 
  createRoutesFromElements, 
  Route, 
  RouterProvider,
  Outlet
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from './context/ConfirmContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import AppErrorBoundary from './components/common/AppErrorBoundary';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./components/auth/Login'));
const Signup = lazy(() => import('./components/auth/Signup'));
const Footer = lazy(() => import('./components/layout/Footer'));
const DonationPage = lazy(() => import('./pages/DonationPage'));
const StartFundraiser = lazy(() => import('./pages/StartFundraiser'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const MySubscriptions = lazy(() => import('./pages/MySubscriptions'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));

// Admin Components
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/admin/AdminUsers'));
const AdminSliders = lazy(() => import('./components/admin/AdminSliders'));
const AdminSettings = lazy(() => import('./components/admin/AdminSettings'));
const AdminRoles = lazy(() => import('./components/admin/AdminRoles'));
const AdminTransactions = lazy(() => import('./components/admin/AdminTransactions'));
const TransactionManagement = lazy(() => import('./components/admin/TransactionManagement'));
const AdminEvents = lazy(() => import('./components/admin/AdminEvents'));
const PayoutManagement = lazy(() => import('./components/admin/PayoutManagement'));
const EventEditor = lazy(() => import('./components/admin/EventEditor'));
const AdminEventHeaders = lazy(() => import('./components/admin/AdminEventHeaders'));
const AdminEventVideos = lazy(() => import('./components/admin/AdminEventVideos'));
const AdminGalleries = lazy(() => import('./components/admin/AdminGalleries'));
const CommissionReports = lazy(() => import('./components/admin/reports/CommissionReports'));
const AdminSubscriptions = lazy(() => import('./components/admin/AdminSubscriptions'));
const Gallery = lazy(() => import('./pages/Gallery'));
const GalleryDetail = lazy(() => import('./pages/GalleryDetail'));
const AdminLeads = lazy(() => import('./components/admin/AdminLeads'));
const AdminDoctors = lazy(() => import('./components/admin/AdminDoctors'));
const AdminAvailability = lazy(() => import('./components/admin/AdminAvailability'));
const DoctorAvailability = lazy(() => import('./pages/DoctorAvailability'));
const OrderMedicine = lazy(() => import('./pages/OrderMedicine'));
const AdminPrescriptions = lazy(() => import('./components/admin/AdminPrescriptions'));
const AdminDelivery = lazy(() => import('./components/admin/AdminDelivery'));
const AdminDispatch = lazy(() => import('./components/admin/AdminDispatch'));
const AdminPharmacyOrders = lazy(() => import('./components/admin/AdminPharmacyOrders'));
const AdminWhatsApp = lazy(() => import('./components/admin/AdminWhatsApp'));
const DeliveryBoyDashboard = lazy(() => import('./pages/DeliveryBoyDashboard'));
const SharedCheckout = lazy(() => import('./pages/SharedCheckout'));
const SharedTracker = lazy(() => import('./pages/SharedTracker'));

import { AuthProvider } from './context/AuthContext';
import AdminRoute from './components/auth/AdminRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layout element for Suspense
const RootLayout = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Outlet />
  </Suspense>
);

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<AppErrorBoundary />}>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/donate" element={<DonationPage />} />
      <Route path="/start-fundraiser" element={<StartFundraiser />} />
      
      {/* Protected User Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/my-subscriptions" element={<ProtectedRoute><MySubscriptions /></ProtectedRoute>} />
      
      <Route path="/events" element={<Events />} />
      <Route path="/events/:slug" element={<EventDetail />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/gallery/:id" element={<GalleryDetail />} />
      <Route path="/doctors" element={<DoctorAvailability />} />
      <Route path="/order-medicine" element={<OrderMedicine />} />
      
      {/* Protected Rider Route */}
      <Route path="/delivery-boy" element={<ProtectedRoute><DeliveryBoyDashboard /></ProtectedRoute>} />
      
      <Route path="/checkout/:id" element={<SharedCheckout />} />
      <Route path="/track/:orderId" element={<SharedTracker />} />

      {/* Admin Routes - Strictly Guarded */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>} errorElement={<AppErrorBoundary />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sliders" element={<AdminSliders />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="transaction-management" element={<TransactionManagement />} />
        <Route path="payouts" element={<PayoutManagement />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="events-header" element={<AdminEventHeaders />} />
        <Route path="event-videos" element={<AdminEventVideos />} />
        <Route path="galleries" element={<AdminGalleries />} />
        <Route path="events/new" element={<EventEditor />} />
        <Route path="events/edit/:id" element={<EventEditor />} />
        <Route path="leads" element={<AdminLeads />} />
        <Route path="doctors" element={<AdminDoctors />} />
        <Route path="availability" element={<AdminAvailability />} />
        <Route path="prescriptions" element={<AdminPrescriptions />} />
        <Route path="pharmacy-orders" element={<AdminPharmacyOrders />} />
        <Route path="delivery" element={<AdminDelivery />} />
        <Route path="dispatch" element={<AdminDispatch />} />
        <Route path="whatsapp" element={<AdminWhatsApp />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="reports/commission" element={<CommissionReports />} />
      </Route>

      <Route path="/admin-user-explorer" element={<AdminRoute><AdminLayout /></AdminRoute>} errorElement={<AppErrorBoundary />}>
        <Route path="transactions" element={<AdminTransactions />} />
      </Route>

      {/* Catch all - 404 */}
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

function App() {
  React.useEffect(() => {
    const handleGlobalError = (event) => {
      const error = event.error || event.reason || {};
      const message = error.message || String(event);
      
      const isChunkError = 
        message.includes('Failed to fetch dynamically imported module') || 
        message.includes('Importing a module script failed') ||
        message.includes('ChunkLoadError');

      if (isChunkError) {
        const lastReload = sessionStorage.getItem('last-chunk-reload');
        const now = Date.now();
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem('last-chunk-reload', now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
  }, []);

  return (
    <AuthProvider>
      <ConfirmProvider>
        <Toaster position="top-right" />
        <RouterProvider router={router} />
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;

