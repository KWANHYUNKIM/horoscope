// src/pages/AnnouncementsPage.jsx
import React from "react";

const AnnouncementsPage = () => {
  return (
    <div className="container mx-auto p-4 md:px-40">
      <h1 className="text-3xl font-bold mb-4">공지사항 및 피드백</h1>
      <p className="mb-4">
        사용자 여러분의 소중한 의견을 기다립니다. 아래의 방법 중 하나로 피드백을 보내주세요.
      </p>
      <ul className="list-disc list-inside mb-8">
        <li>
          이메일:{" "}
          <a
            href="mailto:example@example.com"
            className="text-blue-500 underline"
          >
            molba06@naver.com
          </a>
        </li>
        <li>
          Discord:{" "}
          <a
            href="https://discord.gg/yourinvite"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Join our Discord
          </a>
        </li>
        <li>기타: (기타 피드백 방법)</li>
      </ul>

      <div>
        <h2 className="text-2xl font-bold mb-2">최근 공지사항</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold">공지사항 1</h3>
            <p className="text-gray-600">
              서비스 업데이트: 최신 기능 추가 및 버그 수정 내용 안내
            </p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-xl font-semibold">공지사항 2</h3>
            <p className="text-gray-600">
              시스템 점검: 예정된 시스템 점검 시간 및 영향 안내
            </p>
          </div>
          {/* 추가 공지사항이 있다면 여기에 더 추가 */}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
