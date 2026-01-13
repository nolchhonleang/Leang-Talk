import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalMessage } from '../types';

interface UseWebRTCSignalingFallbackProps {
    roomId: string;
    userId: string;
    onMessage?: (message: SignalMessage) => void;
}

// Fallback signaling using localStorage and storage events for same-origin communication
export const useWebRTCSignalingFallback = ({ roomId, userId, onMessage }: UseWebRTCSignalingFallbackProps) => {
    const [isConnected, setIsConnected] = useState(true); // Always "connected" in fallback mode
    const onMessageRef = useRef(onMessage);
    const storageKey = `leang-talk-${roomId}`;

    // Update the ref when onMessage changes
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const sendMessage = useCallback((message: SignalMessage) => {
        try {
            // Store message in localStorage for other tabs/windows to pick up
            const messageWithTimestamp = {
                ...message,
                roomId, // Include roomId for proper routing (not in original type)
                timestamp: Date.now()
            };
            localStorage.setItem(storageKey, JSON.stringify(messageWithTimestamp));
            
            // Trigger storage event for same-page listeners
            window.dispatchEvent(new StorageEvent('storage', {
                key: storageKey,
                newValue: JSON.stringify(messageWithTimestamp)
            }));
            
            console.log('Sent message via localStorage:', messageWithTimestamp);
        } catch (error) {
            console.error('Failed to send message via localStorage:', error);
        }
    }, [roomId]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === storageKey && event.newValue) {
                try {
                    const parsedMessage = JSON.parse(event.newValue);
                    const message: SignalMessage = {
                        type: parsedMessage.type,
                        senderId: parsedMessage.senderId,
                        targetId: parsedMessage.targetId,
                        payload: parsedMessage.payload
                    };
                    
                    // Ignore messages from ourselves and check roomId
                    if (parsedMessage.senderId !== userId && parsedMessage.roomId === roomId) {
                        console.log('Received message via localStorage:', message);
                        onMessageRef.current?.(message);
                    }
                } catch (error) {
                    console.error('Failed to parse message from localStorage:', error);
                }
            }
        };

        // Listen for storage events
        window.addEventListener('storage', handleStorageChange);
        
        // Clean up old messages on mount
        try {
            localStorage.removeItem(storageKey);
            console.log('Using localStorage fallback signaling for room:', roomId);
        } catch (error) {
            console.warn('Failed to clean up old messages:', error);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            // Clean up on unmount
            try {
                localStorage.removeItem(storageKey);
            } catch (error) {
                console.warn('Failed to clean up on unmount:', error);
            }
        };
    }, [storageKey, userId, roomId]);

    return {
        isConnected,
        sendMessage
    };
};
