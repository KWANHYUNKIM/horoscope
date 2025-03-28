import React, {useEffect, useState} from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import HospitalListPage from "./pages/HospitalListPage";
import HospitalDetailPage from "./pages/HospitalDetailPage";
import Footer from "./components/Footer";
import AdSense from "./components/AdSense";
import { initializeGA, trackPageView } from "./utils/GoogleAnalytics";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import AdminRoute from "./components/AdminRoute";
import HospitalManagementPage from './pages/HospitalManagementPage';
import EmergencyGuidePage from './pages/guides/EmergencyGuidePage';
import NightCareGuidePage from './pages/guides/NightCareGuidePage';
import WeekendCareGuidePage from './pages/guides/WeekendCareGuidePage';
import EmergencyCarePage from './pages/guides/EmergencyCarePage';
import { AuthProvider } from './contexts/AuthContext';
import DashboardPage from './pages/admin/DashboardPage';
import RegisterPage from './pages/RegisterPage';
import Login from './components/auth/Login';
import CommunityPage from './pages/CommunityPage';
import TermsAgreement from './components/auth/TermsAgreement';
import NavigationBar from './components/NavigationBar';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    setIsLoggedIn(!!token);
    setUserRole(role);
  }, []);

  useEffect(() => {
    initializeGA();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
    setUserRole(null);
    window.location.href = '/';
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <NavigationBar isLoggedIn={isLoggedIn} userRole={userRole} onLogout={handleLogout} />
          <AppContent isLoggedIn={isLoggedIn} userRole={userRole} />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent({ isLoggedIn, userRole }) {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<MainPage isLoggedIn={isLoggedIn} userRole={userRole} />} />
          <Route path="/hospitals" element={<HospitalListPage />} />
          <Route path="/hospitals/:id" element={<HospitalDetailPage />} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
          <Route path="/admin/hospitals" element={<AdminRoute><HospitalManagementPage /></AdminRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/guides/emergency" element={<EmergencyGuidePage />} />
          <Route path="/guides/night-care" element={<NightCareGuidePage />} />
          <Route path="/guides/weekend-care" element={<WeekendCareGuidePage />} />
          <Route path="/guides/emergency-care" element={<EmergencyCarePage />} />
          <Route path="/terms" element={<TermsAgreement />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
