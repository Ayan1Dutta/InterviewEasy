import { Server } from "socket.io";
let io;
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173", // Set to your frontend URL
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        },
    })

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        // socket.on("join-session",);
        socket.on('diconnect', () => {
            console.log('Client disconnected:', socket.id);
        })
    })
};

const getSocketInstance = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized. Call initializeSocket first.");
    }
    return io;
};

export { initializeSocket, getSocketInstance };