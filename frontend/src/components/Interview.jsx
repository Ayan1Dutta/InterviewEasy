// src/components/Interview.jsx
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  styled,
} from '@mui/material';
import CollaborativeEditorPopup from './NoteEditor';
import CodeEditor from './CodeEditor';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/user.context';
import axios from 'axios';

const VideoBox = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[900],
  position: 'relative',
  paddingBottom: '56.25%',
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

const Divider = styled('div')(({ theme }) => ({
  height: 5,
  cursor: 'row-resize',
  backgroundColor: theme.palette.divider,
  '&:hover': { backgroundColor: theme.palette.text.disabled },
}));

const CircularControlButton = styled(Button)(({ theme }) => ({
  minWidth: 40,
  height: 40,
  borderRadius: '50%',
  fontSize: '1rem',
  padding: 0,
  color: '#fff',
  backgroundColor: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const Interview = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [output, setOutput] = useState('');
  const [editorFraction, setEditorFraction] = useState(0.7);
  const [initialCode, setinitialCode] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const navigate = useNavigate();

  const { code: roomId } = useParams();
  const { authUser } = useContext(AuthContext);


  const editorRef = useRef();
  const containerRef = useRef();

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const [host, setHost] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);


  useEffect(() => {
    const fetchInterviewInfo = async () => {
      try {
        const res = await axios.post("http://localhost:3000/api/interview/sessions/interview", { sessionCode: roomId },
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          });
        const { host_email, code } = res.data;
        if (host_email === authUser.email) {
          setHost(true);
        }
        setinitialCode(code);
        setStartTime(new Date());
      } catch (err) {
        console.log("error in Interview Route", err.response?.data?.message || err.message);
      }
    };
    if (authUser) fetchInterviewInfo();
  }, [authUser, roomId]);
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const elapsed = new Date() - startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setElapsedTime(`${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime]);

  const toggleVideo = async () => {
    const videoTrack = mediaStreamRef.current?.getVideoTracks()?.[0];
    if (videoTrack && videoTrack.readyState === 'live') {
      // Stop video hardware
      videoTrack.stop();
      setIsVideoOn(false);
    } else {
      // Restart video stream only
      await startStream(true, isAudioOn);
    }
  };

  const toggleAudio = async () => {
    const audioTrack = mediaStreamRef.current?.getAudioTracks()?.[0];

    if (audioTrack && audioTrack.readyState === 'live') {
      // Stop mic hardware
      audioTrack.stop();
      setIsAudioOn(false);
    } else {
      // Restart audio stream only
      await startStream(isVideoOn, true);
    }
  };


  const startStream = async (needVideo = true, needAudio = true) => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: needVideo,
        audio: needAudio,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      setIsVideoOn(!!videoTrack);
      setIsAudioOn(!!audioTrack);

    } catch (err) {
      console.error('Media access failed:', err);
    }
  };


  const handleRun = () => {
    setOutput('▶️ Running… (stubbed output)');
  };

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

  const handleEndInterview = async (e) => {

    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/interview/sessions/end', {
        sessionCode: roomId
      },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
      );
      if(res) alert(res.data.message || 'Ended');
      navigate('/')
      
    } catch (err) {
      alert('something wrong happened while deleting intrview');
    }
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left panel: video feeds */}
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
        {/* First Video Box (User webcam) */}
        <VideoBox elevation={2}>
          <VideoInner ref={videoRef} autoPlay muted playsInline />
          {/* Overlay buttons */}
          <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
            <CircularControlButton onClick={toggleVideo}>
              {isVideoOn ? '📷' : '🚫'}
            </CircularControlButton>
            <CircularControlButton onClick={toggleAudio}>
              {isAudioOn ? '🎤' : '🔇'}
            </CircularControlButton>
          </Box>
        </VideoBox>

        {/* Second Video Box (Static video) */}
        <VideoBox elevation={2}>
          <VideoInner
            src="https://www.w3schools.com/html/movie.mp4"
            controls
            muted
            autoPlay
          />
        </VideoBox>
      </Box>

      {/* Right panel: Code editor and output */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Box sx={{ flex: editorFraction, overflow: 'hidden' }}>
          <CodeEditor
            onMount={(editor) => { editorRef.current = editor }}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              automaticLayout: true,
            }}
            content={initialCode}
          />
        </Box>

        <Divider onMouseDown={onMouseDown} />

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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            {host && (
              <Button variant="contained" size="small" onClick={handleEndInterview}>
                End
              </Button>
            )}
            <Box sx={{ fontSize: '1rem' }}>
              {elapsedTime}
            </Box>
            <Button variant="contained" size="small" onClick={handleRun}>
              Run ▶️
            </Button>
          </Box>

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

      {/* Floating Notes Button */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          right: 16,
          zIndex: 100,
        }}
      >
        <CircularControlButton variant="contained" onClick={() => setPopupOpen(!popupOpen)}>
          ✏️
        </CircularControlButton>
      </Box>

      {/* Notes editor popup */}
      <CollaborativeEditorPopup open={popupOpen} toggleOpen={() => setPopupOpen(!popupOpen)} roomId={roomId} />
    </Box>
  );
};

export default Interview;
