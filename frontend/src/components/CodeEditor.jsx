// src/components/CodeEditor.jsx
import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({
  language = 'javascript',
  value,
  onChange,
  onMount,
  options = {},
}) => (
  <Editor
    height="100%"
    defaultLanguage={language}
    language={language}
    value={value}
    onChange={onChange}
    onMount={onMount}
    options={{
      minimap: { enabled: false },
      wordWrap: 'on',
      fontSize: 14,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      ...options,
    }}
  />
);

export default CodeEditor;
