import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';

const EditBoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [editorApiKey, setEditorApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, configResponse, boardResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/categories', { withCredentials: true }),
          axios.get('http://localhost:3001/api/config', { withCredentials: true }),
          axios.get(`http://localhost:3001/api/boards/${id}`, { withCredentials: true })
        ]);

        setCategories(categoriesResponse.data);
        setEditorApiKey(configResponse.data.EDITOR_API);
        setTitle(boardResponse.data.title);
        setContent(boardResponse.data.content);
        setCategoryId(boardResponse.data.category_id);
        setLoading(false);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        setError('게시글 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.put(
        `http://localhost:3001/api/boards/${id}`,
        {
          title,
          content,
          category_id: categoryId
        },
        { withCredentials: true }
      );

      navigate(`/community/boards/${id}`);
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      setError('게시글 수정에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">게시글 수정</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">카테고리</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">내용</label>
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
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    language: 'ko_KR',
                    images_upload_url: 'http://localhost:3001/api/upload',
                    images_upload_handler: function (blobInfo, success, failure) {
                      const formData = new FormData();
                      formData.append('image', blobInfo.blob(), blobInfo.filename());
                      axios.post('http://localhost:3001/api/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                        withCredentials: true
                      })
                      .then(response => {
                        success(response.data.url);
                      })
                      .catch(error => {
                        failure('이미지 업로드에 실패했습니다.');
                      });
                    }
                  }}
                />
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                수정
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBoardPage; 