import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BoardList from './BoardList';
import { getApiUrl } from '../../utils/api';
import CategoryTree from '../../components/CategoryTree';
import Comment from '../../components/Comment';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, userId, userRole } = useAuth();
  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedBoards, setRelatedBoards] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [taggedHospitals, setTaggedHospitals] = useState([]);

  // 댓글 목록 조회 시 병원 정보도 함께 가져오기
  const fetchComments = React.useCallback(async () => {
    try {
      const commentsResponse = await axios.get(`${getApiUrl()}/api/boards/${id}/comments`, { withCredentials: true });
      console.log('댓글 목록 응답:', commentsResponse.data);

      // 댓글 데이터가 배열인지 확인
      const commentsData = Array.isArray(commentsResponse.data) ? commentsResponse.data : commentsResponse.data.comments || [];
      console.log('처리된 댓글 데이터:', commentsData);

      // 각 댓글의 @ 태그된 병원 정보 가져오기
      const commentsWithHospitals = await Promise.all(
        commentsData.map(async (comment) => {
          const matches = comment.comment.match(/@([^\s]+)/g);
          if (matches) {
            const hospitals = await Promise.all(
              matches.map(async (match) => {
                const hospitalName = match.substring(1);
                try {
                  const response = await axios.get(`${getApiUrl()}/api/hospitals/autocomplete?query=${encodeURIComponent(hospitalName)}`, { withCredentials: true });
                  return response.data.hospital[0]; // 첫 번째 검색 결과 사용
                } catch (error) {
                  console.error('병원 정보 조회 실패:', error);
                  return null;
                }
              })
            );
            return { ...comment, hospitals: hospitals.filter(Boolean) };
          }
          return comment;
        })
      );

      setComments(commentsWithHospitals);
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      setComments([]); // 오류 발생 시 빈 배열로 설정
    }
  }, [id]);

  // 초기 데이터 로딩
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 조회수 증가 API 호출
        await axios.post(`${getApiUrl()}/api/boards/${id}/view`, {}, { withCredentials: true });
        
        // 게시글, 댓글, 관련 게시글 데이터 가져오기
        const [boardResponse, relatedBoardsResponse] = await Promise.all([
          axios.get(`${getApiUrl()}/api/boards/${id}`, { withCredentials: true }),
          axios.get(`${getApiUrl()}/api/boards/related/${id}?page=${currentPage}`, { withCredentials: true })
        ]);

        if (isMounted) {
          setBoard(boardResponse.data);
          setRelatedBoards(relatedBoardsResponse.data.boards);
          setTotalPages(relatedBoardsResponse.data.totalPages);
          setCurrentPage(relatedBoardsResponse.data.currentPage);
          
          // 댓글 목록 가져오기
          await fetchComments();
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        if (error.response?.status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, currentPage, fetchComments]);

  const handleEditBoard = () => {
    navigate(`/community/boards/edit/${id}`);
  };

  const handleDeleteBoard = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!board || board.user_id !== userId) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`${getApiUrl()}/api/boards/${id}`, { withCredentials: true });
      navigate('/community');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
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
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.put(`${getApiUrl()}/api/boards/${id}/comments/${commentId}`, {
        comment: editContent
      }, { withCredentials: true });

      // 댓글 수정 후 목록 새로고침
      await fetchComments();
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
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

  // 댓글 내용에서 @ 태그를 파싱하는 함수
  const renderCommentContent = (comment) => {
    if (!comment.comment) return '';
    console.log('댓글 데이터:', comment);

    const parts = comment.comment.split(/(@[^\s]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const hospitalName = part.substring(1);
        // hospitals 배열에서 병원 정보 찾기
        const hospital = comment.hospitals?.find(h => h.name === hospitalName);
        
        if (hospital) {
          return (
            <span key={index} className="relative group inline-block">
              <span 
                className="text-blue-600 font-medium cursor-pointer hover:bg-blue-50"
                onClick={() => navigate(`/hospitals?query=${encodeURIComponent(hospitalName)}`)}
              >
                {part}
              </span>
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <h3 className="font-bold text-sm mb-1">{hospital.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{hospital.address}</p>
                <button 
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => navigate(`/hospitals?query=${encodeURIComponent(hospitalName)}`)}
                >
                  상세 정보 보기
                </button>
              </div>
            </span>
          );
        } else {
          // 병원 정보가 없는 경우에도 @ 태그를 파란색으로 표시
          return (
            <span key={index} className="text-blue-600 font-medium">
              {part}
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
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
                  {isDeleted ? '삭제된 댓글입니다.' : renderCommentContent(comment)}
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
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`${getApiUrl()}/api/boards/${id}/comments`, {
        comment: replyContent,
        parent_id: parentId
      }, { withCredentials: true });

      // 댓글 작성 성공 후 댓글 목록 새로고침
      await fetchComments();
      
      // 입력 폼 초기화
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      await axios.delete(`${getApiUrl()}/api/boards/${id}/comments/${commentId}`, { withCredentials: true });

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
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    }
  };

  // 댓글 작성 후 목록 새로고침
  const handleNewCommentSubmit = async (commentData) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`${getApiUrl()}/api/boards/${id}/comments`, {
        comment: commentData.comment,
        entityTags: commentData.entityTags
      }, { withCredentials: true });

      console.log('댓글 작성 응답:', response.data);
      await fetchComments(); // 댓글 목록 새로고침
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {board && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 상단 헤더 영역 */}
          <div className="border-b border-gray-100 pb-4 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 font-['Pretendard'] mb-2">{board.title}</h1>
                <div className="flex items-center text-gray-600 text-xs">
                  <span className="mr-4">작성자: {board.author_name}</span>
                  <span className="mr-4">작성일: {new Date(board.created_at).toLocaleString()}</span>
                  <span>조회: {board.view_count}</span>
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
          <div className="mt-4">
            <p className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: board.content }}></p>
          </div>

          {/* 태그된 병원 표시 */}
          {taggedHospitals.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">태그된 병원</h3>
              <div className="flex flex-wrap gap-2">
                {taggedHospitals.map(hospital => (
                  <span
                    key={hospital.id}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {hospital.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 댓글 섹션 */}
          <div className="mt-4 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 font-['Pretendard']">
              댓글 ({comments.filter(c => !c.is_deleted).length})
            </h3>
            
            {/* 새 댓글 작성 폼 */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <Comment 
                onSubmit={handleNewCommentSubmit} 
                boardId={id} 
              />
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {buildCommentTree(comments).map(comment => renderCommentTree(comment))}
            </div>
          </div>

          {/* 관련 게시글 목록 */}
          <div className="mt-8 border-t border-gray-100 pt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 font-['Pretendard']">
                카테고리 리스트
              </h3>
              {totalPages > 1 && (
                <div className="flex space-x-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else {
                      if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <BoardList boards={relatedBoards} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDetail; 