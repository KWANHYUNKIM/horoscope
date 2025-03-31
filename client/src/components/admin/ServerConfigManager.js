import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const ServerConfigManager = () => {
  const [configs, setConfigs] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formData, setFormData] = useState({
    key_name: '',
    value: '',
    environment: 'development',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await api.get('/api/admin/server-configs');
      setConfigs(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: '서버 설정을 불러오는데 실패했습니다.' });
    }
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setFormData({
      key_name: config.key_name,
      value: config.value,
      environment: config.environment,
      description: config.description,
      is_active: config.is_active
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (config) => {
    setSelectedConfig(config);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/api/admin/server-configs/${selectedConfig.id}`);
      setMessage({ type: 'success', text: '서버 설정이 삭제되었습니다.' });
      setDeleteDialogOpen(false);
      fetchConfigs();
    } catch (error) {
      setMessage({ type: 'error', text: '서버 설정 삭제에 실패했습니다.' });
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedConfig) {
        await api.put(`/api/admin/server-configs/${selectedConfig.id}`, formData);
        setMessage({ type: 'success', text: '서버 설정이 업데이트되었습니다.' });
      } else {
        await api.post('/api/admin/server-configs', formData);
        setMessage({ type: 'success', text: '새로운 서버 설정이 추가되었습니다.' });
      }
      setEditDialogOpen(false);
      fetchConfigs();
    } catch (error) {
      setMessage({ type: 'error', text: '서버 설정 저장에 실패했습니다.' });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            서버 설정 관리
          </Typography>
          
          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Grid container spacing={2}>
            {configs.map((config) => (
              <Grid item xs={12} key={config.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1">{config.key_name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          환경: {config.environment}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {config.description}
                        </Typography>
                        <Typography variant="body1">{config.value}</Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.is_active}
                              onChange={() => handleChange('is_active', !config.is_active)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                          label={config.is_active ? "활성" : "비활성"}
                        />
                      </Box>
                      <Box>
                        <IconButton onClick={() => handleEdit(config)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(config)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
            <DialogTitle>
              {selectedConfig ? '서버 설정 수정' : '새로운 서버 설정 추가'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <TextField
                  fullWidth
                  label="설정 이름"
                  value={formData.key_name}
                  onChange={(e) => handleChange('key_name', e.target.value)}
                  margin="normal"
                  required
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>환경</InputLabel>
                  <Select
                    value={formData.environment}
                    label="환경"
                    onChange={(e) => handleChange('environment', e.target.value)}
                  >
                    <MenuItem value="development">개발</MenuItem>
                    <MenuItem value="staging">스테이징</MenuItem>
                    <MenuItem value="production">운영</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="값"
                  value={formData.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="설명"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  margin="normal"
                  multiline
                  rows={3}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                    />
                  }
                  label={formData.is_active ? "활성" : "비활성"}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary">
                저장
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle>서버 설정 삭제</DialogTitle>
            <DialogContent>
              <Typography>
                정말로 "{selectedConfig?.key_name}" 설정을 삭제하시겠습니까?
                이 작업은 되돌릴 수 없습니다.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
              <Button onClick={handleConfirmDelete} variant="contained" color="error">
                삭제
              </Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ServerConfigManager; 