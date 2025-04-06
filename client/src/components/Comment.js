import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import axios from 'axios';
import { getApiUrl } from '../utils/api';

const Comment = ({ onSubmit, boardId }) => {
  const [content, setContent] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [taggedHospitals, setTaggedHospitals] = useState([]);
  const [hospitalDetails, setHospitalDetails] = useState({});
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!searchTerm) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      api.get(`/api/autocomplete?query=${encodeURIComponent(searchTerm)}`)
        .then((response) => {
          setSuggestions(response.data.hospital || []);
        })
        .catch(() => {
          setSuggestions([]);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchHospitalDetails = async (ykiho) => {
    try {
      console.log('병원 정보 조회 시작:', ykiho); // 디버깅용 로그
      const response = await axios.get(`${getApiUrl()}/api/hospitals/${ykiho}`, { withCredentials: true });
      console.log('병원 정보 조회 성공:', response.data); // 디버깅용 로그
      return response.data;
    } catch (error) {
      console.error('병원 정보 조회 실패:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      const details = {};
      for (const hospital of taggedHospitals) {
        if (hospital.ykiho) {
          const hospitalData = await fetchHospitalDetails(hospital.ykiho);
          if (hospitalData) {
            details[hospital.ykiho] = hospitalData;
          }
        }
      }
      setHospitalDetails(details);
    };

    if (taggedHospitals.length > 0) {
      fetchDetails();
    }
  }, [taggedHospitals]);

  const handleInput = (e) => {
    const value = e.target.value;
    setContent(value);

    // @ 입력 감지
    const lastAtSymbol = value.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const rect = textareaRef.current.getBoundingClientRect();
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPosition);
      const lastAtSymbolInText = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtSymbolInText !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtSymbolInText + 1);
        if (!textAfterAt.includes(' ')) {
          // 커서 위치 계산
          const textBeforeAt = textBeforeCursor.substring(0, lastAtSymbolInText);
          const lines = textBeforeAt.split('\n');
          const currentLine = lines[lines.length - 1];
          
          setMentionPosition({
            top: rect.top + (lines.length * 20) + 30,
            left: rect.left + (currentLine.length * 8)
          });
          
          // 검색어 설정
          setSearchTerm(textAfterAt);
          setShowMention(true);
          return;
        }
      }
    }
    setShowMention(false);
  };

  const handleMentionSelect = (hospital) => {
    const lastAtSymbol = content.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      const beforeAt = content.substring(0, lastAtSymbol);
      const afterAt = content.substring(lastAtSymbol);
      const afterSpace = afterAt.indexOf(' ');
      const newContent = afterSpace === -1 
        ? `${beforeAt}@${hospital.name} `
        : `${beforeAt}@${hospital.name}${afterAt.substring(afterSpace)}`;
      
      setContent(newContent);
      setShowMention(false);
      
      // 태그된 병원 목록에 추가 (중복 체크)
      if (!taggedHospitals.some(h => h.id === hospital.dbId)) {
        setTaggedHospitals(prev => [...prev, {
          id: hospital.dbId,        // 실제 데이터베이스 ID
          name: hospital.name,      // 병원 이름
          typeId: 1                 // 병원 태그 타입 ID
        }]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 댓글 내용이 비어있는지 확인
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      // 태그된 병원 정보가 있는지 확인
      if (taggedHospitals.length === 0) {
        // 태그된 병원이 없는 경우 일반 댓글 작성
        const response = await api.post(`/api/boards/${boardId}/comments`, {
          comment: trimmedContent
        });

        if (response.data.success) {
          onSubmit(response.data.comment);
          setContent('');
          setTaggedHospitals([]);
        }
      } else {
        // 태그된 병원이 있는 경우 태그 정보와 함께 댓글 작성
        const response = await api.post(`/api/boards/${boardId}/comments`, {
          comment: trimmedContent,
          entityTags: taggedHospitals.map(hospital => ({
            typeId: hospital.typeId,
            entityId: hospital.id,    // 실제 데이터베이스 ID
            entityName: hospital.name
          }))
        });

        if (response.data.success) {
          onSubmit(response.data.comment);
          setContent('');
          setTaggedHospitals([]);
        }
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      alert('댓글 작성에 실패했습니다.');
    }
  };

  // 댓글 내용에서 @ 태그를 파싱하는 함수
  const renderContent = (text) => {
    const parts = text.split(/(@[^\s]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const hospitalName = part.substring(1);
        const hospital = taggedHospitals.find(h => h.name === hospitalName);
        
        if (hospital) {
          return (
            <span key={index} className="relative group inline-block">
              <span className="text-blue-600 font-medium cursor-pointer hover:bg-blue-50">
                {part}
              </span>
              {hospitalDetails[hospital.id] && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                  <h3 className="font-bold text-sm mb-1">{hospitalDetails[hospital.id].name}</h3>
                  <p className="text-xs text-gray-600 mb-1">{hospitalDetails[hospital.id].address}</p>
                  <p className="text-xs text-gray-600">전화: {hospitalDetails[hospital.id].phone}</p>
                </div>
              )}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              // 폼 제출 이벤트를 직접 발생시킴
              e.target.form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
          }}
          placeholder="댓글을 입력하세요..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
        
        {/* 태그된 병원 미리보기 */}
        {taggedHospitals.length > 0 && (
          <div className="mt-2">
            <div className="text-sm text-gray-500 mb-1">태그된 병원:</div>
            <div className="flex flex-wrap gap-2">
              {taggedHospitals.map(hospital => (
                <span
                  key={hospital.id}
                  className="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-full"
                >
                  @{hospital.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            댓글 작성
          </button>
        </div>
      </form>

      {/* 멘션 제안 */}
      {showMention && (
        <div
          style={{
            position: 'fixed',
            top: mentionPosition.top,
            left: mentionPosition.left
          }}
          className="z-50"
        >
          <div className="w-64 bg-white border border-gray-300 rounded-lg shadow-lg">
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
              {suggestions.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">검색 결과가 없습니다.</div>
              ) : (
                suggestions.map((hospital) => (
                  <div
                    key={hospital.id}
                    onClick={() => handleMentionSelect(hospital)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                    <div className="text-xs text-gray-500">{hospital.address}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comment; 