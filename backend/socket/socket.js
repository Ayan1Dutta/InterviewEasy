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
        socket.on('diconnect', () => {
            console.log('Client disconnected:', socket.id);
        })
        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);

            // if (roomContents[roomId]) {
            //     socket.emit('init', roomContents[roomId]);
            // }
        });
        socket.on('send-delta', ({ roomId, delta }) => {
            // Save last content (optional)
            // roomContents[roomId] = delta.fullContent || roomContents[roomId];
            // Broadcast only to others in the same room
            socket.to(roomId).emit('remote-delta', delta);
        });
        socket.on('change-language',({roomId,CodeLanguage})=>{
            socket.to(roomId).emit('remote-change-language', CodeLanguage);
        })
        socket.on('sendContentUpdate',({roomId,content})=>{
            socket.to(roomId).emit('receiveContentUpdate', content);
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