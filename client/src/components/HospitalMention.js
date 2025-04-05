import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';

const HospitalMention = ({ onSelect, onClose }) => {
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/hospitals');
        const hospitalsData = Array.isArray(response.data) ? response.data : [];
        setHospitals(hospitalsData);
        setFilteredHospitals(hospitalsData);
      } catch (error) {
        console.error('병원 데이터 로딩 오류:', error);
        setHospitals([]);
        setFilteredHospitals([]);
      } finally {
        setLoading(false);
      }
    };

    loadHospitals();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = hospitals.filter(hospital =>
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHospitals(filtered);
    } else {
      setFilteredHospitals(hospitals);
    }
  }, [searchTerm, hospitals]);

  const handleSelect = (hospital) => {
    onSelect(hospital);
    onClose();
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute z-50 w-64 bg-white border border-gray-300 rounded-lg shadow-lg mt-1"
    >
      <div className="p-2 border-b">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="병원 검색..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      
      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="p-2 text-sm text-gray-500">로딩 중...</div>
        ) : !Array.isArray(filteredHospitals) || filteredHospitals.length === 0 ? (
          <div className="p-2 text-sm text-gray-500">검색 결과가 없습니다.</div>
        ) : (
          filteredHospitals.map(hospital => (
            <div
              key={hospital.id}
              onClick={() => handleSelect(hospital)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                <div className="text-xs text-gray-500">{hospital.address}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HospitalMention; 