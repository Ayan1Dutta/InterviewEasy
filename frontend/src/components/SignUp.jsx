import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Link,
  InputAdornment,
  IconButton,
  createTheme,
  FormControl,
  InputLabel,
  OutlinedInput,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useContext } from 'react';
import { AuthContext } from '../contexts/user.context';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [Name, setName] = useState('');
  const [Email, setEmail] = useState('');
  const [Password, setPassword] = useState('');
  const [Error, setError] = useState('');
  const { authUser, setAuthUser } = useContext(AuthContext)
  const navigate = useNavigate();
  useEffect(() => {
    if (Error) {
      const timer = setTimeout(() => setError(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [Error]);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };
  const handleLoginClick=(e)=>{
    e.preventDefault();
    navigate("/login");
  }

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        'http://localhost:3000/api/auth/signup',
        {
          name: Name,
          email: Email,
          password: Password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true, // useful if using HTTP-only cookies
        }
      );
      const {email,authToken} = res?.data;
      // Optional: If your backend returns { error: "something" }
      if (data.error) {
        throw new Error(data.error);
      }
      // Store token in localStorage if not using httpOnly cookies
      localStorage.setItem("CodeSync_token", JSON.stringify({email,authToken}));
      // Set user in global state (via context)
      setAuthUser(data);
      // Navigate to homepage (or dashboard)
      navigate("/");

    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || 'Unexpected error occurred');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1f1f2e, #3a3a5c)',
        padding: 2,
      }}
    >
      {Error && (
        <Alert variant="filled" severity="error" sx={{ mb: 2, position: 'absolute', top: 30, width: '40%' }}>
          {Error}
        </Alert>
      )}
      <Paper
        elevation={10}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <LockOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ mt: 1 }}>
            Create Account
          </Typography>
        </Box>

        <Box component="form" noValidate>
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={Name}
            required
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            label="Email Address"
            variant="outlined"
            fullWidth
            margin="normal"
            type="email"
            autoComplete="email"
            value={Email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <FormControl variant="outlined" fullWidth margin="normal">
            <InputLabel htmlFor="signup-password">Password</InputLabel>
            <OutlinedInput
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              required
              value={Password}
              onChange={(e) => setPassword(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}
            onClick={handleSubmit}
          >
            Sign Up
          </Button>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mt: 2,
              fontSize: '0.9rem',
            }}
          >
            <Link underline="hover" color="primary.light" onClick={handleLoginClick} sx={{cursor:"pointer"}}>
              Already have an account? Login
            </Link>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;
