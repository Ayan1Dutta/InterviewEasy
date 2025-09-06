import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoute from './routes/auth.route.js'
import { connectToDatabase } from './utilities/db.utils.js'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import sessionRoute from './routes/session.routes.js'
import { initializeSocket } from './socket/socket.js'
import path from 'path'

const __dirname = path.resolve();


const app = express();
export const PORT = process.env.PORT || 3000;

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

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/interview", sessionRoute);


if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "..", "frontend", "dist");
  app.use(express.static(buildPath));

  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

initializeSocket(server);
// console.log(process.env.MONGO_URI);
//connect to maongoDB
connectToDatabase();
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})