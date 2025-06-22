import React, { useState } from 'react';
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
    useTheme,
    useMediaQuery,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Navbar from './Navbar';

const Home = () => {
    const [interviewCode, setInterviewCode] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

    const handleJoin = () => {
        // Handle joining logic here
        console.log('Joining with code:', interviewCode);
    };

    const handleCopy = () => {
        if (!interviewCode) return;
        navigator.clipboard.writeText(interviewCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1500);
    };

    const handleCreate = () => {
        // Handle create logic (e.g., generate a new room)
        const newCode = crypto.randomUUID().slice(0, 8); // Just an example
        setInterviewCode(newCode);
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
            </Box>
        </>
    );
};

export default Home;
