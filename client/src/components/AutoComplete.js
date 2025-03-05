import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const baseUrl = process.env.REACT_APP_BACKEND_URI || "http://localhost:3001"; // ✅ 환경변수 사용

const AutoComplete = ({ searchQuery, setSearchQuery }) => {
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }

    //console.log(`🔎 검색 요청: ${searchQuery}`);

    const timer = setTimeout(() => {
      fetch(`${baseUrl}/api/autocomplete?query=${encodeURIComponent(searchQuery)}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        cache: "no-store",
      })
        .then((res) => {
          //console.log(`📡 응답 상태 코드: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          //console.log("✅ 자동완성 데이터 수신:", JSON.stringify(data, null, 2));
          setSuggestions(data.hospital || []); // 🔥 불필요한 프론트 필터 제거 & 빈 배열 처리
        })
        .catch((err) => {
          //console.error("❌ 자동완성 오류:", err);
          setSuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSuggestionClick = (query) => {
    setSearchQuery(query);
    navigate(`/hospitals?query=${encodeURIComponent(query)}`);
  };

  return (
    <div className="relative w-full">
      <div className="flex">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="어떤 병원을 찾으시나요?"
          className="flex-1 p-3 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
        />
        <button
          onClick={() => navigate(`/hospitals?query=${encodeURIComponent(searchQuery)}`)}
          className="bg-purple-500 text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-purple-600"
        >
          검색
        </button>
      </div>

      {suggestions.length > 0 ? (
        <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 font-semibold text-gray-700">🏥 병원 목록</div>
          <ul className="max-h-60 overflow-auto">
            {suggestions.map((item, index) => (
              <li
                key={`hospital-${index}`}
                onClick={() => handleSuggestionClick(item.name)}
                className="flex justify-between items-center p-3 hover:bg-gray-200 cursor-pointer border-b"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-blue-600">{item.name}</span>
                  <span className="text-gray-600 text-sm">{item.address}</span>
                </div>
                <span className="bg-gray-300 text-gray-700 px-2 py-1 text-xs rounded-md">
                  {item.subject}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        searchQuery && (
          <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg">
            <div className="p-3 text-gray-500 text-center">❌ 검색 결과 없음</div>
          </div>
        )
      )}
    </div>
  );
};

export default AutoComplete;
