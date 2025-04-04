import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Tooltip, TextField } from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Link,
  Image,
  Code
} from '@mui/icons-material';

const SimpleEditor = ({ value, onChange, placeholder = '내용을 입력하세요...' }) => {
  const editorRef = useRef(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleInput = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleSelectionChange = () => {
    if (editorRef.current) {
      setCursorPosition(editorRef.current.selectionStart);
    }
  };

  const execCommand = (command, value = null) => {
    if (editorRef.current) {
      document.execCommand(command, false, value);
      editorRef.current.focus();
    }
  };

  const toggleFormat = (format) => {
    switch (format) {
      case 'bold':
        setIsBold(!isBold);
        execCommand('bold');
        break;
      case 'italic':
        setIsItalic(!isItalic);
        execCommand('italic');
        break;
      case 'underline':
        setIsUnderline(!isUnderline);
        execCommand('underline');
        break;
      case 'list':
        execCommand('insertUnorderedList');
        break;
      case 'number':
        execCommand('insertOrderedList');
        break;
      case 'quote':
        execCommand('formatBlock', 'blockquote');
        break;
      case 'code':
        execCommand('formatBlock', 'pre');
        break;
      default:
        break;
    }
  };

  const insertImage = () => {
    const url = prompt('이미지 URL을 입력하세요:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
      <Box sx={{ borderBottom: '1px solid #ccc', p: 1, display: 'flex', gap: 1 }}>
        <Tooltip title="굵게">
          <IconButton
            size="small"
            onClick={() => toggleFormat('bold')}
            color={isBold ? 'primary' : 'default'}
          >
            <FormatBold />
          </IconButton>
        </Tooltip>
        <Tooltip title="기울임">
          <IconButton
            size="small"
            onClick={() => toggleFormat('italic')}
            color={isItalic ? 'primary' : 'default'}
          >
            <FormatItalic />
          </IconButton>
        </Tooltip>
        <Tooltip title="밑줄">
          <IconButton
            size="small"
            onClick={() => toggleFormat('underline')}
            color={isUnderline ? 'primary' : 'default'}
          >
            <FormatUnderlined />
          </IconButton>
        </Tooltip>
        <Tooltip title="글머리 기호">
          <IconButton size="small" onClick={() => toggleFormat('list')}>
            <FormatListBulleted />
          </IconButton>
        </Tooltip>
        <Tooltip title="번호 매기기">
          <IconButton size="small" onClick={() => toggleFormat('number')}>
            <FormatListNumbered />
          </IconButton>
        </Tooltip>
        <Tooltip title="인용구">
          <IconButton size="small" onClick={() => toggleFormat('quote')}>
            <FormatQuote />
          </IconButton>
        </Tooltip>
        <Tooltip title="링크">
          <IconButton size="small" onClick={insertLink}>
            <Link />
          </IconButton>
        </Tooltip>
        <Tooltip title="이미지">
          <IconButton size="small" onClick={insertImage}>
            <Image />
          </IconButton>
        </Tooltip>
        <Tooltip title="코드">
          <IconButton size="small" onClick={() => toggleFormat('code')}>
            <Code />
          </IconButton>
        </Tooltip>
      </Box>
      <TextField
        inputRef={editorRef}
        multiline
        fullWidth
        value={value}
        onChange={handleInput}
        onSelect={handleSelectionChange}
        placeholder={placeholder}
        sx={{
          '& .MuiInputBase-root': {
            minHeight: '200px',
            p: 2,
            '& textarea': {
              direction: 'ltr',
              textAlign: 'left'
            }
          }
        }}
      />
    </Box>
  );
};

export default SimpleEditor;