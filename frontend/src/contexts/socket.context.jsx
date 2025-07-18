import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./user.context"; // Your user context

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { authUser } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // This entire block of code will now ONLY run when `authUser` changes.
        // It will NOT run when the CodeEditor component re-renders from a language change.

        if (authUser) {
            // 1. A user is logged in: create the connection.
            const newSocket = io('http://localhost:3000', {
                transports: ['websocket'],
            });

            setSocket(newSocket);

            // 2. The cleanup function: This runs ONLY when the user logs out.
            //    React cleans up the old effect before running it again.
            return () => {
                newSocket.close();
            };
        } else {
            // 3. No user is logged in: ensure any existing socket is closed.
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser]); // <-- The ONLY dependency is `authUser`. This is the most important part.

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};