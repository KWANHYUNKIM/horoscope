import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Editor } from '@tinymce/tinymce-react';

const CreateBoardPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isLoggedIn, userId } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [editorApiKey, setEditorApiKey] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, configResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/boards/categories', { withCredentials: true }),
          axios.get('http://localhost:3001/api/boards/config', { withCredentials: true })
        ]);
        
        setCategories(categoriesResponse.data);
        setEditorApiKey(configResponse.data.EDITOR_API);
        
        if (id) {
          // 게시글 수정인 경우 기존 데이터 로드
          const boardResponse = await axios.get(`http://localhost:3001/api/boards/${id}`, { withCredentials: true });
          setTitle(boardResponse.data.title);
          setContent(boardResponse.data.content);
          setSelectedCategory(boardResponse.data.category_id.toString());
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!title.trim() || !content.trim() || !selectedCategory) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      if (id) {
        // 수정
        await axios.put(
          `http://localhost:3001/api/boards/${id}`,
          {
            title,
            content,
            category_id: selectedCategory
          },
          { withCredentials: true }
        );
      } else {
        // 새 게시글 작성
        await axios.post(
          'http://localhost:3001/api/boards',
          {
            title,
            content,
            category_id: selectedCategory
          },
          { withCredentials: true }
        );
      }
      navigate('/community');
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        navigate('/login');
      }
    }
  };

  const handleImageUpload = async (blobInfo) => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    
    try {
      const response = await axios.post('http://localhost:3001/api/boards/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true
      });
      return response.data.url;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  if (loading) {
    return <div className="text-center p-4">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">게시글 작성</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              카테고리
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              내용
            </label>
            {editorApiKey && (
              <Editor
                apiKey={editorApiKey}
                value={content}
                onEditorChange={(content) => setContent(content)}
                init={{
                  height: 500,
                  menubar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
                  images_upload_handler: handleImageUpload,
                  language: 'ko_KR',
                  skin: 'oxide',
                  content_css: 'default'
                }}
              />
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {id ? '수정하기' : '작성하기'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardPage; 