import { useState } from 'react';
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
import axios from 'axios'
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useEffect } from 'react';
import { AuthContext } from '../contexts/user.context';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1a1a2e',
      paper: '#2e2e48',
    },
    primary: {
      main: '#6ec6ff',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [Email, setEmail] = useState("")
  const [Password, setPassword] = useState("")
  const [Error, setError] = useState("")
  const { authUser, setAuthUser } = useContext(AuthContext)

  useEffect(() => {
    if (Error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 2000);
      return () => {
        clearTimeout(timer);
      }
    }
  }, [Error]);

  const navigate = useNavigate();
  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };
  const handleClickToSignUp = (e) => {
    e.preventDefault();
    navigate("/signup")
  }
  const handleSubmit = async (e) => {
    try {
      const res = await axios.post(
        'http://localhost:3000/api/auth/login',
        {
          email: Email,
          password: Password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      const data = res.data;

      // Save token (if using localStorage)
      localStorage.setItem(
        "CodeSync_token",
        JSON.stringify({ token: data.authToken, email: data.email })
      );

      setAuthUser(data);
      navigate("/");

    } catch (err) {
      console.error("Login Error:", err);
      if (err.response) {
        // Backend responded with error (e.g. 400, 401, 500)
        setError(err.response.data.message || "Something went wrong");
      } else if (err.request) {
        // No response from server (server might be down)
        setError("No response from server. Please try again later.");
      } else {
        // Error setting up request
        setError(err.message || "Unexpected error occurred");
      }
    }
  };


  return (
    <>
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
        {Error && <Alert variant="filled" severity="error" sx={{ marginBottom: 2, position: 'absolute', top: 30, width: '40%' }}>
          {Error}
        </Alert>}
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
              Welcome Back
            </Typography>
          </Box>

          <Box component="form" noValidate>
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              margin="normal"
              type="email"
              autoComplete="email"
              value={Email}
              required
              placeholder='Enter your email'
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
            />


            <FormControl variant="outlined" fullWidth margin="normal">
              <InputLabel htmlFor="password">Password</InputLabel>
              <OutlinedInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                required
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
              Log In
            </Button>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 2,
                fontSize: '0.9rem',
              }}
            >
              <Link href="#" underline="hover" color="primary.light">
                Forgot password?
              </Link>
              <Link underline="hover" color="primary.light" onClick={handleClickToSignUp} sx={{ cursor: 'pointer' }}>
                Sign up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
};
export default Login;
