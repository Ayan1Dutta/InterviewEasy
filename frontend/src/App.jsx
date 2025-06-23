import { useState, useContext } from 'react';
import { useEffect } from 'react'
import Login from './components/Login';
import Signup from './components/SignUp';
import Home from './components/Home';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext } from './contexts/user.context';
import Interview from './components/Interview';
import { SocketContext } from "./contexts/socket.context"

const App = () => {
  const { authUser } = useContext(AuthContext);
  const {socket} = useContext(SocketContext)

   useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Connected to server with id:', socket?.id);
      });
    }
  }, [socket]);

  return (
    <div>
      <Routes>
        <Route path='/' exact element={authUser ? <Home /> : <Navigate to={"/login"} />} />
        <Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
        <Route path='/signup' element={authUser ? <Navigate to='/' /> : <Signup />} />
        <Route path='/interview/sessions/:code' element={authUser ? <Interview /> : <Navigate to={"/login"} />} />
        <Route path='*' element={<Navigate to={"/login"} />} />
      </Routes>
    </div>
  )
}

export default App