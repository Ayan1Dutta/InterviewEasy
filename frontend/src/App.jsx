import { useState,useContext } from 'react';
import { useEffect } from 'react'
import {io} from 'socket.io-client'
import Login from './components/Login';
import Signup from './components/SignUp';
import Home from './components/Home';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthContext } from './contexts/user.context';


const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  withCredentials: true,
});



const App = () => {
  const {authUser} =useContext(AuthContext);
  useEffect(()=>{
    socket.on('connect',()=>{
      console.log('Connected to server with id:', socket.id);
    })
  },[])
  
  return (
     <div>
			<Routes>
				<Route path='/' element={authUser ? <Home /> : <Navigate to={"/login"} />} />
				<Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
				<Route path='/signup' element={authUser ? <Navigate to='/' /> : <Signup />} />
				{/* <Route path='/interview/sessions/:code' element={authUser ? <Interview /> : <Navigate to={"/login"} />} /> */}
				<Route path='*' element={<Navigate to={"/login"} />} />
			</Routes>
		</div>
  )
}

export default App