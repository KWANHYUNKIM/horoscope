import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchNursingHospitalDetail, fetchHospitalKeywordStats, fetchHospitalReviews } from '../../service/api';
import { IoMdBed } from 'react-icons/io';
import { FaUserMd, FaUserNurse, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { BsImage, BsCheckCircle, BsInfoCircle } from 'react-icons/bs';

const NursingHospitalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [keywordStats, setKeywordStats] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hospitalData, statsData, reviewsData] = await Promise.all([
          fetchNursingHospitalDetail(id),
          fetchHospitalKeywordStats(id),
          fetchHospitalReviews(id)
        ]);
        
        if (hospitalData) {
          setHospital(hospitalData);
          setKeywordStats(statsData);
          setReviews(reviewsData.reviews || []);
        } else {
          throw new Error('병원 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleReviewClick = () => {
    navigate(`/nursing-hospitals/${id}/reviews`);
  };

  // 아이콘 매핑 함수
  const getIconComponent = (iconName) => {
    const iconMap = {
      'BsImage': <BsImage className="text-green-500" />,
      'BsCheckCircle': <BsCheckCircle className="text-yellow-500" />,
      'BsInfoCircle': <BsInfoCircle className="text-blue-500" />,
      'FaUserMd': <FaUserMd className="text-purple-500" />,
      'FaUserNurse': <FaUserNurse className="text-pink-500" />,
      'IoMdBed': <IoMdBed className="text-blue-500" />
    };
    return iconMap[iconName] || <BsInfoCircle className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={() => navigate('/nursing-hospitals')}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <MdKeyboardArrowLeft className="mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-gray-600 text-lg mb-4">병원 정보를 찾을 수 없습니다.</div>
        <button
          onClick={() => navigate('/nursing-hospitals')}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <MdKeyboardArrowLeft className="mr-1" />
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/nursing-hospitals')}
            className="flex items-center text-gray-600 hover:text-blue-500 transition-colors"
          >
            <MdKeyboardArrowLeft size={24} />
            <span>돌아가기</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 이미지 섹션 */}
        <div className="relative h-[400px] mb-8 rounded-2xl overflow-hidden shadow-lg bg-gray-200">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <span>🖼️ 이미지 준비 중</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white mb-2">{hospital.yadmNm}</h1>
            <div className="flex items-center text-white">
              <FaMapMarkerAlt className="mr-2" />
              <span>{hospital.addr}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 왼쪽 섹션: 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 리뷰 요약 섹션 */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">후기 ({reviews.length})</h2>
                <button
                  onClick={handleReviewClick}
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  전체보기
                </button>
              </div>

              <h3 className="font-medium text-gray-900 mb-4">한눈에 보는 특징</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {keywordStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      {getIconComponent(stat.icon)}
                      <span className="ml-2 font-medium">{stat.label}</span>
                    </div>
                    <span className="text-gray-500">{stat.count}명</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 핵심 정보 카드 */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6">병원 정보</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl">
                  <IoMdBed size={24} className="text-blue-500 mb-2" />
                  <span className="text-sm text-gray-600">병상</span>
                  <span className="font-bold">{hospital.beds || '정보없음'}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-green-50 rounded-xl">
                  <FaUserMd size={24} className="text-green-500 mb-2" />
                  <span className="text-sm text-gray-600">의사</span>
                  <span className="font-bold">{hospital.doctors || '정보없음'}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-purple-50 rounded-xl">
                  <FaUserNurse size={24} className="text-purple-500 mb-2" />
                  <span className="text-sm text-gray-600">간호사</span>
                  <span className="font-bold">{hospital.nurses || '정보없음'}</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-red-50 rounded-xl">
                  <FaPhoneAlt size={24} className="text-red-500 mb-2" />
                  <span className="text-sm text-gray-600">전화</span>
                  <a href={`tel:${hospital.telno}`} className="font-bold text-blue-500 hover:underline">
                    {hospital.telno || '정보없음'}
                  </a>
                </div>
              </div>

              {/* 병원 유형 및 위탁병원 정보 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">병원 유형</h3>
                <div className="flex flex-wrap gap-2">
                  {hospital.category && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {hospital.category}
                    </span>
                  )}
                  {hospital.veteran_hospital && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      위탁병원
                    </span>
                  )}
                </div>
              </div>

              {/* 진료과 정보 */}
              {hospital.major && hospital.major.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">진료과</h3>
                  <div className="flex flex-wrap gap-2">
                    {hospital.major.map((major, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {major}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 병원 홈페이지 */}
              {hospital.hospUrl && hospital.hospUrl !== '-' && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">홈페이지</h3>
                  <a
                    href={hospital.hospUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {hospital.hospUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 섹션: 빠른 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-4">빠른 정보</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FaPhoneAlt className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-600">전화번호</div>
                    <a href={`tel:${hospital.telno}`} className="text-blue-500 hover:underline">
                      {hospital.telno || '정보없음'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center">
                  <IoMdBed className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-600">병상 수</div>
                    <div>{hospital.beds || '정보없음'}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaUserMd className="text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-600">의사 수</div>
                    <div>{hospital.doctors || '정보없음'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NursingHospitalDetailPage; 