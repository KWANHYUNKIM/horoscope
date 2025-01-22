import React from "react";

const HospitalCard = ({ name, location, phone, services, schedule }) => {
  // 현재 요일 가져오기
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // 오늘의 운영 시간 가져오기 (기본값 처리)
  const currentHours = schedule?.[today] || "운영 시간 정보 없음";

  // 운영 여부 확인
  const isOpen = currentHours !== "휴무" && currentHours !== "운영 시간 정보 없음";

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        <p className="card-text">
          <strong>위치:</strong> {location}
        </p>
        <p className="card-text">
          <strong>전화번호:</strong> {phone}
        </p>
        <p className="card-text">
          <strong>서비스:</strong> {services.join(", ")}
        </p>
        <p className="card-text">
          <strong>운영 시간:</strong>
        </p>
        <ul>
          {schedule
            ? Object.entries(schedule).map(([day, hours]) => (
                <li key={day}>
                  {day}: {hours}
                </li>
              ))
            : "운영 시간 정보 없음"}
        </ul>
        <p
          className={`text-center ${
            isOpen ? "text-success" : "text-danger"
          } font-weight-bold`}
        >
          {isOpen ? `현재 운영 중 (${currentHours})` : "현재 휴무"}
        </p>
      </div>
    </div>
  );
};

export default HospitalCard;
