import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/auth/Login';
import Footer from './components/layout/Footer';
import DonationPage from './pages/DonationPage';
import StartFundraiser from './pages/StartFundraiser';
import UserDashboard from './pages/UserDashboard';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminSliders from './components/admin/AdminSliders';
import AdminSettings from './components/admin/AdminSettings';
import AdminRoles from './components/admin/AdminRoles';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/donate" element={<DonationPage />} />
        <Route path="/start-fundraiser" element={<StartFundraiser />} />
        <Route path="/dashboard" element={<UserDashboard />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="sliders" element={<AdminSliders />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="roles" element={<AdminRoles />} />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;
