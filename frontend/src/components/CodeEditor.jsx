import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@mui/material/styles';
import { Box, FormControl, Select, MenuItem } from '@mui/material';
import { SocketContext } from '../contexts/socket.context';
import { useParams } from 'react-router-dom';
import { languageBoilerplates } from "../assets/languages.js";
import { saveCodesToLocal, loadCodesFromLocal } from '../contexts/code.context.js';

const CodeEditor = ({
  options,
}) => {
  const languages = ['javascript', 'java', 'cpp'];
  const theme = useTheme();
  const editorRef = useRef(null);
  const suppress = useRef(false);
  const editorTheme = theme.palette.mode === 'dark' ? 'vs-dark' : 'light';
  const { socket } = useContext(SocketContext);
  const [currentLang, setCurrentLang] = useState('javascript');

  const [codes, setCodes] = useState(() => {
    return loadCodesFromLocal() || {
      javascript: languageBoilerplates.javascript,
      java: languageBoilerplates.java,
      cpp: languageBoilerplates.cpp
    };
  });

  const codesRef = useRef(codes);
  useEffect(() => {
    codesRef.current = codes;
  }, [codes]);

  const { code: roomId } = useParams();
  const debounceTimer = useRef(null);

  const handleLangChange = useCallback((newLang, isRemote = false) => {
    if (newLang === currentLang) return;

    const codeToSave = editorRef.current ? editorRef.current.getValue() : codesRef.current[currentLang];

    setCodes(prev => ({
      ...prev,
      [currentLang]: codeToSave,
      [newLang]: prev[newLang] !== undefined ? prev[newLang] : languageBoilerplates[newLang],
    }));
    
    setCurrentLang(newLang);

    if (!isRemote && socket) {
      socket.emit('change-language', {
        roomId,
        CodeLanguage: newLang
      });
    }
  }, [currentLang, roomId, socket]);


  // ✅ Effect 1: Handles joining the room.
  // This effect only depends on `socket` and `roomId`. It will run once
  // when the connection is ready and will NOT re-run on language changes.
  useEffect(() => {
    if (!socket || !roomId) return;
    
    // Initial setup events
    socket.emit('join-room', roomId);
    socket.on('init-code', ({ code }) => {
      setCodes(prev => ({ ...prev, ...code }));
    });

    return () => {
      socket.off('init-code');
      // You might also want a `leave-room` event here if your backend supports it
    };
  }, [socket, roomId]);

  // ✅ Effect 2: Manages dynamic event listeners.
  // This effect handles events that need up-to-date state handlers.
  // It will re-run only when `handleLangChange` is updated (i.e., when `currentLang` changes).
  useEffect(() => {
    if (!socket) return;

    socket.on('remote-delta', (delta) => {
      if (!editorRef.current || !delta) return;
      suppress.current = true;
      const model = editorRef.current.getModel();
      if (window.monaco) {
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
      }
      suppress.current = false;
    });

    const handleRemoteLanguageChange = (lang) => {
      handleLangChange(lang, true);
    };
    socket.on("remote-change-language", handleRemoteLanguageChange);

    return () => {
      socket.off('remote-delta');
      socket.off('remote-change-language', handleRemoteLanguageChange);
    };
  }, [socket, handleLangChange]);

  const handleEditorDidMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.onDidChangeModelContent((event) => {
      if (suppress.current || !roomId || !socket) return;
      for (const change of event.changes) {
        socket.emit('send-delta', {
          roomId,
          delta: { range: change.range, text: change.text }
        });
      }
      const updatedValue = editor.getValue();
      setCodes(prev => ({ ...prev, [currentLang]: updatedValue }));

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        socket.emit('persistCodeToDB', {
          roomId,
          language: currentLang,
          content: updatedValue
        });
        saveCodesToLocal({ ...codesRef.current, [currentLang]: updatedValue });
      }, 3000);
    });
  }, [roomId, socket, currentLang]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
        <FormControl size="small" variant="outlined" sx={{ backgroundColor: theme.palette.background.paper, borderRadius: 1 }}>
          <Select
            value={currentLang}
            onChange={(e) => handleLangChange(e.target.value)}
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
        key={currentLang}
        height="100%"
        language={currentLang}
        value={codes[currentLang] || ''}
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