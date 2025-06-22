import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoute from './routes/auth.route.js'
import { connectToDatabase } from './utilities/db.utils.js'
import dotenv from 'dotenv'

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: 'Content-Type,Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204
}
));

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Set to your frontend URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
})
app.use(express.json());

app.use("/api/auth", authRoute);


io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('diconnect', () => {
        console.log('Client disconnected:', socket.id);
    })
})
// console.log(process.env.MONGO_URI);
//connect to maongoDB
connectToDatabase();

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})