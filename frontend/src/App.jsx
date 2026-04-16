import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Footer from './components/layout/Footer';
import DonationPage from './pages/DonationPage';
import StartFundraiser from './pages/StartFundraiser';
import UserDashboard from './pages/UserDashboard';
import NotFound from './pages/NotFound';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminSliders from './components/admin/AdminSliders';
import AdminSettings from './components/admin/AdminSettings';
import AdminRoles from './components/admin/AdminRoles';
import AdminTransactions from './components/admin/AdminTransactions';

import TransactionManagement from './components/admin/TransactionManagement';
import AdminEvents from './components/admin/AdminEvents';

import EventEditor from './components/admin/EventEditor';
import AdminEventHeaders from './components/admin/AdminEventHeaders';
import AdminEventVideos from './components/admin/AdminEventVideos';
import AdminGalleries from './components/admin/AdminGalleries';
import CommissionReports from './components/admin/reports/CommissionReports';
import Gallery from './pages/Gallery';
import GalleryDetail from './pages/GalleryDetail';

import AdminLeads from './components/admin/AdminLeads';
import AdminDoctors from './components/admin/AdminDoctors';
import AdminAvailability from './components/admin/AdminAvailability';
import DoctorAvailability from './pages/DoctorAvailability';
import OrderMedicine from './pages/OrderMedicine';
import AdminPrescriptions from './components/admin/AdminPrescriptions';
import AdminDelivery from './components/admin/AdminDelivery';
import AdminDispatch from './components/admin/AdminDispatch';
import AdminPharmacyOrders from './components/admin/AdminPharmacyOrders';
import DeliveryBoyDashboard from './pages/DeliveryBoyDashboard';
import SharedCheckout from './pages/SharedCheckout';
import SharedTracker from './pages/SharedTracker';

import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <ConfirmProvider>
      <Toaster position="top-right" />
      <Router>

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/donate" element={<DonationPage />} />
          <Route path="/start-fundraiser" element={<StartFundraiser />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/gallery/:id" element={<GalleryDetail />} />
          <Route path="/doctors" element={<DoctorAvailability />} />
          <Route path="/order-medicine" element={<OrderMedicine />} />
          <Route path="/delivery-boy" element={<DeliveryBoyDashboard />} />
          <Route path="/checkout/:id" element={<SharedCheckout />} />
          <Route path="/track/:orderId" element={<SharedTracker />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sliders" element={<AdminSliders />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="transaction-management" element={<TransactionManagement />} />
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
            <Route path="reports/commission" element={<CommissionReports />} />
          </Route>

          <Route path="/admin-user-explorer" element={<AdminLayout />}>
            <Route path="transactions" element={<AdminTransactions />} />
          </Route>

          {/* Catch all - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ConfirmProvider>
  );
}
export default App;
