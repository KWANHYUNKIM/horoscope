import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const [serverLogs, setServerLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const messagesEndRef = useRef(null);

  // 위치 권한 상태 확인
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permissionStatus => {
          setLocationPermission(permissionStatus.state);
          permissionStatus.addEventListener('change', () => {
            setLocationPermission(permissionStatus.state);
          });
        });
    }
  }, []);

  // 위치 정보 가져오기
  const getLocation = () => {
    if (!navigator.geolocation) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: '죄송합니다. 브라우저가 위치 정보를 지원하지 않습니다.'
      }]);
      return;
    }

    // 위치 정보 요청 옵션 설정
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10초
      maximumAge: 0
    };

    // 로딩 메시지 표시
    setMessages(prev => [...prev, {
      type: 'bot',
      content: '위치 정보를 가져오는 중입니다...'
    }]);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCoordinates(newLocation);
        setLocationPermission('granted');
        
        // 위치 정보를 주소로 변환
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLocation.latitude}&lon=${newLocation.longitude}`)
          .then(response => response.json())
          .then(data => {
            setLocation(data.display_name);
            setMessages(prev => [...prev, {
              type: 'bot',
              content: '위치 정보가 성공적으로 가져와졌습니다. 이제 주변 병원을 검색할 수 있습니다.'
            }]);
          })
          .catch(error => {
            console.error('Geocoding error:', error);
            setLocation('위치 정보를 가져왔습니다.');
          });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = '위치 정보를 가져오는데 실패했습니다. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '위치 정보 접근 권한이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage += '위치 정보 요청 시간이 초과되었습니다. 다시 시도해주세요.';
            break;
          default:
            errorMessage += '알 수 없는 오류가 발생했습니다.';
            break;
        }

        setMessages(prev => [...prev, {
          type: 'bot',
          content: `
            <div class="location-error">
              <p>${errorMessage}</p>
              <button 
                onclick="window.requestLocationPermission()"
                class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-2"
              >
                다시 시도하기
              </button>
            </div>
          `
        }]);
      },
      options
    );
  };

  // 위치 권한 요청 메시지 표시
  const showLocationPermissionRequest = () => {
    setMessages(prev => [...prev, {
      type: 'bot',
      content: `
        <div class="location-permission-request">
          <p>위치 기반 병원 검색을 위해 위치 정보 접근 권한이 필요합니다.</p>
          <p class="text-sm text-gray-600 mt-1">위치 정보는 주변 병원 검색에만 사용됩니다.</p>
          <button 
            onclick="window.requestLocationPermission()"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-2"
          >
            위치 권한 허용하기
          </button>
        </div>
      `
    }]);
  };

  // 전역 함수 등록
  useEffect(() => {
    window.requestLocationPermission = getLocation;
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await axios.post('/api/chat', { message: userMessage });
      const botResponse = response.data.message;

      // 병원 검색인 경우 위치 정보 확인
      if (botResponse.includes('내 주변 병원 검색 결과') && !coordinates && locationPermission !== 'granted') {
        showLocationPermissionRequest();
        return;
      }

      setServerLogs(prev => [...prev, {
        timestamp: new Date().toLocaleString(),
        request: {
          message: userMessage,
          location,
          coordinates
        },
        response: botResponse
      }]);

      setMessages(prev => [...prev, { type: 'bot', content: botResponse }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: '죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.' 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-7xl mx-auto p-5 bg-gray-50">
      <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm mb-5">
        <h2 className="text-xl font-semibold text-gray-800">병원 검색 챗봇</h2>
        <button 
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          onClick={() => setShowLogs(!showLogs)}
        >
          {showLogs ? '로그 숨기기' : '로그 보기'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 bg-white rounded-lg shadow-sm mb-5">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`relative max-w-[70%] ${message.type === 'user' 
              ? 'bg-purple-600 text-white rounded-lg'
              : 'bg-gray-100 text-gray-800 rounded-lg'
            }`}>
              {message.type === 'user' && (
                // 사용자 말풍선 꼬리 (오른쪽)
                <div className="absolute right-[-10px] top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-10 border-l-purple-600"></div>
              )}
              {message.type === 'bot' && (
                // 챗봇 말풍선 꼬리 (왼쪽)
                <div className="absolute left-[-10px] top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-10 border-r-gray-100"></div>
              )}
              <div className="p-3">
                {message.type === 'bot' ? (
                  <div 
                    className="message-content prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: message.content.replace(
                        /<div class="message-content"/g, 
                        '<div class="message-content" style="padding: 10px; border-radius: 8px; max-width: 100%; word-break: break-word;"'
                      )
                    }} 
                  />
                ) : (
                  message.content
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 p-4 bg-white rounded-lg shadow-sm">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="메시지를 입력하세요..."
          className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
        />
        <button 
          onClick={handleSendMessage}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          전송
        </button>
      </div>

      {showLogs && (
        <div className="mt-5 bg-white rounded-lg shadow-sm p-5">
          <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-purple-600 pb-2 mb-4">
            서버 로그
          </h3>
          <div className="max-h-[300px] overflow-y-auto">
            {serverLogs.map((log, index) => (
              <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-600">
                <div className="text-sm text-gray-500 mb-2">{log.timestamp}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h4 className="text-sm font-semibold text-purple-600 mb-2">요청</h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.request, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h4 className="text-sm font-semibold text-green-600 mb-2">응답</h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;