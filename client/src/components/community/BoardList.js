import React from 'react';
import { useNavigate } from 'react-router-dom';

const BoardList = ({ boards, isLoggedIn, onDeleteBoard, onSelectBoard }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4">
        {boards.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            게시글이 없습니다.
          </div>
        ) : (
          boards.map((board) => (
            <div
              key={board.id}
              className="border-b p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onSelectBoard(board.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{board.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{board.summary}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <span>{board.category_name}</span>
                    <span className="mx-2">•</span>
                    <span>{board.username}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(board.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {isLoggedIn && board.user_id === parseInt(localStorage.getItem('userId')) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBoard(board.id);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BoardList; 