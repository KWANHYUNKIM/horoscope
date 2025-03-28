import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, userId, userRole } = useAuth();
  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [boardResponse, commentsResponse] = await Promise.all([
          axios.get(`http://localhost:3001/api/boards/${id}`, { withCredentials: true }),
          axios.get(`http://localhost:3001/api/boards/${id}/comments`, { withCredentials: true })
        ]);

        setBoard(boardResponse.data);
        setComments(commentsResponse.data);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    };

    fetchData();
  }, [id]);

  const handleEditBoard = () => {
    navigate(`/community/edit/${id}`);
  };

  const handleDeleteBoard = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/boards/${id}`, { withCredentials: true });
      navigate('/community');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }
  };

  const handleEditClick = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.comment);
  };

  const handleCommentEdit = async (commentId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      await axios.put(`http://localhost:3001/api/boards/${id}/comments/${commentId}`, {
        comment: editContent
      }, { withCredentials: true });

      // 댓글 수정 후 목록 새로고침
      const commentsResponse = await axios.get(`http://localhost:3001/api/boards/${id}/comments`, { withCredentials: true });
      setComments(commentsResponse.data);
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }
  };

  // 댓글 트리 구조 생성 함수 개선
  const buildCommentTree = (comments) => {
    const commentMap = new Map();
    const rootComments = [];
    
    // 모든 댓글을 Map에 저장하고 replies 배열 초기화
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // 댓글 트리 구성
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id);
      
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies.push(commentWithReplies);
        } else {
          // 부모 댓글이 삭제된 경우 최상위 댓글로 처리
          rootComments.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    // 각 레벨별로 시간순 정렬을 위한 재귀 함수
    const sortCommentsByDate = (comments) => {
      comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      comments.forEach(comment => {
        if (comment.replies.length > 0) {
          sortCommentsByDate(comment.replies);
        }
      });
    };

    // 전체 트리 정렬
    sortCommentsByDate(rootComments);
    return rootComments;
  };

  const renderCommentTree = (comment, depth = 0) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isDeleted = comment.is_deleted;
    
    return (
      <div key={comment.id} className="relative">
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-8 border-l-2 border-gray-200"></div>
        )}
        <div className={`${depth > 0 ? 'ml-8' : ''}`}>
          {renderComment(comment)}
          {hasReplies && (
            <div className="mt-2 space-y-4">
              {comment.replies.map(reply => renderCommentTree(reply, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderComment = (comment) => {
    const isAuthor = isLoggedIn && (comment.user_id === userId || userRole === 'admin');
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;
    const isDeleted = comment.is_deleted;

    return (
      <div className={`mb-4 ${isDeleted ? 'opacity-50' : ''}`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {isDeleted ? 'X' : (comment.username?.charAt(0).toUpperCase() || '?')}
              </span>
            </div>
          </div>
          <div className="flex-grow">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-gray-800 text-sm">
                    {isDeleted ? '삭제됨' : comment.username}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                {!isDeleted && isAuthor && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEditClick(comment)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="mt-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    rows="2"
                  />
                  <div className="flex justify-end space-x-3 mt-2">
                    <button
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleCommentEdit(comment.id)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {isDeleted ? '삭제된 댓글입니다.' : comment.comment}
                </p>
              )}
              {!isDeleted && !isReplying && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  답글 달기
                </button>
              )}
            </div>
            {isReplying && (
              <div className="mt-3 ml-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  rows="2"
                  placeholder="답글을 입력하세요..."
                />
                <div className="flex justify-end space-x-3 mt-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    답글 작성
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleReplySubmit = async (parentId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`http://localhost:3001/api/boards/${id}/comments`, {
        comment: replyContent,
        parent_id: parentId
      }, { withCredentials: true });

      // 댓글 작성 성공 후 댓글 목록 새로고침
      const commentsResponse = await axios.get(`http://localhost:3001/api/boards/${id}/comments`, { withCredentials: true });
      setComments(commentsResponse.data);
      
      // 입력 폼 초기화
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/api/boards/${id}/comments/${commentId}`, { withCredentials: true });

      // 댓글이 삭제되었을 때 화면 업데이트
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, is_deleted: true, comment: '삭제된 댓글입니다.' };
          }
          return comment;
        });
      });
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }
  };

  const handleNewCommentSubmit = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      await axios.post(`http://localhost:3001/api/boards/${id}/comments`, {
        comment: newComment
      }, { withCredentials: true });

      // 댓글 작성 성공 후 댓글 목록 새로고침
      const commentsResponse = await axios.get(`http://localhost:3001/api/boards/${id}/comments`, { withCredentials: true });
      setComments(commentsResponse.data);
      
      // 입력 폼 초기화
      setNewComment('');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {board && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 상단 헤더 영역 */}
          <div className="border-b border-gray-100 pb-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 font-['Pretendard'] mb-2">{board.title}</h1>
                <div className="flex items-center text-gray-600 text-xs">
                  <span className="mr-4">작성자: {board.username}</span>
                  <span>작성일: {new Date(board.created_at).toLocaleString()}</span>
                </div>
              </div>
              {isLoggedIn && (board.user_id === userId || userRole === 'admin') && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleEditBoard}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDeleteBoard}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 본문 내용 */}
          <div className="prose max-w-none mb-8 border-b border-gray-100 pb-8">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{board.content}</p>
          </div>

          {/* 댓글 섹션 */}
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4 font-['Pretendard']">
              댓글 ({comments.filter(c => !c.is_deleted).length})
            </h3>
            
            {/* 새 댓글 작성 폼 */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                rows="2"
                placeholder="댓글을 입력하세요..."
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleNewCommentSubmit}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  댓글 작성
                </button>
              </div>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {buildCommentTree(comments).map(comment => renderCommentTree(comment))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDetail; 