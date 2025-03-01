import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AutoComplete = ({ searchQuery, setSearchQuery }) => {
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  // 300ms debounce로 입력값 변화 감지하여 자동완성 API 호출
  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/autocomplete?query=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("자동완성 데이터:", data); // 데이터 확인
          setSuggestions(data);
        })
        .catch((err) => console.error("자동완성 오류:", err));
    }, 300);
  
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // 추천 항목 클릭 시 검색어 업데이트 후 검색 페이지로 이동
  const handleSuggestionClick = (suggestion) => {
    const query = suggestion.yadmNm; // 병원명을 사용 (필요에 따라 addr 등도 활용)
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
          className="flex-1 p-2 border border-gray-300 rounded-l-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
        />
        <button
          onClick={() =>
            navigate(`/hospitals?query=${encodeURIComponent(searchQuery)}`)
          }
          className="bg-purple-500 text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-purple-600"
        >
          검색
        </button>
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-300 mt-1 w-full max-h-60 overflow-auto">
          {suggestions.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(item)}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {item.yadmNm} - {item.addr}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutoComplete;
