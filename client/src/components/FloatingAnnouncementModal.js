// src/components/FloatingAnnouncementModal.jsx
import React, { useState } from "react";
import emailjs from "emailjs-com";

const FloatingAnnouncementModal = () => {
  const [showModal, setShowModal] = useState(false);

  // 피드백 폼 데이터
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // 인풋 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 폼 제출 핸들러: EmailJS를 이용해 이메일 전송
  const handleSubmit = (e) => {
    e.preventDefault();

    // EmailJS 설정 값: 아래의 값을 EmailJS 대시보드에서 확인 후 변경하세요.
    const serviceID = "service_yrtkkf7"; // 예: 'service_xxxx'
    const templateID = "template_a68sqii"; // 예: 'template_xxxx'
    const userID = "5kE8Ypojh_-_eQo66"; // EmailJS public key

    // 전송할 데이터 (템플릿에서 사용한 변수명과 일치해야 함)
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      message: formData.message,
      to_email: "bippobippo119@gmail.com", // 받는 사람 이메일
    };
    console.log(JSON.stringify(templateParams, null, 2));
    emailjs
      .send(serviceID, templateID, templateParams, userID)
      .then(
        (response) => {
          console.log("SUCCESS!", response.status, response.text);
          alert("소중한 의견 감사합니다!");
          setFormData({ name: "", email: "", message: "" });
          closeModal();
        },
        (err) => {
          console.error("FAILED...", err);
          alert("전송에 실패했습니다. 다시 시도해주세요.");
        }
      );
  };

  return (
    <>
      {/* 떠다니는 버튼 (아이콘 형태) */}
      <button
        onClick={openModal}
        title="공지사항 및 피드백"
        className="
          fixed 
          bottom-6 
          right-6 
          flex 
          items-center 
          justify-center 
          w-14 
          h-14 
          rounded-full 
          bg-white 
          text-black 
          shadow-lg 
          hover:scale-105 
          transition-transform 
          z-50
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
          <rect x="11" y="7" width="2" height="10" rx="1" fill="currentColor" />
          <rect x="7" y="9" width="2" height="6" rx="1" fill="currentColor" />
          <rect x="15" y="9" width="2" height="6" rx="1" fill="currentColor" />
        </svg>
      </button>

      {/* 모달 (showModal이 true일 때만 표시) */}
      {showModal && (
        <div
          className="
            fixed 
            inset-0 
            bg-black 
            bg-opacity-50 
            flex 
            items-center 
            justify-center 
            z-50
          "
        >
          <div className="bg-white w-full max-w-md rounded p-6 relative shadow-lg mx-2">
            {/* 닫기 버튼 */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4">공지사항 & 피드백</h2>

            {/* 공지사항 내용 (간단 예시) */}
            <div className="mb-4 space-y-2 text-sm text-gray-700">
              <p>서비스 업데이트: 최신 기능 추가 및 버그 수정 안내</p>
              <p>시스템 점검: 예정된 점검 시간 안내</p>
              <p>...</p>
            </div>

            {/* 피드백 안내 */}
            <p className="text-sm text-gray-500 mb-4">
              여러분의 소중한 의견을 남겨주세요!
            </p>

            {/* 피드백 폼 */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="홍길동"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@example.com"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  의견
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="의견을 남겨주세요."
                  required
                />
              </div>

              <div className="text-right">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  보내기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAnnouncementModal;
