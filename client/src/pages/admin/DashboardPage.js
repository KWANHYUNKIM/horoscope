import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    collectionStats: {
      hospitals: { total: 0, complete: 0, partial: 0, incomplete: 0 }
    },
    hospitalsByType: {},
    hospitalsByRegion: {},
    recentUpdates: [],
    emptyFields: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 토큰과 관리자 권한 확인
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
      navigate('/admin/login');
      return;
    }

    fetchDashboardStats();
  }, [navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          navigate('/admin/login');
          return;
        }
        throw new Error('서버 응답 오류');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('대시보드 통계 로딩 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">오류!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">데이터베이스 통계</h1>

      {/* 컬렉션별 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">병원 데이터</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.collectionStats.hospitals.total}</p>
          <div className="mt-2 text-sm text-gray-600">
            <p>완성: {stats.collectionStats.hospitals.complete}</p>
            <p>부분: {stats.collectionStats.hospitals.partial}</p>
            <p>미완성: {stats.collectionStats.hospitals.incomplete}</p>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 병원 유형 분포 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">병원 유형 분포</h3>
          {Object.keys(stats.hospitalsByType).length > 0 ? (
            <Pie
              data={{
                labels: Object.keys(stats.hospitalsByType),
                datasets: [{
                  data: Object.values(stats.hospitalsByType),
                  backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                  ]
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          ) : (
            <p className="text-gray-500">데이터가 없습니다.</p>
          )}
        </div>

        {/* 지역별 분포 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">지역별 분포</h3>
          {Object.keys(stats.hospitalsByRegion).length > 0 ? (
            <Bar
              data={{
                labels: Object.keys(stats.hospitalsByRegion),
                datasets: [{
                  label: '병원 수',
                  data: Object.values(stats.hospitalsByRegion),
                  backgroundColor: '#36A2EB'
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          ) : (
            <p className="text-gray-500">데이터가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 빈 필드 현황 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">빈 필드 현황</h3>
        {Object.keys(stats.emptyFields).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">필드명</th>
                  <th className="px-4 py-2 text-left">빈 데이터 수</th>
                  <th className="px-4 py-2 text-left">비율</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.emptyFields).map(([field, count]) => (
                  <tr key={field} className="border-t">
                    <td className="px-4 py-2">{field}</td>
                    <td className="px-4 py-2">{count}</td>
                    <td className="px-4 py-2">
                      {Math.round((count / stats.collectionStats.hospitals.total) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">빈 필드 데이터가 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage; 