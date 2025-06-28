import CodeSnippet from "../models/code.model.js";
import Session from "../models/session.model.js";
import { v4 as uuidv4 } from 'uuid';

export const createSession = async (req, res) => {
    try {
        const hostId = req.user._id;
        console.log(hostId)
        const currSessionCode = uuidv4().slice(0, 8);
        const newInterview = new Session({
            sessionCode: currSessionCode,
            host: hostId,
            participants: [hostId],
        });

        await newInterview.save();

        const newCodeSnippet = new CodeSnippet({
            sessionId: newInterview._id,
            code: { default: "start writing" },
            language: "javascript",
        });

        await newCodeSnippet.save();

        res.status(201).json({
            success: true,
            code: currSessionCode,
            message: 'Interview session created successfully!',
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Server error', error });
    }
};


export const joinSession = async(req , res) => {
  
    const { sessionCode } = req.body;
    try {
        const session = await Session.findOne({ sessionCode });
        if (!session) return res.status(404).json({ error: 'Session not found' });
        const io = getSocketInstance();

        const socketsInRoom = await io.in(sessionCode).fetchSockets();

         if(socketsInRoom.length === 2) {
            return res.status(400).json({ error: 'Session is already full' });
        }
        if (!session.participants.includes(req.user._id)) {
            session.participants.push(req.user.id);
            await session.save();
        }

        res.json({ success: true, session });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }

}

export const endInterview = async(req , res) => {
    const { sessionCode } = req.body;
    try {
        const session = await Session.findOne({ sessionCode });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        // Remove the session
        await Session.deleteOne({ sessionCode });
        const result = await CodeSnippet.deleteOne({
      sessionId: session._id,
    });
        res.json({ success: true, message: 'Session ended successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
        console.error('Error ending session:', err);
    }
}