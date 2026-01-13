import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalMessage } from '../types';
import { useWebRTCSignalingFallback } from './useWebRTCSignalingFallback';

interface UseWebRTCSignalingProps {
    roomId: string;
    userId: string;
    onMessage?: (message: SignalMessage) => void;
}

export const useWebRTCSignaling = ({ roomId, userId, onMessage }: UseWebRTCSignalingProps) => {
    // Check if we're in a static deployment (GitHub Pages, Netlify, etc.)
    const isStaticDeployment = !window.location.hostname.includes('localhost') && 
                             !window.location.hostname.includes('127.0.0.1') &&
                             !window.location.hostname.includes('0.0.0.0');
    
    // Use fallback signaling for static deployments
    if (isStaticDeployment) {
        console.log('Using fallback signaling for static deployment');
        return useWebRTCSignalingFallback({ roomId, userId, onMessage });
    }

    // Original WebSocket implementation for development
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const onMessageRef = useRef(onMessage);

    // Update the ref when onMessage changes
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const connect = () => {
        // Connect to WebSocket server (works for both local and Render deployment)
        const wsUrl = window.location.protocol === 'https:' 
            ? `wss://${window.location.host}` 
            : `ws://${window.location.host}`;
            
        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('Connected to signaling server');
                setIsConnected(true);
                
                // Clear any pending reconnection timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const message: SignalMessage = JSON.parse(event.data);
                    onMessageRef.current?.(message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            ws.onclose = () => {
                console.log('Disconnected from signaling server');
                setIsConnected(false);
                
                // Attempt to reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connect();
                }, 3000);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

        } catch (error) {
            console.error('Failed to connect to signaling server:', error);
            setIsConnected(false);
        }
    };

    const sendMessage = useCallback((message: SignalMessage) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const messageWithRoom = {
                ...message,
                roomId
            };
            wsRef.current.send(JSON.stringify(messageWithRoom));
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
        }
    }, [roomId]);

    useEffect(() => {
        connect();

        return () => {
            // Cleanup on unmount
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [roomId]);

    return {
        isConnected,
        sendMessage
    };
};
