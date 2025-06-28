import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '@mui/material/styles';
import { Box, FormControl, Select, MenuItem } from '@mui/material';

const CodeEditor = ({
  language = 'javascript',
  value,
  onChange,
  onMount,
  options = {},
  languages = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp'],
}) => {
  const theme = useTheme();
  // Choose Monaco theme based on MUI palette mode
  const editorTheme = theme.palette.mode === 'dark' ? 'vs-dark' : 'light';

  const [currentLang, setCurrentLang] = useState(language);

  const handleLangChange = (e) => {
    setCurrentLang(e.target.value);
  };

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      {/* Floating language selector in top-right */}
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
        onMount={onMount}
        theme={editorTheme}  // apply dark or light theme
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
