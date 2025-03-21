import React, { useState, useEffect } from 'react';

const HospitalManagementPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [missingTimeCount, setMissingTimeCount] = useState(0); // 🔹 없음 개수 상태 추가


  // 검색 및 페이지네이션 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState("전국");
  const [page, setPage] = useState(1);
  const limit = 10; // 페이지당 항목 수
  const [totalPages, setTotalPages] = useState(1);

  // Modal 관련 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'subject' 또는 'time'
  const [currentYkiho, setCurrentYkiho] = useState('');
  const [modalForm, setModalForm] = useState({});
  const [customPage, setCustomPage] = useState(page); // 직접 입력한 페이지 번호 상태
  const [rawJsonText, setRawJsonText] = useState('{}');

  const [combinedJson, setCombinedJson] = useState('');
  const [timeBulkJson, setTimeBulkJson] = useState('');

  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [enhancementStatus, setEnhancementStatus] = useState(null);

  useEffect(() => {
    if (modalOpen) {
      setRawJsonText(JSON.stringify(modalForm, null, 2));
    }
  }, [modalOpen, modalForm]);

  useEffect(() => {
    const combined = hospitals.map(h => {
      return `${h.yadmNm} ${h.addr} 조사하고 "ykiho": "${h.ykiho}" "_id :" "${h.time?._id ?? 'null'}" 추가해줘라`;
    });
    // JSON 배열 형식으로 저장
    setCombinedJson(JSON.stringify(combined, null, 2));
  }, [hospitals]);

  useEffect(() => {
    const times = hospitals.map(h => {
      return {
        time: h.time || null
      };
    });
    setTimeBulkJson(JSON.stringify(times, null, 2));
  }, [hospitals]);

  const filterRegions = [
    { label: "전국", icon: "🌍" },
    { label: "서울", icon: "🏙️" },
    { label: "경기", icon: "🏞️" },
    { label: "부산", icon: "🌊" },
    { label: "경남", icon: "🌾" },
    { label: "대구", icon: "🏞️" },
    { label: "인천", icon: "✈️" },
    { label: "경북", icon: "🌾" },
    { label: "전북", icon: "🌻" },
    { label: "충남", icon: "🌳" },
    { label: "전남", icon: "🌻" },
    { label: "대전", icon: "🌳" },
    { label: "광주", icon: "🌻" },
    { label: "충북", icon: "🌳" },
    { label: "강원", icon: "⛰️" },
    { label: "울산", icon: "🌾" },
    { label: "제주", icon: "🏝️" },
    { label: "세종시", icon: "🏢" },
  ];

  // fetchHospitals 함수 정의
  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      if (selectedRegion !== "전국") {
        queryParams.append("region", selectedRegion);
      }

      const res = await fetch(`http://localhost:3001/api/hospitals?${queryParams.toString()}`);
      const data = await res.json();
      setHospitals(data.hospitals);
      const count = data.hospitals.filter(hospital => !hospital.time).length;
      setMissingTimeCount(count);
      setTotalPages(Math.ceil(data.totalCount / limit));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // useEffect에서 fetchHospitals 호출
  useEffect(() => {
    fetchHospitals();
  }, [page, searchQuery, selectedRegion]);

   // 🔹 지역 필터 버튼 클릭 이벤트
   const handleRegionFilter = (region) => {
    setSelectedRegion(region);
    setPage(1); // 지역 필터 변경 시 첫 페이지부터 시작
  };

  const handlePageInputChange = (e) => {
    let value = e.target.value;
    if (value === '' || isNaN(value)) {
      setCustomPage('');
    } else {
      setCustomPage(Math.max(1, Math.min(totalPages, Number(value)))); // 1~최대 페이지 사이 값 유지
    }
  };
  
  const goToCustomPage = () => {
    if (customPage >= 1 && customPage <= totalPages) {
      setPage(customPage);
    } else {
      alert(`1~${totalPages} 사이의 페이지 번호를 입력하세요.`);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // 검색 시 첫 페이지부터 시작
  };

  const openModal = (type, ykiho, existingData = {}) => {
    // `hospital`의 데이터를 `existingData`로 전달
    const selectedHospital = hospitals.find(hospital => hospital.ykiho === ykiho);
    setModalType(type);
    setCurrentYkiho(ykiho);
    setModalForm({
      ...existingData,
      yadmNm: selectedHospital ? selectedHospital.yadmNm : '',
      addr: selectedHospital ? selectedHospital.addr : ''
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalForm({});
    setCurrentYkiho('');
    setModalType('');
  };

  const handleModalFormChange = (field, value) => {
    setModalForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitModalForm = async () => {
    try {
      let url = '';
      if (modalType === 'subject') {
        url = `http://localhost:3001/api/hospitals/${currentYkiho}/subject`;
      } else if (modalType === 'time') {
        url = `http://localhost:3001/api/hospitals/${currentYkiho}/time`;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalForm),
      });
      const result = await res.json();

      if (!result || Object.keys(result).length === 0) {
        alert("수정된 데이터가 올바르지 않습니다.");
        return;
      }
  
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.ykiho === currentYkiho) {
            return {
              ...h,
              subject: modalType === 'subject' ? result.subject || h.subject : h.subject,
              time: modalType === 'time' ? result.time || h.time : h.time,
            };
          }
          return h;
        })
      );
  
      closeModal();
    } catch (err) {
      console.error(err);
      alert("서버에서 데이터를 업데이트하는 중 오류가 발생했습니다.");
    }
  };

  // 🔹 JSON 붙여넣기 이벤트 처리 함수
  const handlePasteData = (e) => {
    try {
      const data = JSON.parse(e.target.value); // JSON 데이터 파싱
      setModalForm((prev) => ({
        ...prev,
        ...data, // 기존 폼에 새로운 데이터 반영
      }));
    } catch (error) {
      alert("잘못된 JSON 형식입니다.");
    }
  };

  const bulkUpdateTime = async () => {
    try {
      const parsedTimeData = JSON.parse(timeBulkJson);
      // time 키 내부의 객체만 뽑아내어 새로운 배열로 만듭니다.
      const flattenedData = parsedTimeData.map(item => item.time);
      
      // flattenedData의 각 항목에 대해 API 호출
      for (let data of flattenedData) {
        const { ykiho } = data;
        await fetch(`http://localhost:3001/api/hospitals/${ykiho}/time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // 여기서 data 객체 자체를 전송합니다.
          body: JSON.stringify(data),
        });
      }
      alert("전체 Time 데이터가 저장되었습니다.");
    } catch (error) {
      alert("전체 저장 중 오류가 발생했습니다: " + error.message);
    }
  };
  
  // 데이터 품질 평가 함수
  const fetchQualityMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/data-quality');
      const data = await response.json();
      setQualityMetrics(data);
    } catch (error) {
      console.error('데이터 품질 평가 실패:', error);
    }
  };

  // 데이터 자동 보완 함수
  const enhanceData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/admin/auto-enhance', {
        method: 'POST'
      });
      const data = await response.json();
      setEnhancementStatus(data);
      // 데이터 갱신
      fetchHospitals();
      fetchQualityMetrics();
    } catch (error) {
      console.error('데이터 자동 보완 실패:', error);
    }
  };

  useEffect(() => {
    fetchQualityMetrics();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">병원 관리</h1>

      {/* 데이터 품질 관리 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">데이터 품질 관리</h2>
        
        {qualityMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold">기본 정보 완성도</h3>
              <p className="text-2xl">{qualityMetrics.completeness.basic}%</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold">진료과목 정보</h3>
              <p className="text-2xl">{qualityMetrics.completeness.subject}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="font-semibold">진료시간 정보</h3>
              <p className="text-2xl">{qualityMetrics.completeness.time}%</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={enhanceData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            데이터 자동 보완
          </button>
        </div>

        {enhancementStatus && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">보완 결과</h3>
            <p>성공: {enhancementStatus.enhanced}건</p>
            <p>실패: {enhancementStatus.failed}건</p>
            {enhancementStatus.details.length > 0 && (
              <div className="mt-2">
                <h4 className="font-semibold">실패 상세</h4>
                <ul className="list-disc pl-5">
                  {enhancementStatus.details.map((detail, index) => (
                    <li key={index}>
                      {detail.ykiho}: {detail.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔹 `time` 값이 없는 병원 수 표시 */}
      <div className="text-center text-lg font-semibold text-red-500 mb-4">
        "Time 없음" 입력이 필요한 병원: {missingTimeCount} 개
      </div>
      
      {/* 🔹 지역 필터 버튼 */}
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {filterRegions.map((region) => (
          <button
            key={region.label}
            onClick={() => handleRegionFilter(region.label)}
            className={`px-4 py-2 rounded ${
              selectedRegion === region.label
                ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-700"
                }`}
              >
            {region.icon} {region.label}
          </button>
        ))}
      </div>

      {/* 검색 및 페이지네이션 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <input
          type="text"
          placeholder="병원 검색..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded px-4 py-2 w-full md:w-1/3 mb-4 md:mb-0"
        />
       <div className="flex items-center space-x-4">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
          >
            이전
          </button>

          <span className="text-gray-700">
            {page} / {totalPages}
          </span>

          {/* 🔹 페이지 번호 입력 필드 & 이동 버튼 추가 */}
          <input
            type="number"
            value={customPage}
            onChange={handlePageInputChange}
            className="border border-gray-300 rounded px-2 py-1 w-16 text-center"
            placeholder="번호"
            min="1"
            max={totalPages}
          />
          <button
            onClick={goToCustomPage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            이동
          </button>

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>
      
      {loading && <p className="text-center">로딩 중...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">병원명</th>
              <th className="border p-2 text-left">주소</th>
              <th className="border p-2 text-left">외과/내과</th>
              <th className="border p-2 text-left">시간데이터</th>
              <th className="border p-2 text-left">확인</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(hospitals) && hospitals.length > 0 ? (
              hospitals.map((hospital) => (
                <tr key={hospital._id || hospital.ykiho} className="hover:bg-gray-50">
                  <td className="border p-2">{hospital.yadmNm || "-"}</td>
                  <td className="border p-2">{hospital.addr || "-"}</td>
                  <td className="border p-2">
                    {hospital.subject?.dgsbjtCdNm ? (
                      <div>
                        <p className="font-semibold">{hospital.subject.dgsbjtCdNm}</p>
                        <p>{hospital.subject.dgsbjtCd}</p>
                        <button
                          onClick={() => openModal("subject", hospital.ykiho, hospital.subject)}
                          className="text-blue-500 underline text-sm mt-1"
                        >
                          수정
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500">없음</p>
                        <button
                          onClick={() => openModal("subject", hospital.ykiho)}
                          className="text-blue-500 underline text-sm mt-1"
                        >
                          입력
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="border p-2 time-value">
                    {hospital.time?.emyDayYn ? (
                      <div>
                        <p className="font-semibold">{hospital.time.emyDayYn}</p>
                        <button
                          onClick={() => openModal("time", hospital.ykiho, hospital.time)}
                          className="text-blue-500 underline text-sm mt-1"
                        >
                          수정
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500">없음</p>
                        <button
                          onClick={() => openModal("time", hospital.ykiho)}
                          className="text-blue-500 underline text-sm mt-1"
                        >
                          입력
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="border p-2 time-value">
                    {hospital.time?.trmtMonStart || hospital.time?.trmtTueStart ||
                    hospital.time?.trmtWedStart || hospital.time?.trmtThuStart ||
                    hospital.time?.trmtFriStart ? (
                      <div>
                        <p className="font-semibold">✔</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500">없음</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 p-4">
                  병원 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 🔹 통합 미리보기 영역 (combinedJson) */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">통합 미리보기 (JSON)</h2>
        <textarea
          value={combinedJson}
          onChange={(e) => setCombinedJson(e.target.value)}
          className="border rounded px-2 py-1 w-full h-48"
        />
      </div>
      
      {/* 전체 Time 값 보기 및 JSON 미리보기 영역 */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">전체 Time 값 보기 (JSON)</h2>
        <textarea
          value={timeBulkJson}
          onChange={(e) => setTimeBulkJson(e.target.value)}
          className="border rounded px-2 py-1 w-full h-48"
          placeholder="여기에 전체 Time 값을 JSON 형식으로 수정할 수 있습니다."
        />
        <button
          onClick={bulkUpdateTime}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        >
          전체 저장
        </button>
      </div>

      {/* Modal Popup */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/3 max-h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {modalType === 'subject' ? 'Subject 입력/수정' : 'Time 입력/수정'}
            </h2>
            <div className="mb-4">
              <label className="block mb-1-chatGpt">JSON </label>
              <textarea
                readOnly
                value={JSON.stringify(modalForm, null, 2)}
                className="border rounded px-2 py-1 w-full h-32"
              />
            </div>

            {/* JSON 데이터 붙여넣기 영역 */}
            <div className="mb-4">
              <label className="block mb-1">JSON 데이터 붙여넣기</label>
              <textarea
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                className="border rounded px-2 py-1 w-full h-32"
                placeholder="여기에 JSON 데이터를 붙여넣으세요."
              />
            </div>

            <div className="mb-4">
              <button
                onClick={() => {
                  try {
                    const parsedData = JSON.parse(rawJsonText);
                    setModalForm(parsedData);
                  } catch (error) {
                    alert("올바른 JSON 형식을 입력해주세요.");
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              >
                JSON 미리보기
              </button>
            </div>
            {modalType === 'subject' ? (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1">대상 코드</label>
                  <input 
                    type="text" 
                    value={modalForm.dgsbjtCd || ''} 
                    onChange={(e) => handleModalFormChange('dgsbjtCd', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">대상 코드명</label>
                  <input 
                    type="text" 
                    value={modalForm.dgsbjtCdNm || ''} 
                    onChange={(e) => handleModalFormChange('dgsbjtCdNm', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">cdiagDrCnt</label>
                  <input 
                    type="number" 
                    value={modalForm.cdiagDrCnt || 0} 
                    onChange={(e) => handleModalFormChange('cdiagDrCnt', Number(e.target.value))} 
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-1">dgsbjtPrSdrCnt</label>
                  <input 
                    type="number" 
                    value={modalForm.dgsbjtPrSdrCnt || 0} 
                    onChange={(e) => handleModalFormChange('dgsbjtPrSdrCnt', Number(e.target.value))} 
                    className="border rounded px-2 py-1 w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 긴급주간 */}
                <div className="mt-4 flex justify-end space-x-4">
                  <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">
                    취소
                  </button>
                  <button onClick={submitModalForm} className="px-4 py-2 bg-blue-500 text-white rounded">
                    저장
                  </button>
                </div>
                <div>
                <label className="block mb-1">긴급주간 전화번호1</label>
                <input 
                    type="text" 
                    value={modalForm.emyDayTelNo1 || ''} 
                    onChange={(e) => handleModalFormChange('emyDayTelNo1', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">긴급주간 전화번호2</label>
                <input 
                    type="text" 
                    value={modalForm.emyDayTelNo2 || ''} 
                    onChange={(e) => handleModalFormChange('emyDayTelNo2', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">긴급주간 여부 (emyDayYn)</label>
                <input 
                    type="text" 
                    value={modalForm.emyDayYn || ''} 
                    onChange={(e) => handleModalFormChange('emyDayYn', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                {/* 긴급야간 */}
                <div>
                <label className="block mb-1">긴급야간 전화번호1</label>
                <input 
                    type="text" 
                    value={modalForm.emyNgtTelNo1 || ''} 
                    onChange={(e) => handleModalFormChange('emyNgtTelNo1', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">긴급야간 전화번호2</label>
                <input 
                    type="text" 
                    value={modalForm.emyNgtTelNo2 || ''} 
                    onChange={(e) => handleModalFormChange('emyNgtTelNo2', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">긴급야간 여부 (emyNgtYn)</label>
                <input 
                    type="text" 
                    value={modalForm.emyNgtYn || ''} 
                    onChange={(e) => handleModalFormChange('emyNgtYn', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                {/* 점심시간 */}
                <div>
                <label className="block mb-1">점심시간 (lunchWeek)</label>
                <input 
                    type="text" 
                    value={modalForm.lunchWeek || ''} 
                    onChange={(e) => handleModalFormChange('lunchWeek', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                {/* 휴진 */}
                <div>
                <label className="block mb-1">휴진일 (noTrmtHoli)</label>
                <input 
                    type="text" 
                    value={modalForm.noTrmtHoli || ''} 
                    onChange={(e) => handleModalFormChange('noTrmtHoli', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">일요일 진료 (noTrmtSun)</label>
                <input 
                    type="text" 
                    value={modalForm.noTrmtSun || ''} 
                    onChange={(e) => handleModalFormChange('noTrmtSun', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                {/* 주차 관련 */}
                <div>
                <label className="block mb-1">주차 기타 (parkEtc)</label>
                <input 
                    type="text" 
                    value={modalForm.parkEtc || ''} 
                    onChange={(e) => handleModalFormChange('parkEtc', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">주차 수량 (parkQty)</label>
                <input 
                    type="number" 
                    value={modalForm.parkQty || 0} 
                    onChange={(e) => handleModalFormChange('parkQty', Number(e.target.value))} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">주차 비용 여부 (parkXpnsYn)</label>
                <input 
                    type="text" 
                    value={modalForm.parkXpnsYn || ''} 
                    onChange={(e) => handleModalFormChange('parkXpnsYn', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                {/* 접수 관련 */}
                <div>
                <label className="block mb-1">진료 방향 (plcDir)</label>
                <input 
                    type="text" 
                    value={modalForm.plcDir || ''} 
                    onChange={(e) => handleModalFormChange('plcDir', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">진료 거리 (plcDist)</label>
                <input 
                    type="text" 
                    value={modalForm.plcDist || ''} 
                    onChange={(e) => handleModalFormChange('plcDist', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">진료 장소명 (plcNm)</label>
                <input 
                    type="text" 
                    value={modalForm.plcNm || ''} 
                    onChange={(e) => handleModalFormChange('plcNm', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">토요일 접수 (rcvSat)</label>
                <input 
                    type="text" 
                    value={modalForm.rcvSat || ''} 
                    onChange={(e) => handleModalFormChange('rcvSat', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">주중 접수 (rcvWeek)</label>
                <input 
                    type="text" 
                    value={modalForm.rcvWeek || ''} 
                    onChange={(e) => handleModalFormChange('rcvWeek', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                {/* 요일별 진료 시간 */}
                <div>
                <label className="block mb-1">월요일 진료 종료 (trmtMonEnd)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtMonEnd || ''} 
                    onChange={(e) => handleModalFormChange('trmtMonEnd', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">월요일 진료 시작 (trmtMonStart)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtMonStart || ''} 
                    onChange={(e) => handleModalFormChange('trmtMonStart', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                {/* 평일 동일 적용 버튼 */}
                <div className="flex items-center space-x-2 py-2">
                <button
                    onClick={() => {
                    setModalForm(prev => ({
                        ...prev,
                        trmtTueStart: prev.trmtMonStart,
                        trmtTueEnd: prev.trmtMonEnd,
                        trmtWedStart: prev.trmtMonStart,
                        trmtWedEnd: prev.trmtMonEnd,
                        trmtThuStart: prev.trmtMonStart,
                        trmtThuEnd: prev.trmtMonEnd,
                        trmtFriStart: prev.trmtMonStart,
                        trmtFriEnd: prev.trmtMonEnd
                    }));
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    평일 동일 적용
                </button>
                <span className="text-sm">월요일 값으로 화~금 자동 채우기 (후에 수정 가능)</span>
                </div>
                <div>
                <label className="block mb-1">화요일 진료 종료 (trmtTueEnd)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtTueEnd || ''} 
                    onChange={(e) => handleModalFormChange('trmtTueEnd', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">화요일 진료 시작 (trmtTueStart)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtTueStart || ''} 
                    onChange={(e) => handleModalFormChange('trmtTueStart', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">수요일 진료 종료 (trmtWedEnd)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtWedEnd || ''} 
                    onChange={(e) => handleModalFormChange('trmtWedEnd', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">수요일 진료 시작 (trmtWedStart)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtWedStart || ''} 
                    onChange={(e) => handleModalFormChange('trmtWedStart', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">목요일 진료 종료 (trmtThuEnd)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtThuEnd || ''} 
                    onChange={(e) => handleModalFormChange('trmtThuEnd', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">목요일 진료 시작 (trmtThuStart)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtThuStart || ''} 
                    onChange={(e) => handleModalFormChange('trmtThuStart', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">금요일 진료 종료 (trmtFriEnd)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtFriEnd || ''} 
                    onChange={(e) => handleModalFormChange('trmtFriEnd', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">금요일 진료 시작 (trmtFriStart)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtFriStart || ''} 
                    onChange={(e) => handleModalFormChange('trmtFriStart', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">토요일 진료 종료 (trmtSatEnd)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtSatEnd || ''} 
                    onChange={(e) => handleModalFormChange('trmtSatEnd', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
                <div>
                <label className="block mb-1">토요일 진료 시작 (trmtSatStart)</label>
                <input 
                    type="text" 
                    value={modalForm.trmtSatStart || ''} 
                    onChange={(e) => handleModalFormChange('trmtSatStart', e.target.value)} 
                    className="border rounded px-2 py-1 w-full"
                />
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-end space-x-4">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">
                취소
              </button>
              <button onClick={submitModalForm} className="px-4 py-2 bg-blue-500 text-white rounded">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementPage;