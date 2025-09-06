import mongoose from "mongoose";


const SessionSchema = new mongoose.Schema({
  sessionCode: {
    type: String,
    required: true,
    unique: true, // Ensures session code is unique
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the Users collection
    required: true
  },
  participants: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'ended', 'upcoming'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null // Null if the session is still active
  }
  ,
  notes: {
    type: String,
    default: ''
  }
});

const Session = mongoose.model('Session', SessionSchema);
export default Session;
