import { useEffect, useState, useRef, useCallback } from 'react';
import { PeerData, SignalMessage, AvatarConfig, ChatMessage, Reaction } from '../types';

const CHANNEL_NAME = 'leang-talk-signaling-v2';

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
  
  const channelRef = useRef<BroadcastChannel | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerStreams = useRef<Map<string, MediaStream>>(new Map());
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // STUN config for real connectivity
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
    ]
  };

  // --- Signaling Functions ---

  const sendMessage = (msg: SignalMessage) => {
      channelRef.current?.postMessage(msg);
  };

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

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnections.current.set(targetPeerId, pc);

    // Add Tracks (Avatar Stream by default)
    if (localStream) {
      localStream.getTracks().forEach(track => {
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
      const stream = event.streams[0];
      peerStreams.current.set(targetPeerId, stream);
      
      setPeers(prev => prev.map(p => 
        p.id === targetPeerId ? { ...p, stream } : p
      ));
    };

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        sendMessage({
          type: 'offer',
          senderId: user.id,
          targetId: targetPeerId,
          payload: offer
        });
      });
    }

    return pc;
  }, [localStream, user.id]);

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
    const bc = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = bc;

    bc.onmessage = async (event) => {
      const msg = event.data as SignalMessage;
      
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
        const newPeer: PeerData = msg.payload;
        
        // Trigger Join Sound/Notification
        if (options.onPeerJoin) options.onPeerJoin(newPeer.displayName);

        setPeers(prev => {
          if (prev.find(p => p.id === newPeer.id)) return prev;
          return [...prev, newPeer];
        });

        sendMessage({
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
          setPeers(prev => {
             const idx = prev.findIndex(p => p.id === peerInfo.id);
             if (idx >= 0) {
                 const updated = [...prev];
                 updated[idx] = { ...updated[idx], ...peerInfo, stream: peerStreams.current.get(peerInfo.id!) };
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
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendMessage({
            type: 'answer',
            senderId: user.id,
            targetId: msg.senderId,
            payload: answer
          });
        } else if (msg.type === 'answer' && pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        } else if (msg.type === 'ice-candidate' && pc) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.payload));
        }
      }
    };

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
      bc.close();
      peerConnections.current.forEach(pc => pc.close());
    };
  }, [user.id, createPeerConnection]);

  // Handle local stream updates (Avatar only)
  useEffect(() => {
    if (localStream && !screenTrackRef.current) {
      peerConnections.current.forEach(pc => {
        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
            const sender = senders.find(s => s.track?.kind === track.kind);
            if (sender) {
                sender.replaceTrack(track);
            }
        });
      });
    }
  }, [localStream]);

  return { peers, chatMessages, reactions, sendChat, sendReaction, startScreenShare, stopScreenShare };
};