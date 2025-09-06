import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./user.context";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { authUser } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!authUser) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

  const SOCKET_BASE = import.meta.env.MODE === 'development' ? 'http://localhost:3000' : '';
  const newSocket = io(SOCKET_BASE, {
      transports: ["websocket"],
      withCredentials: true,
    });
    setSocket(newSocket);
    newSocket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });
    return () => {
      newSocket.close();
    };
  }, [authUser]); // do not include socket in deps

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};