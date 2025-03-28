import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoard, setNewBoard] = useState({
    category_id: '',
    title: '',
    summary: '',
    content: '',
    additional_info: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchBoards();
    fetchCategories();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/boards');
      setBoards(response.data);
    } catch (error) {
      console.error('게시글 목록을 불러오는데 실패했습니다:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/boards/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('카테고리 목록을 불러오는데 실패했습니다:', error);
    }
  };

  const fetchBoardDetail = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/boards/${id}`);
      setSelectedBoard(response.data);
      fetchComments(id);
    } catch (error) {
      console.error('게시글 상세를 불러오는데 실패했습니다:', error);
    }
  };

  const fetchComments = async (boardId) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/boards/${boardId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('댓글 목록을 불러오는데 실패했습니다:', error);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3001/api/boards', newBoard, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateModal(false);
      setNewBoard({
        category_id: '',
        title: '',
        summary: '',
        content: '',
        additional_info: ''
      });
      fetchBoards();
    } catch (error) {
      console.error('게시글 작성에 실패했습니다:', error);
    }
  };

  const handleDeleteBoard = async (id) => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/boards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBoards();
      if (selectedBoard?.id === id) {
        setSelectedBoard(null);
        setComments([]);
      }
    } catch (error) {
      console.error('게시글 삭제에 실패했습니다:', error);
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!selectedBoard) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/boards/${selectedBoard.id}/comments`,
        { comment: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments(selectedBoard.id);
    } catch (error) {
      console.error('댓글 작성에 실패했습니다:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3001/api/boards/${selectedBoard.id}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComments(selectedBoard.id);
    } catch (error) {
      console.error('댓글 삭제에 실패했습니다:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        {isLoggedIn && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            글쓰기
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 게시글 목록 */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className="border-b p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => fetchBoardDetail(board.id)}
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
                          handleDeleteBoard(board.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 게시글 상세 및 댓글 */}
        <div className="md:col-span-1">
          {selectedBoard ? (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-bold mb-4">{selectedBoard.title}</h2>
              <div className="prose max-w-none mb-4">
                {selectedBoard.content}
              </div>
              {selectedBoard.additional_info && (
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h3 className="font-semibold mb-2">추가 정보</h3>
                  <p>{selectedBoard.additional_info}</p>
                </div>
              )}

              {/* 댓글 섹션 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">댓글</h3>
                {isLoggedIn && (
                  <form onSubmit={handleCreateComment} className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      rows="3"
                      placeholder="댓글을 입력하세요"
                    />
                    <button
                      type="submit"
                      className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                    >
                      댓글 작성
                    </button>
                  </form>
                )}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{comment.username}</p>
                          <p className="text-gray-700">{comment.comment}</p>
                        </div>
                        {isLoggedIn && comment.user_id === parseInt(localStorage.getItem('userId')) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
              게시글을 선택해주세요
            </div>
          )}
        </div>
      </div>

      {/* 게시글 작성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">새 게시글 작성</h2>
            <form onSubmit={handleCreateBoard}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={newBoard.category_id}
                  onChange={(e) => setNewBoard({ ...newBoard, category_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  value={newBoard.title}
                  onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  요약
                </label>
                <input
                  type="text"
                  value={newBoard.summary}
                  onChange={(e) => setNewBoard({ ...newBoard, summary: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용
                </label>
                <textarea
                  value={newBoard.content}
                  onChange={(e) => setNewBoard({ ...newBoard, content: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows="6"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  추가 정보
                </label>
                <textarea
                  value={newBoard.additional_info}
                  onChange={(e) => setNewBoard({ ...newBoard, additional_info: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  작성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage; 