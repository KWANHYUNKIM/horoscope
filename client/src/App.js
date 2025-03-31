import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainPage from "./pages/MainPage";
import HospitalListPage from "./pages/HospitalListPage";
import HospitalDetailPage from "./pages/HospitalDetailPage";
import Footer from "./components/Footer";
import AdSense from "./components/AdSense";
import { initializeGA, trackPageView } from "./utils/GoogleAnalytics";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import AdminRoute from "./components/AdminRoute";
import HospitalManagementPage from './pages/HospitalManagementPage';
import EmergencyGuidePage from './pages/guides/EmergencyGuidePage';
import NightCareGuidePage from './pages/guides/NightCareGuidePage';
import WeekendCareGuidePage from './pages/guides/WeekendCareGuidePage';
import EmergencyCarePage from './pages/guides/EmergencyCarePage';
import { useAuth } from './contexts/AuthContext';
import DashboardPage from './pages/admin/DashboardPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import RegisterPage from './pages/RegisterPage';
import Login from './components/auth/Login';
import CommunityPage from './pages/CommunityPage';
import TermsAgreement from './components/auth/TermsAgreement';
import NavigationBar from './components/NavigationBar';
import axios from 'axios';
import CreateBoardPage from './pages/community/CreateBoardPage';
import BoardDetail from './pages/community/BoardDetail';

const App = () => {
  const { isLoggedIn, userRole, handleLogout } = useAuth();

  useEffect(() => {
    initializeGA();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <NavigationBar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<MainPage isLoggedIn={isLoggedIn} userRole={userRole} />} />
            <Route path="/hospitals" element={<HospitalListPage />} />
            <Route path="/hospitals/:id" element={<HospitalDetailPage />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
            <Route path="/admin/hospitals" element={<AdminRoute><HospitalManagementPage /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><CategoryManagementPage /></AdminRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route path="/guides/emergency" element={<EmergencyGuidePage />} />
            <Route path="/guides/night-care" element={<NightCareGuidePage />} />
            <Route path="/guides/weekend-care" element={<WeekendCareGuidePage />} />
            <Route path="/guides/emergency-care" element={<EmergencyCarePage />} />
            <Route path="/terms" element={<TermsAgreement />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/category/:categoryId" element={<CommunityPage />} />
            <Route path="/community/board/:id" element={<BoardDetail />} />
            <Route path="/community/create" element={<CreateBoardPage />} />
            <Route path="/community/edit/:id" element={<CreateBoardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
