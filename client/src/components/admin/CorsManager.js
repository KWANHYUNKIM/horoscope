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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  DialogContentText
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import axios from 'axios';

const CorsManager = () => {
  const [origins, setOrigins] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [editingOrigin, setEditingOrigin] = useState(null);
  const [formData, setFormData] = useState({
    origin_url: '',
    environment: 'development',
    is_active: true,
    description: '',
    created_by: null,
    updated_by: null
  });

  const fetchOrigins = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/origins', {
        withCredentials: true
      });
      setOrigins(response.data);
    } catch (error) {
      console.error('Origin 목록 조회 실패:', error);
      alert('Origin 목록을 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchOrigins();
  }, []);

  const handleOpen = (origin = null) => {
    if (origin) {
      setEditingOrigin(origin);
      setFormData(origin);
    } else {
      setEditingOrigin(null);
      setFormData({
        origin_url: '',
        environment: 'development',
        is_active: true,
        description: '',
        created_by: null,
        updated_by: null
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingOrigin(null);
    setFormData({
      origin_url: '',
      environment: 'development',
      is_active: true,
      description: '',
      created_by: null,
      updated_by: null
    });
  };

  const handleDelete = async (id) => {
    setEditingOrigin(origins.find(origin => origin.id === id));
    setDeleteDialogOpen(true);
  };

  const handleActivate = async (id) => {
    setEditingOrigin(origins.find(origin => origin.id === id));
    setActivateDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3001/api/origins/${editingOrigin.id}`, {
        withCredentials: true
      });
      fetchOrigins();
      setDeleteDialogOpen(false);
      alert('Origin이 비활성화되었습니다.');
    } catch (error) {
      console.error('Origin 비활성화 실패:', error);
      alert('Origin 비활성화에 실패했습니다.');
    }
  };

  const confirmActivate = async () => {
    try {
      await axios.put(`http://localhost:3001/api/origins/${editingOrigin.id}`, {
        ...editingOrigin,
        is_active: true
      }, {
        withCredentials: true
      });
      fetchOrigins();
      setActivateDialogOpen(false);
      alert('Origin이 활성화되었습니다.');
    } catch (error) {
      console.error('Origin 활성화 실패:', error);
      alert('Origin 활성화에 실패했습니다.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        origin_url: formData.origin_url,
        environment: formData.environment,
        is_active: formData.is_active ? 1 : 0,
        description: formData.description
      };

      console.log('Submitting data:', submitData);

      if (editingOrigin) {
        await axios.put(`http://localhost:3001/api/origins/${editingOrigin.id}`, submitData, {
          withCredentials: true
        });
      } else {
        await axios.post('http://localhost:3001/api/origins', submitData, {
          withCredentials: true
        });
      }
      fetchOrigins();
      handleClose();
      alert(editingOrigin ? 'Origin이 수정되었습니다.' : '새로운 Origin이 추가되었습니다.');
    } catch (error) {
      console.error('Origin 저장 실패:', error);
      console.error('Error response:', error.response?.data);
      alert('Origin 저장에 실패했습니다.');
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
        <Typography variant="h5">CORS Origin 관리</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          새로운 Origin 추가
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Origin URL</TableCell>
              <TableCell>환경</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>설명</TableCell>
              <TableCell>생성일</TableCell>
              <TableCell>수정일</TableCell>
              <TableCell>관리</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {origins.map((origin) => (
              <TableRow key={origin.id}>
                <TableCell>{origin.origin_url}</TableCell>
                <TableCell>{origin.environment}</TableCell>
                <TableCell>{origin.is_active ? '활성' : '비활성'}</TableCell>
                <TableCell>{origin.description}</TableCell>
                <TableCell>{new Date(origin.created_at).toLocaleString()}</TableCell>
                <TableCell>{new Date(origin.updated_at).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(origin)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  {origin.is_active ? (
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(origin.id)}
                      color="error"
                    >
                      <BlockIcon />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => handleActivate(origin.id)}
                      color="success"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingOrigin ? 'Origin 설정 변경' : '새로운 Origin 추가'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Origin URL"
              value={formData.origin_url}
              onChange={(e) => setFormData({ ...formData, origin_url: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              select
              label="환경"
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              margin="normal"
              required
            >
              <MenuItem value="development">개발</MenuItem>
              <MenuItem value="staging">스테이징</MenuItem>
              <MenuItem value="production">운영</MenuItem>
            </TextField>
            <TextField
              fullWidth
              select
              label="상태"
              value={formData.is_active ? 1 : 0}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 1 })}
              margin="normal"
              required
            >
              <MenuItem value={1}>활성</MenuItem>
              <MenuItem value={0}>비활성</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>취소</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingOrigin ? '변경' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Origin 비활성화</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 Origin을 비활성화하시겠습니까? 비활성화된 Origin은 CORS 설정에서 제외됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            비활성화
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activateDialogOpen} onClose={() => setActivateDialogOpen(false)}>
        <DialogTitle>Origin 활성화</DialogTitle>
        <DialogContent>
          <DialogContentText>
            이 Origin을 활성화하시겠습니까? 활성화된 Origin은 CORS 설정에 포함됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateDialogOpen(false)}>취소</Button>
          <Button onClick={confirmActivate} color="success" autoFocus>
            활성화
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CorsManager; 