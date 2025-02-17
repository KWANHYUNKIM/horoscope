import React from "react";

const OperatingStatus = ({ schedule }) => {
  if (!schedule) {
    return (
      <div className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-500">
        영업시간 정보 없음
      </div>
    );
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayOfWeek[now.getDay()];

  const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === "-") return null;
    
    const strTime = String(timeStr).padStart(4, "0");  // 숫자일 경우 문자열로 변환 및 '0900' 형식 맞추기
    const hour = parseInt(strTime.slice(0, 2), 10);
    const minute = parseInt(strTime.slice(2, 4), 10);
    
    return hour * 60 + minute;
  
  };

  const nowInMinutes = currentHour * 60 + currentMinute;
  const openTime = timeToMinutes(schedule[today]?.openTime);
  const closeTime = timeToMinutes(schedule[today]?.closeTime);

  // 브레이크타임 파싱
  let lunchStart = null, lunchEnd = null;
  if (schedule.lunch) {
    const lunchTimes = schedule.lunch.split("~");
    lunchStart = timeToMinutes(lunchTimes[0]?.replace("시", "").replace("분", "").trim());
    lunchEnd = timeToMinutes(lunchTimes[1]?.replace("시", "").replace("분", "").trim());
  }

  let status = "";
  let statusClass = "";

  if (openTime !== null && closeTime !== null) {
    if (nowInMinutes >= openTime && nowInMinutes < closeTime) {
      if (lunchStart !== null && lunchEnd !== null && nowInMinutes >= lunchStart && nowInMinutes < lunchEnd) {
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
    <div className={`px-3 py-1 rounded-md text-sm inline-block cursor-pointer ${statusClass}`}>
      {status}
    </div>
  );
};

export default OperatingStatus;
