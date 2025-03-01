import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AdminPage = () => {
  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">관리자 메뉴</h2>
        <ul>
          <li className="mb-2">
            <Link to="/admin" className="hover:underline">
              대시보드
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/admin/hospitals" className="hover:underline">
              병원 관리
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/admin/fetch-data" className="hover:underline">
              API 데이터 가져오기
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/admin/fetch-data" className="hover:underline">
              병원 데이터 색인
            </Link>
          </li>
          <li className="mb-2">
            <Link to="/logout" className="hover:underline">
              로그아웃
            </Link>
          </li>
        </ul>
      </aside>
       {/* 중첩 라우트가 렌더링되는 영역 */}
       <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPage;
