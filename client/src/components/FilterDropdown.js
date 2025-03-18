import React, { useState, useEffect } from "react";

const FilterDropdown = ({ categories, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [locationBased, setLocationBased] = useState(false);
  const [distance, setDistance] = useState(10000); // 기본 거리 10km
  const [userLocation, setUserLocation] = useState({ x: null, y: null });

  // URL 파라미터를 읽어 위치 상태 업데이트.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const x = params.get("x");
    const y = params.get("y");
    if (x && y) {
      setUserLocation({ x: parseFloat(x), y: parseFloat(y) });
      setLocationBased(true);
    }
  }, []);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  // "내 주변" 토글 핸들러
  const handleToggleLocation = () => {
    if (!locationBased) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ x: longitude, y: latitude });
            setLocationBased(true);
          },
          (error) => {
            console.error("위치 정보를 가져오는 중 오류 발생:", error);
            alert("위치 정보를 가져오는 데 실패했습니다. 권한을 확인해주세요.");
          }
        );
      } else {
        alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
      }
    } else {
      setUserLocation({ x: null, y: null });
      setLocationBased(false);
    }
  };

  // 거리 슬라이더 핸들러
  const handleDistanceChange = (event) => {
    setDistance(parseInt(event.target.value, 10));
  };

  // 필터 선택 시 임시 저장
  const handleOptionClick = (categoryName, option) => {
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [categoryName]: option,
    }));
  };

  // "검색 결과 보기" 버튼 클릭 시 모든 값 전달
  const applyFilters = () => {
    let appliedFilters = { ...selectedFilters };

    if (userLocation.x !== null && userLocation.y !== null) {
      appliedFilters["location"] = { x: userLocation.x, y: userLocation.y, distance };
    } else {
      appliedFilters["location"] = null;
    }

    Object.keys(appliedFilters).forEach((category) => {
      onFilterChange(category, appliedFilters[category]);
    });

    setIsOpen(false);
  };

  return (
    <div className="relative w-full p-4 bg-white rounded-lg shadow-md">
      {/* 필터 선택 버튼 */}
      <button
        onClick={toggleDropdown}
        className="w-full py-2 px-4 bg-gray-200 text-gray-700 font-medium 
                   rounded-md shadow hover:bg-gray-300 transition-colors duration-200"
      >
        필터 선택
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white shadow-lg 
                        rounded-md p-4 z-10 max-h-[70vh] overflow-y-auto">
          
          {/* "내 주변" 토글 */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700 font-medium text-sm sm:text-base">
              📍 내 주변 검색
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={locationBased || (userLocation.x !== null && userLocation.y !== null)}
                onChange={handleToggleLocation}
              />
              <div
                className="w-10 h-5 bg-gray-300 peer-focus:ring-4 
                           peer-focus:ring-blue-300 rounded-full peer 
                           peer-checked:after:translate-x-full peer-checked:bg-blue-600 
                           after:content-[''] after:absolute after:top-0.5 after:left-0.5 
                           after:bg-white after:border after:border-gray-300 after:rounded-full 
                           after:h-4 after:w-4 after:transition-all"
              ></div>
            </label>
          </div>

          {/* 거리 조절 슬라이더 (내 주변 ON일 때만 표시) */}
          {locationBased && (
            <div className="mb-4">
              <label className="text-gray-700 text-sm">
                반경: {distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`}
              </label>
              <input
                type="range"
                min="0"
                max="300000"
                step="5000"
                value={distance}
                onChange={handleDistanceChange}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>0m</span>
                <span>50km</span>
                <span>100km</span>
                <span>150km</span>
                <span>200km</span>
                <span>300km</span>
              </div>
            </div>
          )}

          {/* 카테고리 필터 */}
          {categories.map((category) => (
            <div key={category.name} className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {category.name}
              </h4>
              <div className="flex flex-wrap gap-2">
                {category.options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleOptionClick(category.name, option.label)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1
                      transition-colors duration-200 ${
                        selectedFilters[category.name] === option.label
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-blue-100"
                      }`}
                  >
                    {option.icon} {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* "검색 결과 보기" 버튼 클릭 시 필터 적용 */}
          <button
            onClick={applyFilters}
            className="w-full py-2 bg-pink-600 text-white font-semibold
                       rounded-lg mt-2 hover:bg-pink-700 transition-colors duration-200"
          >
            검색 결과 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
