import React, {useEffect} from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import MainPage from "./pages/MainPage";
import HospitalListPage from "./pages/HospitalListPage";
import HospitalDetailPage from "./pages/HospitalDetailPage";
import Footer from "./components/Footer";
import { initializeGA, trackPageView } from "./utils/GoogleAnalytics";


initializeGA();

function App() {
  return (
    <Router>
      <PageTracker />
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow"> {/* 메인 콘텐츠 영역을 flex-grow로 설정 */}
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/hospitals" element={<HospitalListPage />} />
            <Route path="/hospital/:id" element={<HospitalDetailPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
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
