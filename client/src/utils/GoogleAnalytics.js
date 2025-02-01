import ReactGA from "react-ga4";

// ✅ 환경 변수에서 GA 측정 ID 가져오기
const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

export const initializeGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    ReactGA.send("pageview");
  } else {
    console.warn("Google Analytics 측정 ID가 설정되지 않았습니다.");
  }
};

// ✅ 페이지 변경 시 Analytics 이벤트 전송
export const trackPageView = (page) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: "pageview", page });
  }
};