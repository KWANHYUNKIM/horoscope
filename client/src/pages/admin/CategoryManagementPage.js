import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  DialogContentText,
  MenuItem
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    parent_id: null,
    category_type_id: '',
    order_sequence: 0,
    path: ''
  });

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/boards/categories`, { withCredentials: true });
      setCategories(response.data);
    } catch (error) {
      console.error('카테고리 목록 조회 실패:', error);
      alert('카테고리 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchCategoryTypes = async () => {
    try {
      const response = await axios.get(`${getApiUrl()}/api/boards/category-types`, { withCredentials: true });
      setCategoryTypes(response.data);
    } catch (error) {
      console.error('카테고리 타입 목록 조회 실패:', error);
      alert('카테고리 타입 목록을 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCategoryTypes();
  }, []);

  const handleOpen = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({
        category_name: '',
        description: '',
        parent_id: null,
        category_type_id: '',
        order_sequence: 0,
        path: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    setFormData({
      category_name: '',
      description: '',
      parent_id: null,
      category_type_id: '',
      order_sequence: 0,
      path: ''
    });
  };

  const handleDelete = async (id) => {
    setEditingCategory(categories.find(category => category.id === id));
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${getApiUrl()}/api/boards/categories/${editingCategory.id}`, { withCredentials: true });
      fetchCategories();
      setDeleteDialogOpen(false);
      alert('카테고리가 삭제되었습니다.');
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert('카테고리 삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(
          `${getApiUrl()}/api/boards/categories/${editingCategory.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${getApiUrl()}/api/boards/categories`,
          formData,
          { withCredentials: true }
        );
      }
      fetchCategories();
      handleClose();
      alert(editingCategory ? '카테고리가 수정되었습니다.' : '새로운 카테고리가 추가되었습니다.');
    } catch (error) {
      console.error('카테고리 저장 실패:', error);
      alert('카테고리 저장에 실패했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">카테고리 관리</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          새로운 카테고리 추가
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>카테고리 이름</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>카테고리 타입</TableCell>
              <TableCell>상위 카테고리</TableCell>
              <TableCell>순서</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.category_name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  {categoryTypes.find(type => type.id === category.category_type_id)?.type_name || '없음'}
                </TableCell>
                <TableCell>
                  {category.parent_id ? 
                    categories.find(c => c.id === category.parent_id)?.category_name : 
                    '없음'}
                </TableCell>
                <TableCell>{category.order_sequence}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(category)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(category.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingCategory ? '카테고리 수정' : '새로운 카테고리 추가'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="카테고리 이름"
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="설명"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="카테고리 타입"
              name="category_type_id"
              value={formData.category_type_id}
              onChange={handleChange}
              margin="normal"
              required
            >
              {categoryTypes.map(type => (
                <MenuItem key={type.id} value={type.id}>
                  {type.type_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              select
              label="상위 카테고리"
              name="parent_id"
              value={formData.parent_id || ''}
              onChange={handleChange}
              margin="normal"
            >
              <MenuItem value="">없음</MenuItem>
              {categories
                .filter(category => category.id !== editingCategory?.id)
                .map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.category_name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="순서"
              name="order_sequence"
              value={formData.order_sequence}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="경로"
              name="path"
              value={formData.path}
              onChange={handleChange}
              margin="normal"
              required
              helperText="카테고리의 URL 경로를 입력하세요 (예: /hospital/notice)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>취소</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingCategory ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>카테고리 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 카테고리를 삭제하시겠습니까? 삭제된 카테고리는 복구할 수 없습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManagementPage; 