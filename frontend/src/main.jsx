// src/main.js or src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { BrowserRouter } from 'react-router-dom'
import { AuthContextProvider } from './contexts/user.context';
import { SocketProvider } from './contexts/socket.context';

const root = ReactDOM.createRoot(document.getElementById('root'));

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#1e1e2f',
            paper: '#2c2c3a',
        }
    }
})

root.render(
    <AuthContextProvider>
        <SocketProvider>
            <BrowserRouter>
                <ThemeProvider theme={darkTheme}>
                    <CssBaseline />
                    <App />
                </ThemeProvider>
            </BrowserRouter>
        </SocketProvider>
    </AuthContextProvider>

);
