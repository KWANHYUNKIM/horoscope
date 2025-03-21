import React, {useEffect} from "react";
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


initializeGA();

function App() {
  return (
    <AuthProvider>
      <Router>
        <PageTracker />
        <div className="flex flex-col min-h-screen">
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<><MainPage /><AdSense /></>} />
              <Route path="/hospitals" element={<><HospitalListPage /><AdSense /></>} />
              <Route path="/hospital/details/:id" element={<><HospitalDetailPage /><AdSense /></>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/logout" element={<LogoutPage />} />
              {/* 가이드 페이지 라우트 */}
              <Route path="/guide/emergency" element={<EmergencyGuidePage />} />
              <Route path="/guide/emergency-care" element={<EmergencyCarePage/>} />
              <Route path="/guide/night-care" element={<NightCareGuidePage />} />
              <Route path="/guide/weekend-care" element={<WeekendCareGuidePage />} />
              {/* 관리자 전용 중첩 라우트 */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }>
                <Route index element={<DashboardPage />} />
                <Route path="hospitals" element={<HospitalManagementPage />} />
                {/* 필요시 다른 하위 관리자 페이지 추가 */}
              </Route>
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

export default App;
