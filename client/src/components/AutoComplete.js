import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../utils/api';

const baseUrl = "http://localhost:3001";
//const baseUrl = "https://my-server-284451238916.asia-northeast3.run.app";

const AutoComplete = ({ searchQuery, setSearchQuery }) => {
  const [suggestions, setSuggestions] = useState({ hospital: [] });
  const [searchHistory, setSearchHistory] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    setSearchHistory(storedHistory);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions({ hospital: [] });
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/api/hospitals/search?query=${encodeURIComponent(searchQuery)}`);
        setSuggestions({ hospital: response.data });
      } catch (error) {
        console.error('검색어 자동완성 실패:', error);
        setSuggestions({ hospital: [] });
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = (queryParam = searchQuery) => {
    const trimmedQuery = queryParam.trim();
  
    // 검색어가 없으면 위치 기반 검색 시도
    if (!trimmedQuery) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            // 위치 기반 검색을 위한 URL 구성 (예: x, y 값 전달)
            navigate(`/hospitals?x=${longitude}&y=${latitude}`);
          },
          (error) => {
            console.error("위치 정보를 가져올 수 없습니다.", error);
            alert("위치 정보를 가져올 수 없습니다. 직접 검색어를 입력해주세요.");
          }
        );
      } else {
        alert("이 브라우저는 위치 정보를 지원하지 않습니다.");
      }
      return;
    }
  
    // 검색어가 있으면 기존 로직 실행
    let updatedHistory = [
      trimmedQuery,
      ...searchHistory.filter((h) => h !== trimmedQuery),
    ];
    updatedHistory = updatedHistory.slice(0, 10);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    setSearchHistory(updatedHistory);
    navigate(`/hospitals?query=${encodeURIComponent(trimmedQuery)}`);
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
          onClick={() => handleSearch()}
          className="bg-purple-500 text-white px-4 py-2 rounded-r-lg shadow-sm hover:bg-purple-600"
        >
          검색
        </button>
      </div>

      {loading && (
        <div className="absolute right-2 top-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}

      {searchQuery && (
        <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden">
          {(suggestions.hospital || []).length === 0 ? (
            <div className="p-3 text-gray-500 text-center">❌ 검색 결과 없음</div>
          ) : (
            <ul>
              {(suggestions.hospital || []).map((hospital, idx) => (
                <li key={idx} onMouseDown={() => handleSearch(hospital.name)}
                    className="p-3 hover:bg-gray-200 cursor-pointer border-b text-black text-sm">
                  <div className="font-medium text-blue-600">{hospital.name}</div>
                  <div className="text-xs text-gray-500">{hospital.address}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AutoComplete;
