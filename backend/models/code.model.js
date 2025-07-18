import mongoose from "mongoose";

const CodeSnippetSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  code: {
    type: Map,
    of: String,
    default: { javascript: '', java: '', cpp: '' }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const CodeSnippet = mongoose.model('CodeSnippet', CodeSnippetSchema);
export default CodeSnippet;