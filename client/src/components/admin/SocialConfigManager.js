import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const SocialConfigManager = () => {
  const [configs, setConfigs] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formData, setFormData] = useState({
    provider: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    environment: 'development',
    is_active: true
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/admin/social-configs', {
        withCredentials: true
      });
      setConfigs(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다.' });
    }
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setFormData(config);
    setEditDialogOpen(true);
  };

  const handleDelete = (config) => {
    setSelectedConfig(config);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedConfig) {
        await axios.put(
          `http://localhost:3001/api/admin/social-configs/${selectedConfig.provider}`,
          formData,
          { withCredentials: true }
        );
        setMessage({ type: 'success', text: '설정이 수정되었습니다.' });
      } else {
        await axios.post(
          'http://localhost:3001/api/admin/social-configs',
          formData,
          { withCredentials: true }
        );
        setMessage({ type: 'success', text: '설정이 추가되었습니다.' });
      }
      setEditDialogOpen(false);
      fetchConfigs();
    } catch (error) {
      setMessage({ type: 'error', text: '설정 저장에 실패했습니다.' });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:3001/api/admin/social-configs/${selectedConfig.provider}`,
        { withCredentials: true }
      );
      setMessage({ type: 'success', text: '설정이 삭제되었습니다.' });
      setDeleteDialogOpen(false);
      fetchConfigs();
    } catch (error) {
      setMessage({ type: 'error', text: '설정 삭제에 실패했습니다.' });
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">소셜 로그인 설정 관리</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSelectedConfig(null);
            setFormData({
              provider: '',
              client_id: '',
              client_secret: '',
              redirect_uri: '',
              environment: 'development',
              is_active: true
            });
            setEditDialogOpen(true);
          }}
        >
          새 설정 추가
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {configs.map((config) => (
          <Grid item xs={12} md={6} key={config.provider}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    {config.provider.toUpperCase()}
                  </Typography>
                  <Box>
                    <IconButton onClick={() => handleEdit(config)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(config)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="textSecondary">
                  Client ID: {config.client_id}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Redirect URI: {config.redirect_uri}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  환경: {config.environment}
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.is_active}
                      disabled
                    />
                  }
                  label="활성화"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 수정/추가 다이얼로그 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedConfig ? '소셜 로그인 설정 수정' : '새 소셜 로그인 설정 추가'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="제공자"
            value={formData.provider}
            onChange={(e) => handleChange('provider', e.target.value)}
            margin="normal"
            disabled={!!selectedConfig}
          />
          <TextField
            fullWidth
            label="Client ID"
            value={formData.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Client Secret"
            value={formData.client_secret}
            onChange={(e) => handleChange('client_secret', e.target.value)}
            margin="normal"
            type="password"
          />
          <TextField
            fullWidth
            label="Redirect URI"
            value={formData.redirect_uri}
            onChange={(e) => handleChange('redirect_uri', e.target.value)}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
              />
            }
            label="활성화"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>설정 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 {selectedConfig?.provider.toUpperCase()} 설정을 삭제하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            삭제
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialConfigManager; 