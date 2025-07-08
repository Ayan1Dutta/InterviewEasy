import React, { useState, useEffect, useRef, useMemo, useContext } from 'react';
import JoditEditor from 'jodit-react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { SocketContext } from '../contexts/socket.context';
import "../assets/jodit.css"

const CollaborativeEditorPopup = ({ open, toggleOpen, roomId }) => {
  const { socket } = useContext(SocketContext);
  const editorRef = useRef(null);
  const [content, setContent] = useState('');

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
    if (socket) {
      socket.on('receiveContentUpdate', (newContent) => {
        setContent(newContent);
      });

      return () => {
        socket.off('receiveContentUpdate');
      };
    }
  }, [socket, roomId]);

  // Emit changes
  const handleEditorChange = (newContent) => {
    setContent(newContent);
    if (socket) {
      socket.emit('sendContentUpdate', { roomId, content: newContent });
    }
  };

  return (
    <Dialog open={open} onClose={toggleOpen}>
      <DialogContent>
        <JoditEditor
          ref={editorRef}
          value={content}
          config={editorConfig}
          onChange={handleEditorChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={toggleOpen} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CollaborativeEditorPopup;
