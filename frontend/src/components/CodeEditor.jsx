import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@mui/material/styles';
import { Box, FormControl, Select, MenuItem, Button } from '@mui/material';
import axios from 'axios';
import { SocketContext } from '../contexts/socket.context';
import { useParams } from 'react-router-dom';
import { languageBoilerplates } from "../assets/languages.js";
import { saveCodesToLocal, loadCodesFromLocal } from '../contexts/code.context.js';

const CodeEditor = ({
  options, setOutput, initialCodes
}) => {
  const languages = ['javascript', 'java', 'cpp'];
  const theme = useTheme();
  const editorRef = useRef(null);
  const suppress = useRef(false);
  const modelsRef = useRef({});
  // Version tracking per language for authoritative full snapshot reconciliation
  const versionsRef = useRef({ javascript: 0, java: 0, cpp: 0 });
  // Track last snapshot content to avoid redundant full transmissions
  const lastSnapshotRef = useRef({ javascript: '', java: '', cpp: '' });
  const editorTheme = theme.palette.mode === 'dark' ? 'vs-dark' : 'light';
  const { socket } = useContext(SocketContext);
  const [currentLang, setCurrentLang] = useState('javascript');

  const [codes, setCodes] = useState(() => ({ ...languageBoilerplates }));
  const initialDbSyncDoneRef = useRef(false);

  // Merge initial codes (object or single string) only once
  const mergedInitialRef = useRef(false);
  useEffect(() => {
    if (mergedInitialRef.current) return;
    if (!initialCodes) return;
    let incoming = initialCodes;
    if (typeof incoming === 'string') {
      // Assume string belongs to current language only
      incoming = { [currentLang]: incoming };
    }
    if (typeof incoming === 'object') {
      setCodes(prev => ({ ...prev, ...incoming }));
      mergedInitialRef.current = true;
    }
  }, [initialCodes, currentLang]);

  const codesRef = useRef(codes);
  useEffect(() => {
    codesRef.current = codes;
  }, [codes]);

  const { code: roomId } = useParams();
  const debounceTimer = useRef(null);
  const fullSyncTimerRef = useRef(null);

  // ref to always have latest lang inside debounced callbacks
  const currentLangRef = useRef(currentLang);
  useEffect(() => { currentLangRef.current = currentLang; }, [currentLang]);

  const handleLangChange = useCallback((newLang, isRemote = false) => {
    if (!newLang || newLang === currentLangRef.current) return;

    // capture existing code *before* switching language
    const prevLang = currentLangRef.current;
    const prevValue = editorRef.current ? editorRef.current.getValue() : codesRef.current[prevLang];

    // Load snapshot from localStorage to source truth for target language
    const snapshot = loadCodesFromLocal() || {};
    const targetContent = (snapshot[newLang] !== undefined
      ? snapshot[newLang]
      : (codesRef.current[newLang] !== undefined ? codesRef.current[newLang] : languageBoilerplates[newLang]));

    const newCodes = {
      ...codesRef.current,
      [prevLang]: prevValue,
      [newLang]: targetContent
    };
    setCodes(newCodes);
    saveCodesToLocal(newCodes);

    currentLangRef.current = newLang;
    setCurrentLang(newLang); // triggers rerender only once

    // If model exists for new language, set its value explicitly from targetContent
    if (window.monaco && modelsRef.current[newLang]) {
      suppress.current = true;
      try {
        ignoreNextChangeRef.current = true; // ignore programmatic set
        modelsRef.current[newLang].setValue(targetContent);
      } finally {
        suppress.current = false;
      }
    }

    if (!isRemote && socket) {
      socket.emit('change-language', { roomId, CodeLanguage: newLang });
    }
  }, [roomId, socket]);

  // FIXED: Wrap the object in a function `() => ({...})`.
  // Also, since this object never changes, the dependency array should be empty [].
  const pistonRuntimes = useMemo(() => ({
    javascript: '18.15.0',
    java: '15.0.2',
    cpp: '10.2.0'
  }), []);

  // REMOVED: This block of code was causing a "ref is not defined" error
  // and is no longer needed with the current architecture.
  // useImperativeHandle(ref, () => ({...}));

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join-room', roomId);
    const handleInit = ({ code, currentLanguage }) => {
      if (code && typeof code === 'object') {
        const merged = { ...languageBoilerplates, ...code };
        setCodes(merged);
        saveCodesToLocal(merged); // immediate sync
        initialDbSyncDoneRef.current = true;
      }
      if (currentLanguage && currentLanguage !== currentLangRef.current) {
        handleLangChange(currentLanguage, true);
      }
    };
    socket.on('init-code', handleInit);
    return () => {
      socket.off('init-code', handleInit);
    };
  }, [socket, roomId, handleLangChange]);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteDelta = (payload) => {
      if (!payload) return;
      const { delta, language } = payload;
      if (!editorRef.current || !delta) return;
      if (language && language !== currentLangRef.current) return;
      const model = editorRef.current.getModel();
      if (!model || !window.monaco) return;
      suppress.current = true;
      try {
        model.applyEdits([
          {
            range: new window.monaco.Range(
              delta.range.startLineNumber,
              delta.range.startColumn,
              delta.range.endLineNumber,
              delta.range.endColumn
            ),
            text: delta.text,
            forceMoveMarkers: true
          }
        ]);
      } finally {
        suppress.current = false;
      }
    };

    const handleRemoteDeltaBatch = (payload) => {
      if (!payload || !editorRef.current) return;
      const { language, changes } = payload;
      if (language && language !== currentLangRef.current) return;
      if (!Array.isArray(changes) || changes.length === 0) return;
      const model = editorRef.current.getModel();
      if (!model || !window.monaco) return;
      suppress.current = true;
      try {
        const edits = changes.map(ch => ({
          range: new window.monaco.Range(
            ch.range.startLineNumber,
            ch.range.startColumn,
            ch.range.endLineNumber,
            ch.range.endColumn
          ),
          text: ch.text,
          forceMoveMarkers: true
        }));
        model.pushEditOperations([], edits, () => null);
      } finally {
        suppress.current = false;
      }
    };

    const handleRemoteLanguageChange = (lang) => {
      if (lang !== currentLangRef.current) handleLangChange(lang, true);
    };

    const handleRemoteFullCode = ({ language, content, version }) => {
      if (!language || typeof content !== 'string') return;
      // Version gating: only apply if newer version (if version provided)
      if (typeof version === 'number') {
        const currentVersion = versionsRef.current[language] || 0;
        if (version <= currentVersion) return; // stale or duplicate
        versionsRef.current[language] = version; // accept newer version
      }
      // Update local state & storage
      const updatedCodes = { ...codesRef.current, [language]: content };
      setCodes(prev => ({ ...prev, [language]: content }));
      saveCodesToLocal(updatedCodes);
      lastSnapshotRef.current[language] = content;
      // If it's for currently active language, update model content
      if (language === currentLangRef.current && editorRef.current && window.monaco) {
        const model = editorRef.current.getModel();
        if (model && model.getValue() !== content) {
          suppress.current = true;
          try {
            ignoreNextChangeRef.current = true;
            model.setValue(content);
          } finally {
            suppress.current = false;
          }
        }
      }
    };

    socket.on('remote-delta', handleRemoteDelta);
    socket.on('remote-delta-batch', handleRemoteDeltaBatch);
    socket.on('remote-change-language', handleRemoteLanguageChange);
    socket.on('remote-full-code', handleRemoteFullCode);
    return () => {
      socket.off('remote-delta', handleRemoteDelta);
      socket.off('remote-delta-batch', handleRemoteDeltaBatch);
      socket.off('remote-change-language', handleRemoteLanguageChange);
      socket.off('remote-full-code', handleRemoteFullCode);
    };
  }, [socket, handleLangChange]);
  
  const handleRun = async () => {
    if (!editorRef.current) return;

    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) {
      setOutput("Code is empty.");
      return;
    }

    const loadingMessage = '▶️ Executing...';
    setOutput(loadingMessage);
    socket.emit('code-output', { roomId, output: loadingMessage });

    try {
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
        language: currentLang,
        version: pistonRuntimes[currentLang],
        files: [{ content: sourceCode }],
      });

      let result = response.data.run.stdout || '';
      if (response.data.run.stderr) {
        result += `\n❌ Error:\n${response.data.run.stderr}`;
      }
      if (!result) {
        result = "Execution finished with no output.";
      }

      socket.emit('code-output', { roomId, output: result });
      setOutput(result);

    } catch (error) {
      console.error("Error executing code:", error);
      const errorMessage = `API Error: ${error.message}`;
      socket.emit('code-output', { roomId, output: errorMessage });
      setOutput(errorMessage);
    }
  };

  // Flag to ignore the first model content change right after language switch (programmatic value set)
  const ignoreNextChangeRef = useRef(false);

  const handleEditorDidMount = useCallback((editor) => {
    editorRef.current = editor;
    if (window.monaco) {
      languages.forEach(lang => {
        if (!modelsRef.current[lang]) {
          modelsRef.current[lang] = window.monaco.editor.createModel(codesRef.current[lang] || languageBoilerplates[lang], lang);
        }
      });
      editor.setModel(modelsRef.current[currentLangRef.current]);
    }
    editor.onDidChangeModelContent((event) => {
      if (suppress.current || !roomId || !socket) return;

      // If flagged, skip this change (likely triggered by language/value switch) then clear flag
      if (ignoreNextChangeRef.current) {
        ignoreNextChangeRef.current = false;
        return;
      }
      const lang = currentLangRef.current;
      const updatedValue = editor.getValue();

      // Emit batch of changes to preserve order remotely
      if (event.changes?.length) {
        const changesPayload = event.changes.map(ch => ({ range: ch.range, text: ch.text }));
        socket.emit('send-delta-batch', { roomId, language: lang, changes: changesPayload });
      }

  setCodes(prev => (prev[lang] === updatedValue ? prev : { ...prev, [lang]: updatedValue }));

      // Immediate local storage sync (no debounce)
      saveCodesToLocal({ ...codesRef.current });
      // Debounced DB persistence only
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        socket.emit('persistCodeToDB', { roomId, language: lang, content: codesRef.current[lang] });
      }, 3000);

      // Schedule an authoritative full snapshot (separate debounce) to correct any drift
      if (fullSyncTimerRef.current) clearTimeout(fullSyncTimerRef.current);
      fullSyncTimerRef.current = setTimeout(() => {
        const latest = codesRef.current[lang];
        if (lastSnapshotRef.current[lang] !== latest) {
          versionsRef.current[lang] = (versionsRef.current[lang] || 0) + 1;
          lastSnapshotRef.current[lang] = latest;
          socket.emit('send-full-code', { roomId, language: lang, content: latest, version: versionsRef.current[lang] });
        }
      }, 1500);
    });
  }, [roomId, socket]);

  // Whenever currentLang changes, set a flag to ignore the immediate programmatic update event
  useEffect(() => {
    if (!editorRef.current || !window.monaco) return;
    const model = modelsRef.current[currentLangRef.current];
    if (!model) {
      // Create missing model lazily
      modelsRef.current[currentLangRef.current] = window.monaco.editor.createModel(
        codesRef.current[currentLangRef.current] || languageBoilerplates[currentLangRef.current],
        currentLangRef.current
      );
    }
    const finalModel = modelsRef.current[currentLangRef.current];
    if (editorRef.current.getModel() !== finalModel) {
      ignoreNextChangeRef.current = true;
      editorRef.current.setModel(finalModel);
    }
  }, [currentLang]);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="contained" size="small" onClick={handleRun}>
          Run ▶️
        </Button>
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