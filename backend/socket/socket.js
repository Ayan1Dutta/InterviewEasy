import { Server } from "socket.io";
import CodeSnippet from "../models/code.model.js";

// In-memory tracking of the current active language per room (not persisted)
const roomCurrentLanguage = new Map();
import Session from "../models/session.model.js";
import User from "../models/user.model.js";

let io;
const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173", // Your frontend URL
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

    const BOILERPLATES = {
            javascript: `// JavaScript Boilerplate\nfunction greet(name){\n  return 'Hello, ' + name;\n}\nconsole.log(greet('World'));\n`,
            java: `// Java Boilerplate\nimport java.util.*;\npublic class Main {\n  public static void main(String[] args){\n    System.out.println("Hello, World");\n  }\n}\n`,
            cpp: `// C++ Boilerplate\n#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  cout << "Hello, World" << endl;\n  return 0;\n}\n`
        };

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            if (socket.user) {
                const { roomId, email } = socket.user;
                socket.to(roomId).emit('user-left', { email });
                console.log(`User ${email} implicitly left room ${roomId} due to disconnect.`);
            }
        });

        const attachUserToSocket = (roomId, email) => {
            socket.user = { roomId, email };
        };

        // =================================================================
        // Collaboration & Room Setup (with Error Handling)
        // =================================================================

    socket.on('join-room', async (roomId) => {
            try { // BUG FIX: Added try...catch
                socket.join(roomId);
                console.log(`Socket ${socket.id} joined room ${roomId}`);
                const session = await Session.findOne({ sessionCode: roomId });

                if (!session) {
                    const currentLanguage = roomCurrentLanguage.get(roomId) || 'javascript';
                    socket.emit('init-code', { code: { javascript: '', java: '', cpp: '' }, currentLanguage });
                    return;
                }
                let codeDoc = await CodeSnippet.findOne({ sessionId: session._id });
                if (!codeDoc) {
                    codeDoc = new CodeSnippet({ sessionId: session._id });
                }
                const needed = ['javascript', 'java', 'cpp'];
                let mutated = false;
                needed.forEach(k => {
                    const existing = codeDoc.code.get(k);
                    if (typeof existing !== 'string' || existing.trim() === '') {
                        codeDoc.code.set(k, BOILERPLATES[k]);
                        mutated = true;
                    }
                });
                if (mutated) await codeDoc.save();
                // Determine current language for this room (default javascript)
                if (!roomCurrentLanguage.get(roomId)) roomCurrentLanguage.set(roomId, 'javascript');
                const currentLanguage = roomCurrentLanguage.get(roomId);
                socket.emit('init-code', { code: codeDoc.code, currentLanguage });
            } catch (error) {
                console.error("Database error in 'join-room':", error);
                socket.emit('error', { message: "Failed to load session data." });
            }
        });

        // Receive a delta for a specific language and forward with language context
        socket.on('send-delta', ({ roomId, delta, language }) => {
            if (!roomId || !delta) return;
            socket.to(roomId).emit('remote-delta', { delta, language });
        });

        // Receive a batch of deltas (array of changes) and broadcast maintaining provided order
        socket.on('send-delta-batch', ({ roomId, language, changes }) => {
            if (!roomId || !language || !Array.isArray(changes) || changes.length === 0) return;
            socket.to(roomId).emit('remote-delta-batch', { language, changes });
        });

        // Full content sync (source of truth) to correct divergence
        socket.on('send-full-code', ({ roomId, language, content, version }) => {
            if (!roomId || !language || typeof content !== 'string') return;
            socket.to(roomId).emit('remote-full-code', { language, content, version });
        });

        socket.on('persistCodeToDB', async ({ roomId, language, content }) => {
            if (!roomId || !language || typeof content !== 'string') return;
            try { // BUG FIX: Added try...catch
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
            } catch (error) {
                console.error("Database error in 'persistCodeToDB':", error);
                socket.emit('error', { message: "Failed to save code." });
            }
        });

        // Persist a full map of codes (used for initial sync if needed)
        socket.on('persistFullCodes', async ({ roomId, codes }) => {
            if (!roomId || !codes || typeof codes !== 'object') return;
            try {
                const session = await Session.findOne({ sessionCode: roomId });
                if (!session) return;
                const sessionId = session._id;
                let codeDoc = await CodeSnippet.findOne({ sessionId });
                if (!codeDoc) codeDoc = new CodeSnippet({ sessionId });
                Object.entries(codes).forEach(([lang, text]) => {
                    if (typeof text === 'string') codeDoc.code.set(lang, text);
                });
                codeDoc.lastUpdated = new Date();
                await codeDoc.save();
            } catch (error) {
                console.error("Database error in 'persistFullCodes':", error);
                socket.emit('error', { message: "Failed to save full code set." });
            }
        });

        socket.on('change-language', ({ roomId, CodeLanguage }) => {
            if (!roomId || !CodeLanguage) return;
            roomCurrentLanguage.set(roomId, CodeLanguage);
            socket.to(roomId).emit('remote-change-language', CodeLanguage);
        });

    // (force-language-js removed; new users adopt existing room language via init-code payload)

        socket.on('sendContentUpdate', ({ roomId, content }) => {
            socket.to(roomId).emit('receiveContentUpdate', content);
        });

        // =================================================================
        // Interview Flow & User Management (with Error Handling)
        // =================================================================

        const handleUserJoin = async (roomId, userPayload) => {
            if (!userPayload || !userPayload.email) return;

            try { // BUG FIX: Added try...catch
                attachUserToSocket(roomId, userPayload.email);
                const user = await User.findOne({ email: userPayload.email });
                if (!user) {
                    console.error(`User with email ${userPayload.email} not found`);
                    return;
                }
                io.in(roomId).emit('user-joined', { user });
            } catch (error) {
                console.error("Database error in 'handleUserJoin':", error);
                socket.emit('error', { message: "Failed to process user joining." });
            }
        };

        socket.on('host-joined', ({ roomId, user }) => {
            handleUserJoin(roomId, user);
        });

        socket.on('user-joined', ({ roomId, user }) => {
            handleUserJoin(roomId, user);
        });

        // This logic is correct: notify others first, then leave.
        socket.on('user-left', ({ roomId, email }) => {
            socket.to(roomId).emit('user-left', { email });
            socket.leave(roomId);
            const room = io.sockets.adapter.rooms.get(roomId);
            if (!room || room.size === 0) {
                roomCurrentLanguage.delete(roomId);
            }
        });

        socket.on('end-interview', ({ roomId }) => {
            io.in(roomId).emit('interview-ended', { message: 'The interview has been ended by the host' });
            io.in(roomId).socketsLeave(roomId);
            roomCurrentLanguage.delete(roomId);
        });

        socket.on('sync-start-time', ({ roomId, newStartTime }) => {
            io.in(roomId).emit('sync-start-time', { newStartTime });
        });

        socket.on('send-notes-update', ({ roomId, content }) => {
            socket.to(roomId).emit('receive-notes-update', { content });
        });

        // =================================================================
        // WebRTC & Other Relays (No changes needed here)
        // =================================================================
        socket.on('user-ready', ({ roomId, email }) => {
            socket.to(roomId).emit('user-ready', { email });
        });
        socket.on('offer', ({ roomId, offer }) => {
            socket.to(roomId).emit('offer', { offer });
        });
        socket.on('fullscreen-change', ({ roomId, message }) => {
            socket.to(roomId).emit('fullscreen-warning', { message });
        });
        socket.on('answer', ({ roomId, answer }) => {
            socket.to(roomId).emit('answer', { answer });
        });
        socket.on('ice-candidate', ({ roomId, candidate }) => {
            socket.to(roomId).emit('ice-candidate', { candidate });
        });
        socket.on('code-output', ({ roomId, output }) => {
            socket.to(roomId).emit('code-output', { output });
        });
        socket.on('user-refreshed', ({ roomId, email }) => {
            socket.to(roomId).emit('user-refreshed', { email });
        });

    });
};

const getSocketInstance = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized. Call initializeSocket first.");
    }
    return io;
};

export { initializeSocket, getSocketInstance };