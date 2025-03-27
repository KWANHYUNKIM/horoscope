import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CommunityPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 커뮤니티 카테고리 데이터
  const categories = [
    {
      id: 'cancer',
      name: '암 커뮤니티',
      description: '암 환자와 보호자를 위한 정보 공유와 경험 나누기',
      icon: '🏥',
      memberCount: 1234,
      postCount: 567
    },
    {
      id: 'nursing',
      name: '요양병원 커뮤니티',
      description: '요양병원 이용과 관련된 정보와 경험 공유',
      icon: '👨‍⚕️',
      memberCount: 890,
      postCount: 234
    },
    {
      id: 'general',
      name: '일반 의료 커뮤니티',
      description: '일반적인 의료 정보와 건강 상담',
      icon: '💊',
      memberCount: 2345,
      postCount: 789
    },
    {
      id: 'mental',
      name: '정신건강 커뮤니티',
      description: '정신건강 관련 정보와 상담',
      icon: '🧠',
      memberCount: 678,
      postCount: 123
    }
  ];

  // 최근 게시글 데이터
  const recentPosts = [
    {
      id: 1,
      title: '암 진단 후 생활 관리 방법',
      author: '김철수',
      category: 'cancer',
      date: '2024-03-20',
      views: 123,
      comments: 5
    },
    {
      id: 2,
      title: '요양병원 선택 시 고려사항',
      author: '이영희',
      category: 'nursing',
      date: '2024-03-19',
      views: 89,
      comments: 3
    },
    // ... 더 많은 게시글
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 커뮤니티 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-gray-900">의료 커뮤니티</h1>
          <p className="mt-4 text-lg text-gray-500">
            의료 정보를 공유하고 경험을 나누는 공간입니다.
          </p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 사이드바 - 카테고리 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">커뮤니티 카테고리</h2>
              <div className="space-y-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center p-4 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <div className="text-left">
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽 메인 컨텐츠 */}
          <div className="lg:col-span-2">
            {/* 최근 게시글 */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">최근 게시글</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                  글쓰기
                </button>
              </div>

              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 cursor-pointer">
                        {post.title}
                      </h3>
                      <span className="text-sm text-gray-500">{post.date}</span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>{post.author}</span>
                      <span className="mx-2">•</span>
                      <span>조회 {post.views}</span>
                      <span className="mx-2">•</span>
                      <span>댓글 {post.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 인기 게시글 */}
            <div className="mt-8 bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">인기 게시글</h2>
              <div className="space-y-4">
                {/* 인기 게시글 목록 */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage; 