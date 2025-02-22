import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 px-4 md:px-6 lg:px-40">
        {/* 회사 소개 */}
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold">🚑 삐뽀삐뽀119</h2>
          <p className="text-sm text-gray-300 mt-2">
            가장 가까운 병원을 빠르게 찾을 수 있도록!
            <br />
            <strong>삐뽀삐뽀119</strong>는 공공데이터를 활용하여 실시간 병원 정보를 제공합니다.
            빠르고, 정확한 의료정보 검색을 경험하세요.
          </p>
        </div>

        {/* 주요 서비스 링크 */}
        {/*
        <div className="flex flex-col items-center text-center space-y-2">
          
          <h3 className="text-lg font-semibold">🔗 주요 서비스</h3>
          <a href="/hospitals" className="text-gray-400 hover:text-white transition">
            병원 검색
          </a>
          <a href="/emergency" className="text-gray-400 hover:text-white transition">
            응급실 찾기
          </a>
          <a href="/guidelines" className="text-gray-400 hover:text-white transition">
            진료 안내
          </a>
          <a href="/about" className="text-gray-400 hover:text-white transition">
            회사 소개
          </a>
        </div>
        */}

        {/* 공공누리 저작권 & 공공데이터 출처 */}
        <div className="flex flex-col items-center text-center">
          <h3 className="text-lg font-semibold">🛡️ 저작권 & 데이터 출처</h3>
          <img
            src="/img_opentype01.png"
            alt="공공누리 저작물 자유이용허락"
            className="h-10 mt-2"
          />
          <p className="text-xs mt-1 text-gray-300">
            본 서비스는{" "}
            <a
              href="https://www.data.go.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              공공데이터포털
            </a>{" "}
            의 정보를 활용하여 운영됩니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <a
              href="https://www.kogl.or.kr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              공공누리 제1유형
            </a>{" "}
            적용
          </p>
        </div>
      </div>

      {/* 하단 바 */}
      <div className="mt-6 border-t border-gray-700 pt-4 text-center text-sm text-gray-500">
        © 2024 삐뽀삐뽀119. 모든 권리 보유.
      </div>
    </footer>
  );
};

export default Footer;
