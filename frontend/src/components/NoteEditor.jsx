import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import JoditEditor from 'jodit-react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { SocketContext } from '../contexts/socket.context';
import "../assets/jodit.css"

const CollaborativeEditorPopup = ({ open, toggleOpen, roomId, initialNotes }) => {
  const { socket } = useContext(SocketContext);
  const editorRef = useRef(null);
  const [content, setContent] = useState(initialNotes || '');
  const contentRef = useRef(content);
  const debounceTimer = useRef(null);

  // Prevent re-creating config object on every render
  const editorConfig = useMemo(() => ({
    readonly: false,
    height: 400,
    theme: 'dark',
    toolbarSticky: false,
    statusbar: false,          
    showCharsCounter: false,   
    showWordsCounter: false,  
    showXPathInStatusbar: false, 
    toolbar: {
      items: [
        'bold'
      ],
    },
  }), []);


  // Receive updates
  useEffect(() => {
    if (!socket) return;
    const handleReceive = (newContent) => {
      if (typeof newContent !== 'string') return;
      // Avoid echo if same
      if (newContent === contentRef.current) return;
      contentRef.current = newContent;
      setContent(newContent);
    };
    socket.on('receiveContentUpdate', handleReceive);
    return () => socket.off('receiveContentUpdate', handleReceive);
  }, [socket]);

  // Emit changes
  const handleEditorChange = (newContent) => {
    setContent(newContent);
    contentRef.current = newContent;
    if (socket) {
      socket.emit('sendContentUpdate', { roomId, content: newContent });
    }
    // Debounced persistence to backend only (no localStorage)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        await fetch(`${import.meta.env.MODE === 'development' ? 'http://localhost:3000/api' : '/api'}/interview/sessions/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionCode: roomId, notes: contentRef.current })
        });
      } catch (e) {
        console.error('Failed to persist notes', e);
      }
    }, 1500);
  };

  return (
    <Dialog open={open} onClose={toggleOpen}>
      <DialogContent>
  <JoditEditor ref={editorRef} value={content} config={editorConfig} onChange={handleEditorChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={toggleOpen} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CollaborativeEditorPopup;
