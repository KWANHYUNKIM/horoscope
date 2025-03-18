import React, { useState, useEffect, useRef } from "react";
import Joyride, { EVENTS, STATUS } from "react-joyride";
import Cookies from "js-cookie";

const AppTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
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
    const visited = Cookies.get("visited");
    if (!visited) {
      // 페이지 로드 후 자동으로 투어 실행
      setRun(true);
    }
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      Cookies.set("visited", "true", { expires: 7 });
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    } else if (type === EVENTS.TOOLTIP_RENDERED) {
      // 툴팁이 렌더링되면 2초 후 자동으로 다음 단계로 이동
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (joyrideRef.current) {
          joyrideRef.current.helpers.next();
        }
      }, 2000);
    } else if (type === EVENTS.STEP_AFTER) {
      // 사용자가 클릭하지 않아도 자동 진행 시, stepIndex를 업데이트합니다.
      setStepIndex((prev) => prev + 1);
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
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

