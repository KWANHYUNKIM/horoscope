import React, { useState, useRef, useEffect } from 'react';

// 간단한 채팅창 컴포넌트
const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "안녕하세요! 증상을 입력해주시면 추천을 도와드리겠습니다." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: input }]);

    // (실제 AI API 호출 등은 여기서 처리)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "입력하신 증상을 분석 중입니다..." },
      ]);
    }, 500);

    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.sender === "user" ? "text-right" : "text-left"}
          >
            <div
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t">
        <input
          type="text"
          className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="증상을 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
      </div>
    </div>
  );
};

const Message = ({ message }) => {
  if (message.type === 'bot') {
    return (
      <div className="flex items-start mb-4">
        {/* 챗봇 프로필 이미지 */}
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        {/* 챗봇 메시지 */}
        <div className="relative max-w-[70%]">
          {/* 말풍선 꼬리 (왼쪽) */}
          <div className="absolute left-[-10px] top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-10 border-r-gray-100"></div>
          <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
            <div 
              className="message-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-end mb-4">
      {/* 사용자 메시지 */}
      <div className="relative max-w-[70%]">
        {/* 말풍선 꼬리 (오른쪽) */}
        <div className="absolute right-[-10px] top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-10 border-l-purple-600"></div>
        <div className="bg-purple-600 text-white p-3 rounded-lg">
          <div className="message-content">{message.content}</div>
        </div>
      </div>
    </div>
  );
};

const BigChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: '안녕하세요! 검색하고 싶은 지역을 말씀해주시거나, "내 주변"이라고 입력하시면 현재 위치 기준으로 검색해드립니다!'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // 위치 정보 가져오기
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('위치 정보를 지원하지 않는 브라우저입니다.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log('위치 정보:', coordinates); // 디버깅용 로그
          resolve(coordinates);
        },
        (error) => {
          console.error('위치 정보 오류:', error); // 디버깅용 로그
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  useEffect(() => {
    // 음성 인식 객체 초기화
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ko-KR';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('음성 인식이 지원되지 않는 브라우저입니다.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // 사용자 메시지 추가
    setMessages(prev => [...prev, { type: 'user', content: inputMessage }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 일반 검색
      const response = await fetch('http://localhost:3001/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user',
          message: inputMessage.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { type: 'bot', content: data.message }]);
    } catch (error) {
      console.error('Chat API Error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: '죄송합니다. 현재 서비스에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 모달이 닫혀 있을 때 표시되는 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors duration-200 z-50"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* 모달 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">병원 검색 도우미</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message, index) => (
                <Message key={index} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-black"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-3 rounded-lg ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gray-500 hover:bg-gray-600'
                  } text-white transition-colors`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  전송
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  messageContent: {
    padding: '10px',
    borderRadius: '8px',
    maxWidth: '80%',
    wordBreak: 'break-word',
    '& .search-results': {
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    '& .search-header': {
      marginBottom: '20px',
      textAlign: 'center',
      '& h2': {
        color: '#333',
        fontSize: '1.5em',
        margin: '0',
      },
    },
    '& .hospital-list': {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    '& .hospital-card': {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '15px',
      border: '1px solid #e9ecef',
    },
    '& .hospital-info': {
      '& h3': {
        color: '#2c3e50',
        margin: '0 0 10px 0',
        fontSize: '1.2em',
      },
    },
    '& .hospital-details': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '10px',
      '& p': {
        margin: '5px 0',
        fontSize: '0.9em',
        '& strong': {
          color: '#495057',
        },
      },
    },
    '& .hospital-features': {
      marginTop: '15px',
      paddingTop: '15px',
      borderTop: '1px solid #e9ecef',
      '& h4': {
        color: '#2c3e50',
        margin: '0 0 10px 0',
      },
      '& p': {
        margin: '0',
        fontSize: '0.9em',
        color: '#666',
      },
    },
    '& .search-footer': {
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #e9ecef',
      '& h4': {
        color: '#2c3e50',
        margin: '0 0 10px 0',
      },
      '& ul': {
        margin: '0',
        paddingLeft: '20px',
        '& li': {
          margin: '5px 0',
          fontSize: '0.9em',
          color: '#666',
        },
      },
    },
  },
};

export default BigChatModal;
