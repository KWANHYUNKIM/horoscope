CREATE TABLE IF NOT EXISTS `boards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` int NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `boards_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시판 카테고리 타입 테이블
CREATE TABLE IF NOT EXISTS `hospital_board_category_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `type_code` varchar(20) NOT NULL,
  `description` text,
  `order_sequence` int DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_code` (`type_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시판 카테고리 테이블
CREATE TABLE IF NOT EXISTS `hospital_board_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text,
  `parent_id` int DEFAULT NULL,
  `category_type_id` int NOT NULL,
  `path` varchar(255) DEFAULT '/',
  `level` int DEFAULT 1,
  `order_sequence` int DEFAULT 0,
  `allow_comments` tinyint(1) DEFAULT 1,
  `is_secret_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `category_type_id` (`category_type_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `hospital_board_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`category_type_id`) REFERENCES `hospital_board_category_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시판 테이블
CREATE TABLE IF NOT EXISTS `hospital_board` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `view_count` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `board_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `hospital_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `board_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `hospital_board_categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시판 상세 정보 테이블
CREATE TABLE IF NOT EXISTS `hospital_board_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board_id` int NOT NULL,
  `content` text NOT NULL,
  `meta_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `board_id` (`board_id`),
  CONSTRAINT `board_details_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `hospital_board` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시판 태그 테이블
CREATE TABLE IF NOT EXISTS `hospital_board_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시글-태그 연결 테이블
CREATE TABLE IF NOT EXISTS `hospital_board_post_tags` (
  `board_id` int NOT NULL,
  `tag_id` int NOT NULL,
  PRIMARY KEY (`board_id`, `tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `post_tags_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `hospital_board` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `hospital_board_tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시판 첨부파일 테이블
CREATE TABLE IF NOT EXISTS `hospital_board_attachments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` int DEFAULT 0,
  `mime_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `board_id` (`board_id`),
  CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `hospital_board` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 게시판 댓글 테이블
CREATE TABLE IF NOT EXISTS `hospital_board_comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `board_id` int NOT NULL,
  `user_id` int NOT NULL,
  `comment` text NOT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `board_id` (`board_id`),
  KEY `user_id` (`user_id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`board_id`) REFERENCES `hospital_board` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `hospital_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `hospital_board_comments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 기본 카테고리 타입 추가
INSERT INTO `hospital_board_category_types` 
  (`type_name`, `type_code`, `description`, `order_sequence`) 
VALUES 
  ('병원 정보', 'HOSPITAL_INFO', '병원 관련 정보를 공유하는 게시판', 1),
  ('의료 상담', 'MEDICAL_CONSULT', '의료 상담 및 질문을 위한 게시판', 2),
  ('커뮤니티', 'COMMUNITY', '일반적인 커뮤니티 게시판', 3);

-- 기본 카테고리 추가
INSERT INTO `hospital_board_categories` 
  (`category_name`, `description`, `category_type_id`, `order_sequence`) 
VALUES 
  ('공지사항', '병원 관련 공지사항', 1, 1),
  ('병원 리뷰', '병원 이용 후기', 1, 2),
  ('의료 상담', '의료진과의 상담', 2, 1),
  ('건강 정보', '건강 관련 정보 공유', 2, 2),
  ('자유게시판', '자유로운 대화', 3, 1),
  ('정보 공유', '유용한 정보 공유', 3, 2); 