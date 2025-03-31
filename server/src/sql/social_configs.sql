CREATE TABLE IF NOT EXISTS hospital_social_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL UNIQUE,
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  redirect_uri VARCHAR(255) NOT NULL,
  environment VARCHAR(20) DEFAULT 'development',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 초기 데이터 삽입
INSERT INTO hospital_social_configs 
  (provider, client_id, client_secret, redirect_uri, environment) 
VALUES 
  ('kakao', '', '', 'http://localhost:8081/auth/kakao/callback', 'development'),
  ('naver', '', '', 'http://localhost:8081/auth/naver/callback', 'development')
ON DUPLICATE KEY UPDATE 
  updated_at = CURRENT_TIMESTAMP; 