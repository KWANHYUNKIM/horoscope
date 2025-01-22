import React from "react";
import { useParams } from "react-router-dom";

const dummyHospitals = [
  {
    id: 1,
    name: "서울 메디컬 센터",
    location: "서울특별시 강남구 테헤란로 123",
    image: "https://via.placeholder.com/800x400",
    description: "서울 메디컬 센터는 최고의 의료 서비스를 제공합니다.",
    schedule: {
      Monday: "09:00 - 18:00",
      Tuesday: "09:00 - 18:00",
      Wednesday: "09:00 - 18:00",
      Thursday: "09:00 - 18:00",
      Friday: "09:00 - 18:00",
      Saturday: "10:00 - 14:00",
      Sunday: "휴무",
    },
  },
  {
    id: 2,
    name: "부산 종합병원",
    location: "부산광역시 해운대구 센텀로 456",
    image: "https://via.placeholder.com/800x400",
    description: "부산 종합병원은 다양한 진료 과목을 제공합니다.",
    schedule: {
      Monday: "08:00 - 17:00",
      Tuesday: "08:00 - 17:00",
      Wednesday: "08:00 - 17:00",
      Thursday: "08:00 - 17:00",
      Friday: "08:00 - 17:00",
      Saturday: "09:00 - 13:00",
      Sunday: "휴무",
    },
  },
];

const HospitalDetailPage = () => {
  const { id } = useParams();
  const hospital = dummyHospitals.find((h) => h.id === parseInt(id));

  if (!hospital) return <div>병원을 찾을 수 없습니다.</div>;

  return (
    <div className="container mt-4">
      <img src={hospital.image} alt={hospital.name} className="img-fluid mb-4" />
      <h1>{hospital.name}</h1>
      <p>
        <strong>위치:</strong> {hospital.location}
      </p>
      <p>{hospital.description}</p>
      <h3>운영 시간</h3>
      <ul>
        {Object.entries(hospital.schedule).map(([day, hours]) => (
          <li key={day}>
            {day}: {hours}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HospitalDetailPage;
