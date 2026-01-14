import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalMessage } from '../types';

interface UseWebRTCSignalingProps {
    roomId: string;
    userId: string;
    onMessage?: (message: SignalMessage) => void;
}

export const useWebRTCSignaling = ({ roomId, userId, onMessage }: UseWebRTCSignalingProps) => {
    // Always use WebSocket for full multi-user functionality

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
        // Universal WebSocket URL that works everywhere
        let wsUrl;
        
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Local development
            wsUrl = `ws://localhost:3001`;
        } else if (window.location.protocol === 'https:') {
            // Production with HTTPS
            wsUrl = `wss://${window.location.host}`;
        } else {
            // Production with HTTP
            wsUrl = `ws://${window.location.host}`;
        }
            
        console.log('🔗 Connecting to WebSocket:', wsUrl);
        console.log('🌐 This will enable cross-device video calls like Meeting!');
        
        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Connected to signaling server - Ready for video calls!');
                console.log('🏠 Room ID:', roomId, 'User ID:', userId);
                setIsConnected(true);
                
                // Clear any pending reconnection timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data) as SignalMessage;
                    console.log('📨 WebSocket message received:', msg.type, 'from:', msg.senderId);
                    onMessageRef.current?.(msg);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error, 'data:', event.data);
                }
            };

            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                setIsConnected(false);
            };

            ws.onclose = (event) => {
                console.log('🔌 WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                
                // Auto-reconnect after 3 seconds
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('🔄 Attempting to reconnect...');
                        connect();
                    }, 3000);
                }
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
                roomId,
                timestamp: Date.now() // Add timestamp for security
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
