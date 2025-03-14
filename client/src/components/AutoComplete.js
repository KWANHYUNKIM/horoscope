import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const baseUrl = process.env.REACT_APP_BACKEND_URI || "http://localhost:3001";
//const baseUrl = "http://localhost:3001";

const AutoComplete = ({ searchQuery, setSearchQuery }) => {
  const [suggestions, setSuggestions] = useState({ hospital: [] });
  const [searchHistory, setSearchHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    setSearchHistory(storedHistory);
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSuggestions({ hospital: [] });
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${baseUrl}/api/autocomplete?query=${encodeURIComponent(searchQuery)}`, {
        method: "GET",
        mode: "cors",
      })
        .then((res) => res.json())
        .then((data) => {
          const hospitalData = (data.hospital || []).map((h) => ({
            ...h,
            address: h.address || h.addr,
          }));
          setSuggestions({ hospital: hospitalData });
        })
        .catch(() => {
          setSuggestions({ hospital: [] });
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (queryParam = searchQuery) => {
    if (!queryParam.trim()) return;
    const trimmedQuery = queryParam.trim();
    if (trimmedQuery) {
      let updatedHistory = [trimmedQuery, ...searchHistory.filter((h) => h !== trimmedQuery)];
      updatedHistory = updatedHistory.slice(0, 10);
      localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
      setSearchHistory(updatedHistory);
    }
    navigate(`/hospitals?query=${encodeURIComponent(queryParam)}`);
  };

  const handleHistoryClick = (item) => {
    setSearchQuery(item);
    handleSearch(item);
  };

  const handleDeleteHistoryItem = (e, index) => {
    e.stopPropagation();
    const updatedHistory = searchHistory.filter((_, i) => i !== index);
    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
    setSearchHistory(updatedHistory);
  };

  const handleHospitalClick = (hospital) => {
    setSearchQuery(hospital.name);
    handleSearch(hospital.name);
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

      {!searchQuery && searchHistory.length > 0 && (
        <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-auto">
          <div className="px-4 py-2 font-semibold text-gray-700">이전 검색어</div>
          <ul>
            {searchHistory.map((item, index) => (
              <li
                key={`history-${index}`}
                onMouseDown={() => handleHistoryClick(item)}
                className="flex justify-between items-center p-3 hover:bg-gray-200 cursor-pointer border-b text-black text-sm"
              >
                <span>{item}</span>
                <button
                  className="text-gray-400 hover:text-red-500 ml-2"
                  onMouseDown={(e) => handleDeleteHistoryItem(e, index)}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searchQuery && (
        <div className="absolute z-10 bg-white border border-gray-300 mt-1 w-full rounded-lg shadow-lg overflow-hidden">
          {suggestions.hospital.length === 0 ? (
            <div className="p-3 text-gray-500 text-center">❌ 검색 결과 없음</div>
          ) : (
            <ul>
              {suggestions.hospital.map((hospital, idx) => (
                <li
                  key={idx}
                  onMouseDown={() => handleHospitalClick(hospital)}
                  className="p-3 hover:bg-gray-200 cursor-pointer border-b text-black text-sm"
                >
                  <div className="font-medium text-blue-600 text-sm">{hospital.name}</div>
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