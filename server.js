import WebSocket from 'ws';
import { createServer } from 'http';
import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from dist directory (for production)
app.use(express.static(join(__dirname, 'dist')));

// For development, serve from public directory
app.use(express.static(join(__dirname, 'public')));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Store rooms and their clients
const rooms = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            // Handle room-based signaling
            if (message.roomId && message.type) {
                // Add client to room if not already there
                if (!rooms.has(message.roomId)) {
                    rooms.set(message.roomId, new Set());
                }
                const room = rooms.get(message.roomId);
                room.add(ws);
                
                // Broadcast message to all clients in the room except sender
                room.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove client from all rooms
        rooms.forEach((room, roomId) => {
            room.delete(ws);
            if (room.size === 0) {
                rooms.delete(roomId);
            }
        });
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Leang Talk Server started successfully!`);
    console.log(`📡 WebSocket server running on port ${PORT}`);
    console.log(`🌐 Ready for cross-device video calls like Zoom!`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    console.log(`📱 Users can now join meetings from anywhere on the internet!`);
});
