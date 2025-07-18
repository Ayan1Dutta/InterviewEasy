import { Server } from "socket.io";
import CodeSnippet from "../models/code.model.js";
import Session from "../models/session.model.js";
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

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        })

        socket.on('join-room', async (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
            const session = await Session.findOne({ sessionCode: roomId });

            if (!session) {
                socket.emit('init-code', { code: { javascript: '', java: '', cpp: '' } });
                return;
            }
            const codeDoc = await CodeSnippet.findOne({ sessionId: session._id });
            if (codeDoc) {
                socket.emit('init-code', { code: codeDoc.code });
            }
        });

        socket.on('send-delta', ({ roomId, delta }) => {
            socket.to(roomId).emit('remote-delta', delta);
        });
        socket.on('persistCodeToDB', async ({ roomId, language, content }) => {
            if (!roomId || !language || typeof content !== 'string') {
                console.log('Bad payload:', { roomId, language, content });
                return;
            }
            // console.log(language,content);
            const session = await Session.findOne({ sessionCode: roomId });
            if (!session) return;
            const sessionId = session._id;

            let codeDoc = await CodeSnippet.findOne({ sessionId });
            if (!codeDoc) {
                codeDoc = new CodeSnippet({ sessionId });
            }
            codeDoc.code.set(language, content);
            codeDoc.lastUpdated = new Date();
            await codeDoc.save();
            // console.log(`Code updated for ${language} in database`);
        });

        socket.on('change-language', ({ roomId, CodeLanguage }) => {
            socket.to(roomId).emit('remote-change-language', CodeLanguage);
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