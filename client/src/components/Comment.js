import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';

const Comment = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [showMention, setShowMention] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent('');
    }
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
              handleSubmit(e);
            }
          }}
          placeholder="댓글을 입력하세요..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            댓글 작성
          </button>
        </div>
      </form>

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
        </div>
      )}
    </div>
  );
};

export default Comment; 