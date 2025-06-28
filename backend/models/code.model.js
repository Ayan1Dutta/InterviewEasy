import mongoose from "mongoose";

const CodeSnippetSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session', // Reference to the Sessions collection
    required: true
  },
  code: {
    type: Object,
    required: true
     // Initialize with an empty code snippet
  },
  language: {
    type: String,
    default: 'javascript', // Default language is JavaScript
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now // Timestamp for the last update
  }
});

const CodeSnippet = mongoose.model('CodeSnippet', CodeSnippetSchema);
export default CodeSnippet;