import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from dist directory (for production)
if (existsSync(join(__dirname, 'dist'))) {
  app.use(express.static(join(__dirname, 'dist')));
  console.log('📁 Serving from dist directory');
} else {
  app.use(express.static(join(__dirname)));
  console.log('📁 Serving from root directory');
}

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  const indexPath = existsSync(join(__dirname, 'dist', 'index.html')) 
    ? join(__dirname, 'dist', 'index.html')
    : join(__dirname, 'index.html');
  res.sendFile(indexPath);
});

// Store rooms and their clients with metadata
const rooms = new Map();
const clientInfo = new Map(); // Store client metadata

wss.on('connection', (ws) => {
    console.log('New client connected');
    let currentRoomId = null;
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            console.log('📨 Received message:', message.type, 'from:', message.senderId, 'room:', message.roomId);
            
            // Handle room-based signaling
            if (message.roomId && message.type) {
                currentRoomId = message.roomId;
                
                // Add client to room if not already there
                if (!rooms.has(message.roomId)) {
                    rooms.set(message.roomId, new Set());
                    console.log('🏠 Created new room:', message.roomId);
                }
                const room = rooms.get(message.roomId);
                room.add(ws);
                
                // Store client info
                clientInfo.set(ws, {
                    roomId: message.roomId,
                    userId: message.senderId,
                    displayName: message.payload?.displayName || 'Unknown'
                });
                
                console.log('👥 Room', message.roomId, 'now has', room.size, 'clients');
                
                // Broadcast message to all clients in room except sender
                room.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        // For targeted messages (offer/answer/ice), only send to specific target
                        if (message.targetId) {
                            const targetInfo = clientInfo.get(client);
                            if (targetInfo && targetInfo.userId === message.targetId) {
                                console.log('📤 Sending targeted message to:', message.targetId);
                                client.send(JSON.stringify(message));
                            }
                        } else {
                            // For broadcast messages (join/leave/update-state), send to all
                            console.log('📤 Broadcasting message to client in room:', message.roomId);
                            client.send(JSON.stringify(message));
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        const info = clientInfo.get(ws);
        if (info && info.roomId) {
            const room = rooms.get(info.roomId);
            if (room) {
                room.delete(ws);
                console.log('👋 Client left room', info.roomId, 'remaining:', room.size);
                
                // Notify other clients in the room
                const leaveMessage = {
                    type: 'leave',
                    senderId: info.userId,
                    roomId: info.roomId,
                    timestamp: Date.now()
                };
                
                room.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(leaveMessage));
                    }
                });
                
                // Clean up empty rooms
                if (room.size === 0) {
                    rooms.delete(info.roomId);
                    console.log('🗑️ Deleted empty room:', info.roomId);
                }
            }
        }
        clientInfo.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Leang Talk Server started successfully!`);
    console.log(`📡 WebSocket server running on port ${PORT}`);
    console.log(`🌐 Ready for cross-device video calls`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`📱 Users can now join meetings from anywhere on the internet!`);
});
