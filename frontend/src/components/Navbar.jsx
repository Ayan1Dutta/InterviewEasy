// src/components/Navbar.jsx
import React, { useState, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
} from '@mui/material';
import { Person as PersonIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { AuthContext } from '../contexts/user.context';

const Navbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { setAuthUser } = useContext(AuthContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogout = () => {
    // 1. Clear React state
    setAuthUser(null);
    // 2. Remove from localStorage
    localStorage.removeItem('CodeSync_token');
    // 3. Remove the HTTP-only cookie
    Cookies.remove('CodeSyncToken');
    handleMenuClose();
    // 4. Redirect to login
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        position:"absolute"
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          interBee
        </Typography>

        {/* Profile Button */}
        <IconButton
          onClick={handleMenuOpen}
          size="large"
          sx={{ ml: 2 }}
          color="inherit"
        >
          <PersonIcon sx={{ fontSize: 32 }} />
        </IconButton>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            },
          }}
        >
          <MenuItem onClick={handleProfile}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 20, height: 20, mr: 1 }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              Profile
            </Box>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 20, height: 20, mr: 1 }}>
                <LogoutIcon sx={{ fontSize: 16 }} />
              </Avatar>
              Logout
            </Box>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
