import CodeSnippet from "../models/code.model.js";
import Session from "../models/session.model.js";
import { v4 as uuidv4 } from 'uuid';
import { getSocketInstance } from "../socket/socket.js";
import User from "../models/user.model.js";

export const languageBoilerplates = {
    javascript: `// JavaScript Example
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("World"));
`,

    java: `// Java Example
public class Main {
    public static void main(String[] args) {
        System.out.println(greet("World"));
    }

    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}
`,

cpp: `// C++ Example
#include <iostream>
using namespace std;

void greet(const string& name) {
    cout << "Hello, " << name << "!" << endl;
}

int main() {
    greet("World");
    return 0;
}
`
};


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
            code: languageBoilerplates
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


export const joinSession = async (req, res) => {

    const { sessionCode } = req.body;
    try {
        const session = await Session.findOne({ sessionCode });
        if (!session) return res.status(404).json({ message: 'Session not found' });
        const io = getSocketInstance();
        const socketsInRoom = await io.in(sessionCode).fetchSockets();
        if (socketsInRoom.length === 2) {
            return res.status(400).json({ message: 'Session is already full' });
        }
        if (!session.participants.includes(req.user._id)) {
            session.participants.push(req.user.id);
            await session.save();
        }
        res.json({ success: true, session });
    } catch (err) {
        res.status(500).json({ message: "Not Authorized To Enter" });
    }

}

export const endInterview = async (req, res) => {
    const { sessionCode } = req.body;
    try {
        const session = await Session.findOne({ sessionCode });
        if (!session) return res.status(404).json({ message: 'Session not found' });

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

export const GetInterviewInfo = async (req, res) => {
    const { sessionCode } = req.body;
    try {
        const session = await Session.findOne({ sessionCode });
        if (!session)
            return res.status(400).json({ success: false, message: 'Session does not exist' });

        const host_id = session.host;
        const Host = await User.findById(host_id);
        const host_email = Host?.email || null;
        const codeSnippet = await CodeSnippet.findOne({ sessionId: session._id });

        res.json({ host_email, code: codeSnippet });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
        console.error('Error in GetInterviewInfo:', err);
    }
};