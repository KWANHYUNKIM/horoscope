import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
import HospitalReview from '../../components/HospitalReview';
import { useAuth } from '../../contexts/AuthContext';
import { fetchHospitals } from '../../service/api';

const NursingHospitalReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true);
        const response = await fetchHospitals({
          id: id,
          category: "요양병원"
        });
        
        if (response && response.data && response.data.length > 0) {
          setHospital(response.data[0]);
        } else {
          throw new Error('병원 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching hospital:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHospital();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <p>오류가 발생했습니다: {error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>병원을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/nursing-hospitals')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/nursing-hospitals/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <FaArrowLeft className="mr-2" />
          병원 상세 정보로 돌아가기
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{hospital.name}</h1>
        <div className="flex items-center mb-6">
          <div className="flex items-center">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="text-xl font-semibold">
              {hospital.averageRating ? hospital.averageRating.toFixed(1) : '0.0'}
            </span>
          </div>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-gray-600">
            리뷰 {hospital.reviewCount || 0}개
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <HospitalReview hospitalId={id} hospitalType="nursing" />
      </div>
    </div>
  );
};

export default NursingHospitalReviewPage; 