import React from "react";
import { Link } from "react-router-dom";

const informationPosts = [
  {
    id: 1,
    title: "2025년 2월 2째주 응급실 선정 병원 안내",
    date: "2025-02-10",
    image: "/images/info1.jpg", // 실제 이미지 경로로 변경하세요.
    summary: "이번 주 응급실 선정 병원은 OO병원, XX의료원 등입니다.",
  },
  {
    id: 2,
    title: "의료기관 운영시간 최신 업데이트",
    date: "2025-02-05",
    image: "/images/info2.jpg",
    summary: "최근 각 의료기관의 운영시간이 업데이트 되었습니다.",
  },
  // 필요에 따라 더 많은 정보를 추가할 수 있습니다.
];

const InformationSection = () => {
  return (
    <section className="container mx-auto mt-8 p-4 px-4 md:px-40">
      <h2 className="text-2xl font-bold mb-4">정보성 글</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {informationPosts.map((post) => (
          <Link
            key={post.id}
            to={`/information/${post.id}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-40 object-cover rounded-t-lg"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold">{post.title}</h3>
              <p className="text-gray-500 text-sm">{post.date}</p>
              <p className="text-gray-700 mt-2">{post.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default InformationSection;
