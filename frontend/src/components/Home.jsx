import React, { useContext, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/user.context';
import axios from 'axios';
import { SocketContext } from '../contexts/socket.context';

const Home = () => {
  const { authUser } = useContext(AuthContext);
  const [interviewCode, setInterviewCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // error popup state
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const { socket } = useContext(SocketContext)

  // auto-hide error popup
  useEffect(() => {
    if (!showError) return;
    const timer = setTimeout(() => setShowError(false), 2000);
    return () => clearTimeout(timer);
  }, [showError]);

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setShowError(true);
  };

  const handleJoin = async () => {
    if (!authUser) {
      triggerError('Please login to join');
      return;
    }
    if (!interviewCode.trim()) {
      triggerError('Please enter a valid code');
      return;
    }
    try {
      const response = await axios.post(
        'http://localhost:3000/api/interview/sessions/join',
        { sessionCode: interviewCode },
        { withCredentials: true }
      );
      socket.emit("join-room", interviewCode);
      navigate(`/interview/sessions/${interviewCode}`, {
        state: { isHost: false },
      });

    } catch (err) {
      triggerError(err.response?.data?.message || 'Something went wrong while joining');
    }
  };

  const handleCopy = () => {
    if (!interviewCode) return;
    navigator.clipboard.writeText(interviewCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  const handleCreate = async () => {
    if (!authUser) {
      triggerError('Please login to create interview');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/interview/sessions',
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        const code = response.data.code;
        socket.emit("join-room", code);
        navigate(`/interview/sessions/${code}`, { state: { isHost: true } });
      } else {
        triggerError('Failed to create interview session. Please try again.');
      }
    } catch (err) {
      triggerError(err.response?.data?.message || 'Something went wrong while creating InterView Secession');
    }
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #23234b 0%, #3a3a5c 100%)',
          py: 6,
        }}
      >
        <Grid
          container
          spacing={4}
          sx={{
            maxWidth: 900,
            mx: 'auto',
            px: { xs: 2, sm: 4 },
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {/* Join Interview Card */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: theme.palette.background.paper,
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Join Interview
              </Typography>
              <TextField
                label="Enter Interview Code"
                variant="outlined"
                fullWidth
                value={interviewCode}
                onChange={(e) => setInterviewCode(e.target.value)}
                sx={{ mb: 3, mt: 1 }}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Copy Code">
                      <span>
                        <IconButton
                          onClick={handleCopy}
                          edge="end"
                          disabled={!interviewCode}
                          aria-label="Copy interview code"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={handleJoin}
                disabled={!interviewCode}
                sx={{ mb: 2 }}
              >
                Join Interview
              </Button>
              {copySuccess && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Interview code copied to clipboard!
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Create Interview Card */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={8}
              sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: theme.palette.background.paper,
                minHeight: 320,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Create Interview
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                Click below to generate a new interview room and code.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                onClick={handleCreate}
              >
                Create Interview
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Error Snackbar */}
        <Snackbar
          open={showError}
          autoHideDuration={2000}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={() => setShowError(false)}
        >
          <Alert severity="error" sx={{ width: '100%' }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Home;
