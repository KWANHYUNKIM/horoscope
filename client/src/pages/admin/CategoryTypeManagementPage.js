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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';

const CategoryTypeManagementPage = () => {
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    type_name: '',
    type_code: '',
    description: '',
    order_sequence: 1,
    is_active: true
  });

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
    fetchCategoryTypes();
  }, []);

  const handleOpen = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData(type);
    } else {
      setEditingType(null);
      setFormData({
        type_name: '',
        type_code: '',
        description: '',
        order_sequence: 1,
        is_active: true
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingType(null);
    setFormData({
      type_name: '',
      type_code: '',
      description: '',
      order_sequence: 1,
      is_active: true
    });
  };

  const handleDelete = async (id) => {
    setEditingType(categoryTypes.find(type => type.id === id));
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${getApiUrl()}/api/boards/category-types/${editingType.id}`, { withCredentials: true });
      fetchCategoryTypes();
      setDeleteDialogOpen(false);
      alert('카테고리 타입이 삭제되었습니다.');
    } catch (error) {
      console.error('카테고리 타입 삭제 실패:', error);
      alert('카테고리 타입 삭제에 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await axios.put(
          `${getApiUrl()}/api/boards/category-types/${editingType.id}`,
          formData,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${getApiUrl()}/api/boards/category-types`,
          formData,
          { withCredentials: true }
        );
      }
      fetchCategoryTypes();
      handleClose();
      alert(editingType ? '카테고리 타입이 수정되었습니다.' : '새로운 카테고리 타입이 추가되었습니다.');
    } catch (error) {
      console.error('카테고리 타입 저장 실패:', error);
      alert('카테고리 타입 저장에 실패했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">카테고리 타입 관리</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          새로운 카테고리 타입 추가
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>타입 이름</TableCell>
              <TableCell>타입 코드</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>순서</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categoryTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.type_name}</TableCell>
                <TableCell>{type.type_code}</TableCell>
                <TableCell>{type.description}</TableCell>
                <TableCell>{type.order_sequence}</TableCell>
                <TableCell>{type.is_active ? '활성' : '비활성'}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(type)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(type.id)}
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
          {editingType ? '카테고리 타입 수정' : '새로운 카테고리 타입 추가'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="타입 이름"
              name="type_name"
              value={formData.type_name}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="타입 코드"
              name="type_code"
              value={formData.type_code}
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
              type="number"
              label="순서"
              name="order_sequence"
              value={formData.order_sequence}
              onChange={handleChange}
              margin="normal"
              required
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={handleChange}
                  name="is_active"
                />
              }
              label="활성화"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>취소</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingType ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>카테고리 타입 삭제</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 카테고리 타입을 삭제하시겠습니까? 삭제된 카테고리 타입은 복구할 수 없습니다.
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

export default CategoryTypeManagementPage; 