import { useState, useEffect } from "react";

const HospitalMajorList = ({ majors }) => {
  const [maxVisibleItems, setMaxVisibleItems] = useState(3);

  useEffect(() => {
    const updateMaxVisibleItems = () => {
      if (window.innerWidth >= 1024) {
        setMaxVisibleItems(6); // 노트북 이상 → 최대 6개 표시
      } else if (window.innerWidth >= 768) {
        setMaxVisibleItems(4); // 태블릿 → 최대 4개 표시
      } else {
        setMaxVisibleItems(3); // 모바일 → 최대 3개 표시
      }
    };

    updateMaxVisibleItems();
    window.addEventListener("resize", updateMaxVisibleItems);
    return () => window.removeEventListener("resize", updateMaxVisibleItems);
  }, []);

  if (!majors || majors.length === 0) {
    return (
      <div className="mt-2">
        <p className="font-semibold text-gray-700">진료과:</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="bg-gray-200 px-3 py-1 text-sm rounded-md text-gray-500">
            정보 없음
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="font-semibold text-gray-700">진료과:</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
        {/* 반응형으로 동적 개수 설정 */}
        {majors.slice(0, maxVisibleItems).map((major, index) => (
          <span
            key={index}
            className="bg-gray-200 px-3 py-1 text-sm rounded-md"
          >
            {major}
          </span>
        ))}

        {/* "더보기..."를 동적으로 추가 */}
        {majors.length > maxVisibleItems && (
          <span className="bg-gray-300 px-3 py-1 text-sm rounded-md text-gray-700 cursor-pointer relative group">
            더보기...
            <div className="hidden group-hover:flex flex-col absolute left-0 top-full mt-1 bg-white shadow-lg p-2 rounded-md border z-50 w-40 md:w-48 max-h-[150px] overflow-y-auto pointer-events-auto">
              <div className="grid grid-cols-2 gap-1">
                {majors.slice(maxVisibleItems).map((major, index) => (
                  <div key={index} className="py-0.5">{major}</div>
                ))}
              </div>
            </div>
          </span>
        )}
      </div>
    </div>
  );
};

export default HospitalMajorList;
