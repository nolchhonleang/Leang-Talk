# 🎥 Leang Talk

<div align="center">

![Leang Talk Logo](https://img.shields.io/badge/Leang-Talk-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)

**A Zoom-like video chat application with real-time avatar customization and cross-device multi-user support**

*Created by [Nol Chhonleang](https://github.com/nolchhonleang)*

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen?style=for-the-badge)](https://leang-talk.onrender.com)
[![Report Bug](https://img.shields.io/badge/report-bug-red?style=for-the-badge)](https://github.com/nolchhonleang/leang-talk/issues)
[![Request Feature](https://img.shields.io/badge/request-feature-blue?style=for-the-badge)](https://github.com/nolchhonleang/leang-talk/issues)

</div>

## 🌟 Features

### 🎯 Core Functionality
- **🔴 Multi-User Video Chat** - Real-time WebRTC communication across devices (like Zoom!)
- **🎭 Avatar Customization** - 12 avatar styles with extensive personalization
- **👁️ Face Tracking** - MediaPipe-powered facial landmark detection
- **📺 Screen Sharing** - Share your screen with other participants
- **💬 Real-time Chat** - Instant messaging during video calls
- **😊 Reactions** - Express yourself with emoji reactions
- **🌙 Dark Mode** - Beautiful dark/light theme toggle
- **📱 Responsive Design** - Optimized for all devices

### 🛠️ Technical Features
- **⚡ High Performance** - Built with React 19 and Vite
- **🎨 Modern UI** - Beautiful animations with Framer Motion
- **🔧 TypeScript** - Full type safety
- **🎯 State Management** - Efficient state handling with Zustand
- **� WebSocket Signaling** - Real-time signaling server for cross-device support
- **🔒 Secure Connections** - HTTPS/WSS support
- **🔄 Auto-Reconnection** - Automatic reconnection on network issues

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **npm** package manager
- **Modern web browser** with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nolchhonleang/leang-talk.git
   cd leang-talk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🌐 Deployment

### 🥇 Recommended: Render (Full Zoom-like Experience)
Deploy everything on Render for complete cross-device functionality:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Create Web Service
   - Connect: `nolchhonleang/Leang-Talk`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

✅ **Full multi-user support across all devices - just like Zoom!**

### Development (Local)
```bash
npm install
npm start
```
Runs both WebSocket server (port 3001) and serves the frontend.

### Environment Variables
- `NODE_ENV=production` - Enables production mode
- WebSocket URL automatically configured based on deployment

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server (frontend + WebSocket) |
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run server` | Start WebSocket server only |

## 🏗️ Project Structure

```
leang-talk/
├── components/          # React components
│   ├── WelcomeScreen.tsx    # Main welcome interface
│   └── VideoRoom.tsx        # Video chat room component
├── hooks/              # Custom React hooks
│   ├── useFaceLandmarker.ts # Face tracking logic
│   ├── useWebRTC.ts         # WebRTC functionality
│   └── useWebRTCSignaling.ts # WebSocket signaling
├── server.js           # WebSocket server + static file serving
├── types.ts            # TypeScript type definitions
└── public/             # Static assets
```

## 🔧 Technical Architecture

### WebRTC Signaling
- **Development:** WebSocket server for real-time communication
- **Production:** Same WebSocket server deployed with frontend
- **Cross-Device:** Full support across different devices and browsers

### Avatar System
- **12 Avatar Styles:** Cat, Dog, Bear, Rabbit, Fox, Panda, Unicorn, Koala, Tiger, Lion, Pig
- **Customization:** Colors, accessories (glasses, hats, bows, etc.)
- **Face Tracking:** MediaPipe integration for real-time avatar movement

### Real-time Features
- **Video/Audio:** WebRTC peer-to-peer connections
- **Screen Sharing:** WebRTC display capture API
- **Chat:** WebSocket-based instant messaging
- **Reactions:** Real-time emoji sharing

## �️ Technologies Used

### Frontend
- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Heroicons** - Beautiful SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **WebSocket (ws)** - Real-time communication
- **MediaPipe** - Face tracking library

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Vite** - Hot module replacement

## 🎯 How It Works (Like Zoom)

### 1. **Room Creation**
- User creates or joins a room with a unique ID
- WebSocket server manages room participants

### 2. **Signaling Process**
- Users exchange WebRTC offer/answer via WebSocket
- ICE candidates are shared for NAT traversal

### 3. **Peer Connection**
- Direct WebRTC connections established between participants
- Real-time video/audio flows peer-to-peer

### 4. **Features**
- Screen sharing, chat, reactions all work via WebSocket + WebRTC
- Face tracking controls avatar animations in real-time

## 🤝 Contributing

Contributions are what make the open-source community amazing! Here's how you can contribute:

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **MediaPipe Team** - For the face tracking technology
- **WebRTC Community** - For real-time communication standards
- **Zoom Team** - For inspiring the video chat experience

## 📞 Support

If you have any questions or need help:

- 📧 **Email:** [nolchhonleang@example.com](mailto:nolchhonleang@example.com)
- 🐛 **Issues:** [GitHub Issues](https://github.com/nolchhonleang/leang-talk/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/nolchhonleang/leang-talk/discussions)

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ by [Nol Chhonleang](https://github.com/nolchhonleang)

</div>

