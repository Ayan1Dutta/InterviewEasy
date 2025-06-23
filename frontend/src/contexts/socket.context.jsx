import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./user.context";


export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const {authUser}=useContext(AuthContext)

	// const baseURL = import.meta.env.MODE === "development" ? 'http://localhost:5000' : "/";

	useEffect(() => {
		if (authUser) {
			const socket = io('http://localhost:3000', {
				transports: ['websocket'],
				withCredentials: true,
			});
			setSocket(socket);
			return () => socket.close();
		} else {
			if (socket) {
				setSocket(null);
				return () => socket.close();
			}
		}
	}, [authUser]);

	return (
		<SocketContext.Provider value={{ socket }}>
			{children}
		</SocketContext.Provider>
	);
};

