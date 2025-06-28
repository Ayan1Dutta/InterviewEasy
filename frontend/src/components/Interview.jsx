// src/components/Interview.jsx
import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  styled,
} from '@mui/material';
import CodeEditor from './CodeEditor';


const VideoBox = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  position: 'relative',
  paddingBottom: '56.25%', // maintain 16:9
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius,
  flex: 1,
}));

const VideoInner = styled('video')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

// Draggable horizontal divider
const Divider = styled('div')(({ theme }) => ({
  height: 5,
  cursor: 'row-resize',
  backgroundColor: theme.palette.divider,
  '&:hover': { backgroundColor: theme.palette.text.disabled },
}));

const Interview = () => {
  const [code, setCode] = useState('// write your code here');
  const [output, setOutput] = useState('');
  const editorRef = useRef();

  
  const [editorFraction, setEditorFraction] = useState(0.7);
  const containerRef = useRef();

  const handleRun = () => {
    // stub: replace with real sandbox/backend call
    setOutput('▶️ Running… (stubbed output)');
  };

  // Drag to resize editor vs output
  const onMouseDown = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    const { top, height } = container.getBoundingClientRect();

    const onMouseMove = (e) => {
      let frac = (e.clientY - top) / height;
      if (frac < 0.1) frac = 0.1;
      if (frac > 0.9) frac = 0.9;
      setEditorFraction(frac);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left panel: video feeds (25% width) */}
      <Box
        sx={{
          flexBasis: '25%',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2,
          boxSizing: 'border-box',
        }}
      >
        <VideoBox elevation={2}>
          <VideoInner
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            controls
            muted
            autoPlay
          />
        </VideoBox>
        <VideoBox elevation={2}>
          <VideoInner
            src="https://www.w3schools.com/html/movie.mp4"
            controls
            muted
            autoPlay
          />
        </VideoBox>
      </Box>

      {/* Right panel: editor & output (75% width) */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Editor pane */}
        <Box sx={{ flex: editorFraction, overflow: 'hidden' }}>
          <CodeEditor
            language="javascript"
            value={code}
            onChange={setCode}
            onMount={(editor) => { editorRef.current = editor; }}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </Box>
        {/* Draggable divider */}
        <Divider onMouseDown={onMouseDown} />
        {/* Output pane */}
        <Box
          sx={{
            flex: 1 - editorFraction,
            display: 'flex',
            flexDirection: 'column',
            p: 1,
            bgcolor: 'background.paper',
            overflow: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Run button aligned right */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <Button variant="contained" size="small" onClick={handleRun}>
              Run ▶️
            </Button>
          </Box>

          {/* Output content */}
          <Paper
            elevation={1}
            sx={{
              flex: 1,
              p: 1,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
            }}
          >
            {output}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Interview;
