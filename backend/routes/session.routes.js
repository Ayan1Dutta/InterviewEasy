import express from 'express';
import { createSession, endInterview, joinSession,GetInterviewInfo } from '../controllers/session.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/sessions', protectRoute, createSession);
router.post('/sessions/join', protectRoute, joinSession);
router.post('/sessions/end', protectRoute, endInterview);
router.post('/sessions/interview', protectRoute, GetInterviewInfo);

export default router;