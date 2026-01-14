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
            <Route path="events/new" element={<EventEditor />} />

            <Route path="events/edit/:id" element={<EventEditor />} />
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
