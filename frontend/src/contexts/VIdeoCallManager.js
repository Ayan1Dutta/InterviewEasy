import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SocketContext } from '../contexts/socket.context';

export const useVideoCall = ({ roomId, host, videoRef, remoteVideoRef, mediaStreamRef }) => {
  const { socket } = useContext(SocketContext);
  const peerConnection = useRef(null);

  // Simplified State
  const [readyToCall, setReadyToCall] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [isCallConnected, setIsCallConnected] = useState(false);

  /**
   * This function now cleanly shuts down everything.
   * It stops camera/mic tracks, closes the WebRTC connection, and resets state.
   */
  // full = true when user themselves leaves/end session; false when only remote peer left
  const closeConnection = useCallback((full = true) => {
    if (peerConnection.current) {
      try { peerConnection.current.close(); } catch { /* ignore */ }
      peerConnection.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setOtherUser(null);
    setIsCallConnected(false);
    if (full) {
      // Stop local media only on full teardown
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setReadyToCall(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }, [remoteVideoRef, mediaStreamRef, videoRef]);

  /**
   * Starts the user's local media stream. Called once when the component mounts.
   */
  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      // THIS IS THE FIX:
      // Alert the user about the specific problem so they can fix it.
      alert(
        "Permission for camera and microphone was denied. Please allow access in your browser's settings to continue."
      );
      console.error('Failed to access media devices:', err);
    }
  }, [mediaStreamRef, videoRef]);

  /**
   * Sets up the peer connection and its event listeners.
   */
  const setupPeerConnection = useCallback(() => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Listener to track when the call is fully connected or disconnected
    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      if (state === 'connected') {
        setIsCallConnected(true);
      } else if (['disconnected', 'failed', 'closed'].includes(state)) {
        setIsCallConnected(false);
      }
    };

    // Add local tracks to be sent to the other peer
    mediaStreamRef.current?.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, mediaStreamRef.current);
    });

    // Listener for when the remote user's stream arrives
    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Listener for sending network candidates to the other peer
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };
  }, [mediaStreamRef, remoteVideoRef, roomId, socket]);
  
  const startPeerConnection = useCallback(async () => {
    setupPeerConnection();
    if (host) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit('offer', { roomId, offer });
    }
  }, [host, roomId, socket, setupPeerConnection]);
  
  // Effect to start the connection process once both users are ready
  useEffect(() => {
    if (readyToCall && otherUser && host && !peerConnection.current) {
      startPeerConnection();
    }
  }, [readyToCall, otherUser, host, startPeerConnection]);
  
  const handleReadyToCall = async (email) => {
    // Reacquire stream if it was previously stopped
    if (!mediaStreamRef.current) {
      await startStream();
    }
    setReadyToCall(true);
    socket.emit('user-ready', { roomId, email });
  };

  
  // Main signaling effect to handle offers, answers, and candidates
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer }) => {
      if (!host && !peerConnection.current) {
        setupPeerConnection();
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.emit('answer', { roomId, answer });
      }
    };

    const handleAnswer = async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleCandidate = async ({ candidate }) => {
      await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
    };
    const handleUserReady = ({ email }) => setOtherUser(email);
    // When the other user leaves, we must clean up the connection
    const handleUserLeft = () => {
      // Full reset so both parties must explicitly re-initiate call
      closeConnection(true);
      setReadyToCall(false);
      setOtherUser(null);
      setIsCallConnected(false);
    };

    socket.on('user-ready', handleUserReady);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-ready');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('user-left');
    };
  }, [socket, roomId, host, setupPeerConnection, closeConnection]);

  // Return the simplified set of functions and state
  return {
    startStream,
    handleReadyToCall,
  closeConnection,
    readyToCall,
    otherUser,
    isCallConnected,
  };
};