// src/components/FilterDropdown.jsx
import React, { useState } from "react";

const FilterDropdown = ({ categories, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const toggleAvailability = () => setIsAvailable((prev) => !prev);

  const handleOptionClick = (categoryName, option) => {
    onFilterChange(categoryName, option);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full p-4 bg-white rounded-lg shadow-md">
      {/* 예약 가능 병원 보기 (토글 스위치) */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-700 font-medium text-sm sm:text-base">
          예약 가능한 병원 보기
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isAvailable}
            onChange={toggleAvailability}
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
                        category.state === option.label
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

          {/* 병원 보기 버튼 */}
          <button className="w-full py-2 bg-pink-600 text-white font-semibold 
                             rounded-lg mt-2 hover:bg-pink-700 transition-colors duration-200">
            검색 결과 보기
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
