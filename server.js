const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from dist directory (for production)
app.use(express.static(path.join(__dirname, 'dist')));

// For development, serve from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
