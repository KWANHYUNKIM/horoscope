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
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-semibold">
                {isDeleted ? 'X' : (comment.username?.charAt(0).toUpperCase() || '?')}
              </span>
            </div>
          </div>
          <div className="flex-grow">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-gray-800">
                    {isDeleted ? '삭제됨' : comment.username}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                {!isDeleted && isAuthor && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditClick(comment)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <div className="mt-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    rows="3"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleCommentEdit(comment.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                  {isDeleted ? '삭제된 댓글입니다.' : comment.comment}
                </p>
              )}
              {!isDeleted && !isReplying && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  답글 달기
                </button>
              )}
            </div>
            {isReplying && (
              <div className="mt-2 ml-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  rows="2"
                  placeholder="답글을 입력하세요..."
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
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

  const renderComments = () => {
    if (!board) return null;

    const rootComments = buildCommentTree(comments);
    const activeCommentsCount = comments.filter(c => !c.is_deleted).length;

    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">
          댓글 ({activeCommentsCount})
        </h3>
        
        {/* 새 댓글 작성 폼 */}
        <div className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 border rounded-lg"
            rows="3"
            placeholder="댓글을 입력하세요..."
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleNewCommentSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              댓글 작성
            </button>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div className="space-y-6">
          {rootComments.map(comment => renderCommentTree(comment))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {board && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{board.title}</h1>
            {isLoggedIn && (board.user_id === userId || userRole === 'admin') && (
              <div className="flex space-x-2">
                <button
                  onClick={handleEditBoard}
                  className="text-blue-600 hover:text-blue-800"
                >
                  수정
                </button>
                <button
                  onClick={handleDeleteBoard}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center text-gray-600 mb-4">
            <span className="mr-4">작성자: {board.username}</span>
            <span>작성일: {new Date(board.created_at).toLocaleString()}</span>
          </div>
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{board.content}</p>
          </div>
        </div>
      )}
      {renderComments()}
    </div>
  );
};

export default BoardDetail; 