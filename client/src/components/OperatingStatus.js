import React, { useState } from "react";

const OperatingStatus = ({ schedule }) => {
  const [showDetails, setShowDetails] = useState(false);

  // schedule 정보가 없으면 드롭다운 없이 메시지만 표시
  if (!schedule) {
    return (
      <div className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-500">
        영업시간 정보 없음
      </div>
    );
  }

  // 요일 관련 변수 (날짜는 영어로 관리하고, 표시 시 한글로 변환)
  const dayOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayKoreanMap = {
    Sunday: "일요일",
    Monday: "월요일",
    Tuesday: "화요일",
    Wednesday: "수요일",
    Thursday: "목요일",
    Friday: "금요일",
    Saturday: "토요일",
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const today = dayOfWeek[now.getDay()];

  // 문자열을 분 단위 숫자로 변환 (예: "0900" → 540)
  const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === "-") return null;
    const strTime = String(timeStr).padStart(4, "0");
    const hour = parseInt(strTime.slice(0, 2), 10);
    const minute = parseInt(strTime.slice(2, 4), 10);
    return hour * 60 + minute;
  };

  // 숫자형/문자열 시간을 "HH:MM" 형식으로 포맷팅
  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === "-") return "-";
    const strTime = String(timeStr).padStart(4, "0");
    return `${strTime.slice(0, 2)}:${strTime.slice(2, 4)}`;
  };

  const nowInMinutes = currentHour * 60 + currentMinute;
  const openTime = timeToMinutes(schedule[today]?.openTime);
  const closeTime = timeToMinutes(schedule[today]?.closeTime);

  // 브레이크타임 파싱
  let lunchStart = null,
    lunchEnd = null;
  if (schedule.lunch) {
    const lunchTimes = schedule.lunch.split("~");
    lunchStart = timeToMinutes(
      lunchTimes[0]?.replace("시", "").replace("분", "").trim()
    );
    lunchEnd = timeToMinutes(
      lunchTimes[1]?.replace("시", "").replace("분", "").trim()
    );
  }

  let status = "";
  let statusClass = "";

  if (openTime !== null && closeTime !== null) {
    if (nowInMinutes >= openTime && nowInMinutes < closeTime) {
      if (
        lunchStart !== null &&
        lunchEnd !== null &&
        nowInMinutes >= lunchStart &&
        nowInMinutes < lunchEnd
      ) {
        status = "브레이크타임 🍽️";
        statusClass = "bg-yellow-100 text-yellow-600";
      } else {
        status = "영업 중 ✅";
        statusClass = "bg-green-100 text-green-600";
      }
    } else {
      status = "영업 종료 ❌";
      statusClass = "bg-red-100 text-red-600";
    }
  } else {
    return (
      <div className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-500">
        영업시간 정보 없음
      </div>
    );
  }

  return (
    <div>
      {/* 클릭 시 showDetails 상태 토글 */}
      <div
        className={`px-3 py-1 rounded-md text-sm inline-block cursor-pointer ${statusClass} flex items-center`}
        onClick={() => setShowDetails((prev) => !prev)}
      >
        <span>{status}</span>
        <span
          className="ml-2 transform transition-transform duration-200"
          style={{ transform: showDetails ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </div>
      {/* 드롭다운: 요일별 영업시간 */}
      {showDetails && (
        <div className="mt-2 p-2 border border-gray-200 rounded-md">
          {dayOfWeek.map((day) => {
            const daySchedule = schedule[day];
            return (
              <div key={day} className="flex justify-between text-sm py-1">
                <span>{dayKoreanMap[day]}</span>
                {daySchedule && daySchedule.openTime && daySchedule.closeTime ? (
                  <span>
                    {formatTime(daySchedule.openTime)} ~{" "}
                    {formatTime(daySchedule.closeTime)}
                  </span>
                ) : (
                  <span>정보 없음</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OperatingStatus;
