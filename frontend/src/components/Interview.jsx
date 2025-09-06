import { useContext, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tooltip,
  IconButton,
  Chip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FaceIcon from '@mui/icons-material/Face';
import CollaborativeEditorPopup from './NoteEditor';
import CodeEditor from './CodeEditor';
import { clearCodesFromLocal } from '../contexts/code.context';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/user.context';
import axios from 'axios';
const BASE_URL = import.meta.env.MODE === 'development' ? 'http://localhost:3000/api' : '/api';
import { SocketContext } from '../contexts/socket.context';
import { useVideoCall } from '../contexts/VIdeoCallManager';

// --- Styled Components (No changes) ---
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


// --- React Component ---
const Interview = () => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [output, setOutput] = useState('');
  const [editorFraction, setEditorFraction] = useState(0.7);
  // Holds initial codes object fetched from backend (multi-language) or a single string legacy value
  const [initialCode, setInitialCode] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [host, setHost] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState('Copy ID');
  const [hostUser, setHostUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [notesContent, setNotesContent] = useState('');
  const [refreshPending, setRefreshPending] = useState(false);
  // --- ADDITION: State to manage dialog button during async leave ---
  const [isLeaving, setIsLeaving] = useState(false);


  const { code: roomId } = useParams();
  const { authUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  const remoteVideoRef = useRef(null);
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const {
    startStream, handleReadyToCall, closeConnection, readyToCall, otherUser, isCallConnected,
  } = useVideoCall({ roomId, authUser, host, videoRef, remoteVideoRef, mediaStreamRef });

  useEffect(() => {
  if (!socket) return;
    const fetchInterviewInfo = async () => {
      try {
  const res = await axios.post(`${BASE_URL}/interview/sessions/interview`, { sessionCode: roomId }, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });

  const { host_email, participants, code, notes } = res.data;

        setParticipants(participants);
        const hostObj = participants.find(u => u.email === host_email);
        setHostUser(hostObj);
        if (host_email === authUser.email) {
          socket.emit('host-joined', { roomId, user: authUser });
          setHost(true);
        } else {
          socket.emit('user-joined', { roomId, user: authUser });
        }

  // Store initial code(s); may be object {javascript:"...", java:"..."} or string
  setInitialCode(code);
        if (typeof notes === 'string') {
          setNotesContent(notes);
        }
        const myJoinTime = new Date().getTime();
        socket.emit('sync-start-time', { roomId, newStartTime: myJoinTime });

      } catch (err) {
        console.error("Error fetching interview info:", err.response?.data?.message || err.message);
        alert("Failed to join the interview session. You may be unauthorized or the session is invalid.");
        navigate('/');
      }
    };
    if (authUser?.email && roomId) {
      fetchInterviewInfo();
    }
  }, [authUser, roomId, navigate, socket]);

  useEffect(() => {
    startStream();
    document.documentElement.requestFullscreen().catch((err) => {
      console.log(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
    return () => closeConnection();
  }, [startStream, closeConnection]);

  useEffect(() => {
    if (host || !socket) return;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        socket.emit('fullscreen-change', { roomId, message: `Warning: ${authUser.email} has exited fullscreen mode.` });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [socket, host, roomId, authUser]);

  useEffect(() => {
    if (!socket) return;
    const handleUserJoined = ({ user }) => {
      if (user) {
        setParticipants((prev) => {
          if (prev.some(p => p.email === user.email)) return prev;
          return [...prev, user];
        });
        // Host forces language reset to javascript whenever a new unique user joins
        if (host && user.email !== authUser?.email) {
          socket.emit('force-language-js', { roomId });
        }
      }
    };
    const handleInterviewEnded = ({ message }) => {
      alert(message || 'Interview ended by the host.');
      closeConnection();
      navigate('/');
    };
    const handleFullscreenWarning = ({ message }) => alert(message);
    const handleUserLeft = ({ email }) => {
      setParticipants((prev) => prev.filter((p) => p.email !== email));
    };
    const handleTimeSync = ({ newStartTime }) => {
      setStartTime((prevStartTime) => {
        const newStartTimeDate = new Date(newStartTime);
        if (!prevStartTime || newStartTimeDate > prevStartTime) {
          return newStartTimeDate;
        }
        return prevStartTime;
      });
    };
    const handleNotesUpdate = ({ content }) => {
      setNotesContent(content);
    };
    const handleCodeOutput = ({ output }) => {
      setOutput(output);
    };
    socket.on('sync-start-time', handleTimeSync);
    socket.on('interview-ended', handleInterviewEnded);
    socket.on('user-joined', handleUserJoined);
    socket.on('host-joined', handleUserJoined);
    socket.on('fullscreen-warning', handleFullscreenWarning);
    socket.on('code-output', handleCodeOutput);
    socket.on('user-left', handleUserLeft);
    socket.on('receive-notes-update', handleNotesUpdate);
    return () => {
      socket.off('sync-start-time', handleTimeSync);
      socket.off('interview-ended', handleInterviewEnded);
      socket.off('user-joined', handleUserJoined);
      socket.off('host-joined', handleUserJoined);
      socket.off('fullscreen-warning', handleFullscreenWarning);
      socket.off('code-output', handleCodeOutput);
      socket.off('user-left', handleUserLeft);
      socket.off('receive-notes-update', handleNotesUpdate);
    };
  }, [socket, navigate, closeConnection, host, authUser, roomId]);

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const elapsed = new Date() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Consolidated useEffect for handling all page exit/refresh attempts & back navigation
  useEffect(() => {
    // --- Intercepts keyboard shortcuts like F5, Ctrl+R ---
    const handleKeyDown = (e) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
        e.preventDefault();
        // Show confirmation dialog instead of immediate leave
        setRefreshPending(true);
        setShowLeaveDialog(true);
      }
    };

    const handlePopState = (e) => {
      e.preventDefault();
      setShowLeaveDialog(true);
      window.history.pushState(null, '', window.location.href);
    };

    const handleBeforeUnload = (e) => {
      if (socket && authUser?.email && roomId) {
        socket.emit('user-left', { roomId, email: authUser.email });
        if (host) {
          socket.emit('end-interview', { roomId });
          navigator.sendBeacon(
            `${BASE_URL}/interview/sessions/end`,
            JSON.stringify({ sessionCode: roomId })
          );
        }
      }
      closeConnection();
      // Optional: show native prompt
      e.preventDefault();
      e.returnValue = '';
    };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [socket, authUser, roomId, host, closeConnection, navigate]);

  // Notes change handling moved inside NoteEditor for debounced DB persistence

  const handleLeaveInterview = () => {
    socket?.emit('user-left', { roomId, email: authUser.email });
    clearCodesFromLocal();
    closeConnection();
    alert('You have left the interview.');
    navigate('/');
  };

  const handleEndInterview = async () => {
    socket?.emit('end-interview', { roomId });
    try {
  await axios.post(`${BASE_URL}/interview/sessions/end`, {
        sessionCode: roomId
      }, { withCredentials: true });
    } catch (err) {
      alert('An error occurred while ending the interview.');
    }
    clearCodesFromLocal();
    closeConnection();
    navigate('/');
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(roomId);
    setCopyTooltip('Copied!');
    setTimeout(() => setCopyTooltip('Copy ID'), 2000);
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const { top, height } = container.getBoundingClientRect();
    const onMouseMove = (moveEvent) => {
      let frac = (moveEvent.clientY - top) / height;
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
      {/* Left Panel (No changes) */}
      <Box sx={{ flexBasis: '25%', display: 'flex', flexDirection: 'column', gap: 2, p: 2, boxSizing: 'border-box' }}>
        <Paper elevation={3} sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Room ID: {roomId}</Typography>
          <Tooltip title={copyTooltip}>
            <IconButton onClick={handleCopyId} size="small"><ContentCopyIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Paper>
        <VideoBox elevation={2}>
          <VideoInner ref={videoRef} autoPlay muted playsInline />
        </VideoBox>
        {!isCallConnected && (
          <Button
            variant="contained"
            color={readyToCall ? 'warning' : 'primary'}
            fullWidth
            onClick={() => handleReadyToCall(authUser.email)}
            disabled={readyToCall}
          >
            {readyToCall ? (otherUser ? 'Connecting…' : 'Waiting for Partner…') : 'Ready to Call'}
          </Button>
        )}
        <VideoBox elevation={2}>
          <VideoInner ref={remoteVideoRef} autoPlay playsInline />
        </VideoBox>
      </Box>

      {/* Right Panel (No changes) */}
      <Box ref={containerRef} sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Box sx={{ flex: editorFraction, overflow: 'hidden' }}>
          <CodeEditor
            onMount={(editor) => { editorRef.current = editor; }}
            options={{ minimap: { enabled: false }, wordWrap: 'on', automaticLayout: true }}
            setOutput={setOutput}
            initialCodes={initialCode}
          />
        </Box>
        <Divider onMouseDown={onMouseDown} />
        <Box sx={{ flex: 1 - editorFraction, p: 1, bgcolor: 'background.paper', overflow: 'auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 1, display: 'flex', gap: 1, alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Participants:</Typography>
            {participants.map((p) => {
              const isCurrentUser = p.email === authUser?.email;
              const isTheHost = p.email === hostUser?.email;
              const tags = [];
              if (isTheHost) tags.push('Host');
              if (isCurrentUser) tags.push('You');
              const label = `${p.name || p.email}${tags.length > 0 ? ` (${tags.join(', ')})` : ''}`;
              return (
                <Chip
                  key={p.email}
                  icon={<FaceIcon />}
                  label={label}
                  color={isCurrentUser ? "primary" : "default"}
                  size="small"
                  variant={isCurrentUser ? "filled" : "outlined"}
                />
              );
            })}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 1 }}>
            {host ? (
              <Button variant="contained" size="small" onClick={() => setShowLeaveDialog(true)}>End</Button>
            ) : (
              <Button variant="contained" size="small" onClick={() => setShowLeaveDialog(true)}>Leave</Button>
            )}
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{elapsedTime}</Typography>
          </Box>
          <Paper elevation={1} sx={{ flex: 1, p: 1, fontFamily: 'monospace', whiteSpace: 'pre-wrap', overflow: 'auto' }}>
            {output}
          </Paper>
        </Box>
      </Box>

      {/* Floating Notes Button (No changes) */}
      <Box sx={{ position: 'absolute', top: '50%', right: 16, zIndex: 100 }}>
        <CircularControlButton variant="contained" onClick={() => setPopupOpen(!popupOpen)}>
          ✏️
        </CircularControlButton>
      </Box>

      {/* Notes Editor (No changes) */}
      <CollaborativeEditorPopup
        open={popupOpen}
        toggleOpen={() => setPopupOpen(!popupOpen)}
        roomId={roomId}
        initialNotes={notesContent}
      />

      {/* --- CHANGE START: Logic inside Dialog is updated --- */}
      <Dialog open={showLeaveDialog} onClose={() => {
        // Prevent closing the dialog if a leave action is in progress
        if (isLeaving) return;
        setShowLeaveDialog(false);
        setRefreshPending(false);
      }}>
        <DialogTitle>{host ? 'End Interview?' : 'Leave Interview?'}</DialogTitle>
        <DialogContent>
          <Typography>
            {refreshPending
              ? 'Are you sure you want to refresh? This will cause you to leave the session.'
              : host
                ? 'This will end the interview for all participants. Are you sure?'
                : 'Are you sure you want to leave the interview?'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowLeaveDialog(false);
              setRefreshPending(false);
            }}
            color="secondary"
            disabled={isLeaving} // Disable cancel button while leaving
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (isLeaving) return; // Prevent double-clicks
              setIsLeaving(true);   // Set leaving state

              // This logic now correctly handles both regular leave and refresh-to-leave
              if (refreshPending) {
                // If the action was a refresh, emit leave event then reload
                socket?.emit('user-left', { roomId, email: authUser.email });
                closeConnection();
                // Use a short timeout to allow the socket event to send
                setTimeout(() => {
                  window.location.reload();
                }, 300);
              } else {
                // Otherwise, perform the normal leave/end action
                host ? handleEndInterview() : handleLeaveInterview();
              }
            }}
            color="primary"
            autoFocus
            disabled={isLeaving} // Disable confirm button while leaving
          >
            {isLeaving ? 'Leaving...' : (refreshPending || !host) ? 'Leave Interview' : 'End Interview'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- CHANGE END --- */}
    </Box>
  );
};

export default Interview;