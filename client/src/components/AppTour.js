import React, { useState, useEffect, useRef } from "react";
import Joyride, { EVENTS, STATUS } from "react-joyride";

const AppTour = () => {
  const [run, setRun] = useState(false);
  const [visited, setVisited] = useState(localStorage.getItem("visited")); // ✅ 초기 상태에 localStorage 값 저장
  const joyrideRef = useRef(null);
  const autoAdvanceTimeoutRef = useRef(null);

  const steps = [
    {
      target: ".header-title",
      content: "여기는 사이트 제목입니다. 클릭하면 홈페이지로 이동할 수 있어요.",
      disableBeacon: true,
    },
    {
      target: ".search-bar",
      content:
        "여기서 병원을 검색할 수 있습니다. 검색어가 없으면 내 주변 검색 기능을 이용해 보세요.",
    },
    {
      target: ".slider-section",
      content: "이 슬라이더는 주요 정보를 보여줍니다.",
    },
    {
      target: ".floating-announcement",
      content: "중요한 공지사항은 이 버튼을 통해 확인할 수 있습니다.",
    },
  ];

  useEffect(() => {
    if (!visited) {
      setRun(true);
    }

    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [visited]); // ✅ `visited` 값이 변경될 때만 useEffect 실행

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem("visited", "true");
      setVisited("true"); // ✅ 상태 업데이트로 재렌더링 방지
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    } else if (type === EVENTS.TOOLTIP_RENDERED) {
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (joyrideRef.current) {
          joyrideRef.current.helpers.next();
        }
      }, 2000);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      disableBeacon={true}
      scrollToFirstStep={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      getHelpers={(helpers) => {
        joyrideRef.current = helpers;
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "#4a90e2",
        },
      }}
    />
  );
};

export default AppTour;
