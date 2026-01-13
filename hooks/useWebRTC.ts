import { useEffect, useState, useRef, useCallback } from 'react';
import { PeerData, SignalMessage, AvatarConfig, ChatMessage, Reaction } from '../types';
import { useWebRTCSignaling } from './useWebRTCSignaling';

interface UseWebRTCOptions {
  onPeerJoin?: (name: string) => void;
  onMessage?: (msg: ChatMessage) => void;
}

export const useWebRTC = (
  roomId: string, 
  user: { id: string, displayName: string, avatarConfig: AvatarConfig },
  localStream: MediaStream | null,
  options: UseWebRTCOptions = {}
) => {
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerStreams = useRef<Map<string, MediaStream>>(new Map());
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const sendMessageRef = useRef<(msg: SignalMessage) => void>();

  // STUN config for real connectivity
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  // --- Signaling Functions ---

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback((msg: SignalMessage) => {
      console.log('📨 Received signaling message:', msg.type, 'from:', msg.senderId, 'to:', msg.targetId);
      
      if (msg.senderId === user.id) return;
      
      if (msg.type === 'chat') {
          setChatMessages(prev => [...prev, msg.payload]);
          if(options.onMessage) options.onMessage(msg.payload);
          return;
      }
      
      if (msg.type === 'reaction') {
          setReactions(prev => [...prev, msg.payload]);
          setTimeout(() => setReactions(prev => prev.filter(r => r.id !== msg.payload.id)), 3000);
          return;
      }

      if (msg.type === 'join') {
        console.log('👋 User joined:', msg.payload.displayName);
        const newPeer: PeerData = msg.payload;
        
        // Trigger Join Sound/Notification
        if (options.onPeerJoin) options.onPeerJoin(newPeer.displayName);

        setPeers(prev => {
          if (prev.find(p => p.id === newPeer.id)) return prev;
          return [...prev, newPeer];
        });

        console.log('📤 Sending update-state to new peer:', newPeer.id);
        sendMessageRef.current?.({
          type: 'update-state',
          senderId: user.id,
          targetId: newPeer.id,
          payload: { 
              id: user.id, 
              displayName: user.displayName, 
              avatarConfig: user.avatarConfig, 
              isMuted: false, 
              isCameraOff: false,
              isScreenSharing: !!screenTrackRef.current 
          }
        });

        createPeerConnection(newPeer.id, true);
      }

      if (msg.type === 'update-state') {
          if (msg.targetId && msg.targetId !== user.id) return;

          const peerInfo: Partial<PeerData> = msg.payload;
          console.log('🔄 Received update-state for peer:', peerInfo.id, peerInfo);
          
          setPeers(prev => {
             const idx = prev.findIndex(p => p.id === peerInfo.id);
             if (idx >= 0) {
                 const updated = [...prev];
                 updated[idx] = { ...updated[idx], ...peerInfo, stream: peerStreams.current.get(peerInfo.id!) };
                 console.log('✅ Updated peer info for:', peerInfo.id, 'has stream:', !!peerStreams.current.get(peerInfo.id!));
                 return updated;
             }
             return [...prev, peerInfo as PeerData];
          });
      }

      if (msg.type === 'leave') {
        setPeers(prev => prev.filter(p => p.id !== msg.senderId));
        peerConnections.current.get(msg.senderId)?.close();
        peerConnections.current.delete(msg.senderId);
        peerStreams.current.delete(msg.senderId);
      }

      if (msg.targetId === user.id) {
        const pc = peerConnections.current.get(msg.senderId) || createPeerConnection(msg.senderId, false);

        if (msg.type === 'offer' && pc) {
          pc.setRemoteDescription(new RTCSessionDescription(msg.payload))
            .then(() => pc.createAnswer())
            .then(answer => pc.setLocalDescription(answer))
            .then(() => {
              const localDesc = pc.localDescription;
              if (localDesc) {
                sendMessageRef.current?.({
                  type: 'answer',
                  senderId: user.id,
                  targetId: msg.senderId,
                  payload: localDesc
                });
              }
            })
            .catch(error => {
              console.error('Error handling offer:', error);
            });
        } else if (msg.type === 'answer' && pc) {
          pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        } else if (msg.type === 'ice-candidate' && pc) {
          pc.addIceCandidate(new RTCIceCandidate(msg.payload));
        }
      }
  }, [user.id, options]);

  const { isConnected, sendMessage } = useWebRTCSignaling({ 
    roomId, 
    userId: user.id,
    onMessage: handleSignalingMessage 
  });

  // Update the sendMessage ref
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const sendChat = (text: string) => {
      const msg: ChatMessage = {
          id: Math.random().toString(36),
          senderId: user.id,
          senderName: user.displayName,
          text,
          timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, msg]);
      sendMessage({ type: 'chat', senderId: user.id, payload: msg });
  };

  const sendReaction = (emoji: string) => {
      const reaction: Reaction = {
          id: Math.random().toString(36),
          senderId: user.id,
          emoji,
          timestamp: Date.now()
      };
      setReactions(prev => [...prev, reaction]);
      setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reaction.id)), 3000);
      sendMessage({ type: 'reaction', senderId: user.id, payload: reaction });
  };

  const createPeerConnection = useCallback((targetPeerId: string, initiator: boolean) => {
    if (peerConnections.current.has(targetPeerId)) return peerConnections.current.get(targetPeerId);

    console.log('🔗 Creating peer connection:', targetPeerId, 'initiator:', initiator);
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current.set(targetPeerId, pc);

    // Add connection state logging
    pc.onconnectionstatechange = () => {
      console.log('🔗 Connection state for', targetPeerId, ':', pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state for', targetPeerId, ':', pc.iceConnectionState);
    };

    // Add Tracks (Avatar Stream by default)
    if (localStream) {
      console.log('🎥 Adding local tracks to peer connection:', localStream.getTracks().length);
      localStream.getTracks().forEach(track => {
        console.log('📡 Adding track:', track.kind, track.label);
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ice-candidate',
          senderId: user.id,
          targetId: targetPeerId,
          payload: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('🎥 Received track from peer:', event.track.kind, event.streams.length);
      const stream = event.streams[0];
      if (stream) {
        peerStreams.current.set(targetPeerId, stream);
        
        setPeers(prev => prev.map(p => 
          p.id === targetPeerId ? { ...p, stream } : p
        ));
      }
    };

    if (initiator) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer);
      }).then(() => {
        sendMessage({
          type: 'offer',
          senderId: user.id,
          targetId: targetPeerId,
          payload: pc.localDescription
        });
      });
    }

    return pc;
  }, [localStream, user.id, sendMessage]);

  // --- Screen Share Logic ---

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      // Handle user clicking "Stop Sharing" in browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // Replace tracks for all peers
      peerConnections.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      // Signal update
      sendMessage({
        type: 'update-state',
        senderId: user.id,
        payload: { id: user.id, isScreenSharing: true }
      });
      
      return displayStream;

    } catch (err) {
      console.error("Screen share failed", err);
      return null;
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    // Revert to Avatar Track
    if (localStream) {
        const avatarTrack = localStream.getVideoTracks()[0];
        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender && avatarTrack) {
            videoSender.replaceTrack(avatarTrack);
          }
        });
    }

    // Signal update
    sendMessage({
        type: 'update-state',
        senderId: user.id,
        payload: { id: user.id, isScreenSharing: false }
    });
  };

  // --- Main Effect ---

  useEffect(() => {
    if (!isConnected) return;

    // Send join message when connected
    sendMessage({
      type: 'join',
      senderId: user.id,
      payload: { 
          id: user.id, 
          displayName: user.displayName, 
          avatarConfig: user.avatarConfig, 
          isMuted: false, 
          isCameraOff: false,
          isScreenSharing: false 
      }
    });

    return () => {
      sendMessage({ type: 'leave', senderId: user.id });
      peerConnections.current.forEach(pc => pc.close());
    };
  }, [isConnected, user.id, sendMessage]);

  // Handle local stream updates (Avatar only)
  useEffect(() => {
    if (localStream && !screenTrackRef.current) {
      console.log('🔄 Updating local stream for all peers:', localStream.getTracks().length);
      peerConnections.current.forEach((pc, peerId) => {
        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
            const sender = senders.find(s => s.track?.kind === track.kind);
            if (sender) {
                console.log('🔄 Replacing track for peer:', peerId, track.kind);
                sender.replaceTrack(track);
            } else {
                console.log('➕ Adding new track for peer:', peerId, track.kind);
                pc.addTrack(track, localStream);
            }
        });
        
        // Force renegotiation to ensure stream is sent
        if (pc.signalingState === 'stable') {
          console.log('🔄 Creating offer to send updated stream to:', peerId);
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              sendMessageRef.current?.({
                type: 'offer',
                senderId: user.id,
                targetId: peerId,
                payload: pc.localDescription
              });
            })
            .catch(error => {
              console.error('Error creating offer for stream update:', error);
            });
        }
      });
    }
  }, [localStream]);

  return { peers, chatMessages, reactions, sendChat, sendReaction, startScreenShare, stopScreenShare };
};