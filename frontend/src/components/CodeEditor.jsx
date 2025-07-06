import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@mui/material/styles';
import { Box, FormControl, Select, MenuItem } from '@mui/material';
import { SocketContext } from '../contexts/socket.context';
import { useParams } from 'react-router-dom';

const CodeEditor = ({
  language = 'javascript',
  value,
  onChange,
  onMount,
  options = {},
  languages = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp'],
}) => {
  const theme = useTheme();
  const editorRef = useRef(null);
  const suppress = useRef(false);

  const editorTheme = theme.palette.mode === 'dark' ? 'vs-dark' : 'light';
  const { socket } = useContext(SocketContext);
  const [currentLang, setCurrentLang] = useState(language);
  const { code: roomId } = useParams();

  const handleLangChange = (e) => {
    setCurrentLang(e.target.value);
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room on load
    socket.emit('join-room', roomId);

    // Apply remote delta
    socket.on('remote-delta', (delta) => {
      if (!editorRef.current || !delta) return;

      suppress.current = true;
      const model = editorRef.current.getModel();

      model.applyEdits([{
        range: new window.monaco.Range(
          delta.range.startLineNumber,
          delta.range.startColumn,
          delta.range.endLineNumber,
          delta.range.endColumn
        ),
        text: delta.text,
        forceMoveMarkers: true
      }]);
      suppress.current = false;
    });

    // Optional: receive full content on init (only once per join)
    socket.on('init', (initialContent) => {
      if (editorRef.current && typeof initialContent === 'string') {
        suppress.current = true;
        editorRef.current.setValue(initialContent);
        suppress.current = false;
      }
    });

    return () => {
      socket.off('remote-delta');
      socket.off('init');
    };
  }, [socket, roomId]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    editor.onDidChangeModelContent((event) => {
      if (suppress.current || !roomId || !socket) return;

      for (const change of event.changes) {
        socket.emit('send-delta', {
          roomId,
          delta: {
            range: change.range,
            text: change.text
          }
        });
      }
    });

    if (onMount) onMount(editor, monaco);
  }, [roomId, socket, onMount]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Floating language selector */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <FormControl size="small" variant="outlined" sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 1 }}>
          <Select
            value={currentLang}
            onChange={handleLangChange}
            sx={{ minWidth: 100 }}
          >
            {languages.map((lang) => (
              <MenuItem key={lang} value={lang}>
                {lang}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Editor
        height="100%"
        defaultLanguage={language}
        language={currentLang}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={editorTheme}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          ...options,
        }}
      />
    </Box>
  );
};

export default CodeEditor;
