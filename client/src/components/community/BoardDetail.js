import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boardResponse, commentsResponse, categoriesResponse] = await Promise.all([
          axios.get(`http://localhost:3001/api/boards/${id}`, { withCredentials: true }),
          axios.get(`http://localhost:3001/api/boards/${id}/comments`, { withCredentials: true }),
          axios.get('http://localhost:3001/api/boards/categories', { withCredentials: true })
        ]);

        setBoard(boardResponse.data);
        setComments(commentsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `http://localhost:3001/api/boards/${id}/comments`,
        { comment: newComment },
        { withCredentials: true }
      );
      const response = await axios.get(`http://localhost:3001/api/boards/${id}/comments`, { withCredentials: true });
      setComments(response.data);
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:3001/api/boards/${id}/comments/${commentId}`, { withCredentials: true });
      const response = await axios.get(`http://localhost:3001/api/boards/${id}/comments`, { withCredentials: true });
      setComments(response.data);
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
    }
  };

  const handleDeleteBoard = async () => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`http://localhost:3001/api/boards/${id}`, { withCredentials: true });
        navigate('/community');
      } catch (error) {
        console.error('게시글 삭제 실패:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  if (!board) {
    return <div className="text-center p-4">게시글을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* 메인 컨텐츠 */}
        <div className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{board.title}</h1>
                <div className="text-gray-600">
                  <span className="mr-4">작성자: {board.nickname || board.username}</span>
                  <span className="mr-4">카테고리: {board.category_name}</span>
                  <span>작성일: {new Date(board.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {user && (user.id === board.user_id || user.role === 'admin') && (
                <button
                  onClick={handleDeleteBoard}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="prose max-w-none mb-6">
              {board.content}
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">댓글</h2>
            {user && (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  rows="3"
                  placeholder="댓글을 입력하세요"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
                      <span className="font-semibold">{comment.username}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {user && (user.id === comment.user_id || user.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="mt-2">{comment.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 카테고리 사이드바 */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold mb-4">카테고리</h2>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => navigate(`/community/category/${category.id}`)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                      board.category_id === category.id ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    {category.category_name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardDetail; 