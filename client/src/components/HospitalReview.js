import React, { useState, useEffect } from 'react';
import { Rating } from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const HospitalReview = ({ hospitalId, hospitalType }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [sort, setSort] = useState('latest');
  const [isWriting, setIsWriting] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    content: '',
    visitDate: '',
    images: []
  });
  const [loading, setLoading] = useState(false);

  const getApiEndpoint = () => {
    return hospitalType === 'nursing' ? 'nursing-hospitals' : 'hospitals';
  };

  // 리뷰 목록 조회
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const endpoint = getApiEndpoint();
      const response = await fetch(
        `/api/${endpoint}/${hospitalId}/reviews?page=${pagination.page}&limit=${pagination.limit}&sort=${sort}`
      );
      const data = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error('리뷰 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [hospitalId, pagination.page, sort]);

  // 리뷰 작성
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const endpoint = getApiEndpoint();
      const response = await fetch(`/api/${endpoint}/${hospitalId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newReview,
          hospitalType
        })
      });

      if (response.ok) {
        setIsWriting(false);
        setNewReview({ rating: 0, content: '', visitDate: '', images: [] });
        fetchReviews();
      }
    } catch (error) {
      console.error('리뷰 작성 중 오류:', error);
    }
  };

  // 리뷰 좋아요
  const handleLike = async (reviewId) => {
    try {
      const endpoint = getApiEndpoint();
      const response = await fetch(`/api/${endpoint}/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">리뷰</h2>
          <div className="flex items-center mt-2">
            <Rating value={stats.averageRating} precision={0.5} readOnly />
            <span className="ml-2">{stats.averageRating.toFixed(1)}</span>
            <span className="ml-2 text-gray-500">({pagination.total}개의 리뷰)</span>
          </div>
        </div>
        {user && !isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            리뷰 작성
          </button>
        )}
      </div>

      {/* 리뷰 작성 폼 */}
      {isWriting && (
        <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-gray-50 rounded">
          <div className="mb-4">
            <label className="block mb-2">평점</label>
            <Rating
              value={newReview.rating}
              onChange={(_, value) => setNewReview(prev => ({ ...prev, rating: value }))}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">방문일</label>
            <input
              type="date"
              value={newReview.visitDate}
              onChange={(e) => setNewReview(prev => ({ ...prev, visitDate: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">내용</label>
            <textarea
              value={newReview.content}
              onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-2 border rounded h-32"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              작성완료
            </button>
          </div>
        </form>
      )}

      {/* 정렬 옵션 */}
      <div className="mb-4">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="latest">최신순</option>
          <option value="rating">평점순</option>
          <option value="likes">좋아요순</option>
        </select>
      </div>

      {/* 리뷰 목록 */}
      {loading ? (
        <div className="text-center py-8">로딩중...</div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border rounded">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  <img
                    src={review.profile_image || '/default-profile.png'}
                    alt={review.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="ml-3">
                    <div className="font-semibold">{review.username}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(review.visit_date), 'yyyy년 M월 d일 방문')}
                    </div>
                  </div>
                </div>
                <Rating value={review.rating} readOnly size="small" />
              </div>
              <p className="my-3">{review.content}</p>
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`리뷰 이미지 ${index + 1}`}
                      className="w-24 h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <button
                  onClick={() => handleLike(review.id)}
                  className={`flex items-center ${review.isLiked ? 'text-blue-500' : ''}`}
                >
                  <svg
                    className="w-5 h-5 mr-1"
                    fill={review.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>{review.like_count}</span>
                </button>
                <span className="mx-2">•</span>
                <span>{format(new Date(review.created_at), 'yyyy.MM.dd')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
              className={`px-3 py-1 rounded ${
                pagination.page === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalReview; 