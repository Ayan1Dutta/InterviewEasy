import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoute from './routes/auth.route.js';
import { connectToDatabase } from './utilities/db.utils.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import sessionRoute from './routes/session.routes.js';
import { initializeSocket } from './socket/socket.js';



const app = express();
export const PORT = process.env.PORT || 3000;

dotenv.config();

// Allow multiple origins (comma separated) for local + deployed frontend
const rawOrigins = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // allow non-browser / curl
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS: Origin not allowed: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: 'Content-Type,Authorization',
    optionsSuccessStatus: 204
}));

// Behind Render's proxy to ensure secure cookies work when using HTTPS
app.set('trust proxy', 1);

const server = createServer(app);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/interview" , sessionRoute);


initializeSocket(server);
// console.log(process.env.MONGO_URI);
//connect to maongoDB
connectToDatabase();
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Allowed Origins:', allowedOrigins.join(', '));
});

export default app;