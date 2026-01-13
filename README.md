# 🎥 Leang Talk

<div align="center">

![Leang Talk Logo](https://img.shields.io/badge/Leang-Talk-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)
![Status](https://img.shields.io/badge/status-production%20ready-brightgreen?style=for-the-badge)

**🌍 A video chat application that works for everyone on the internet with real-time avatar customization**

*Created by [Nol Chhonleang](https://github.com/nolchhonleang)*

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen?style=for-the-badge)](https://leang-talk.onrender.com)
[![Internet Access](https://img.shields.io/badge/internet-accessible-success?style=for-the-badge)](https://leang-talk.onrender.com)
[![Multi-Device](https://img.shields.io/badge/multi--device-supported-blue?style=for-the-badge)](https://leang-talk.onrender.com)
[![Report Bug](https://img.shields.io/badge/report-bug-red?style=for-the-badge)](https://github.com/nolchhonleang/leang-talk/issues)
[![Request Feature](https://img.shields.io/badge/request-feature-blue?style=for-the-badge)](https://github.com/nolchhonleang/leang-talk/issues)

</div>

## 🌟 Features

### 🎯 Core Functionality
- **🌍 Internet-Wide Access** - Anyone can join from anywhere on the internet
- **🔴 Multi-User Video Chat** - Real-time WebRTC communication across all devices
- **📱 Cross-Device Support** - Works on desktop, mobile, tablet !
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
- **🌐 WebSocket Signaling** - Real-time signaling server for global access
- **🔒 Secure Connections** - HTTPS/WSS support
- **🔄 Auto-Reconnection** - Automatic reconnection on network issues
- **🚀 Zero Installation** - No download required - works in any browser

## 🌍 Internet Accessibility - !

### ✅ **What Makes It Work for Everyone:**

1. **🌐 Global WebSocket Server** - Real-time signaling from anywhere
2. **📱 Cross-Browser Support** - Chrome, Firefox, Safari, Edge
3. **� Direct URL Access** - Share links 
4. **📡 No Installation** - Works instantly in any modern browser
5. **🌍 Worldwide Access** - Deploy once, accessible globally

### 🎯 **How Users Join:**
1. **Open the URL** - No signup required
2. **Enter Room ID** - Or create a new room
3. **Start Video Chat** - Works immediately across devices
4. **Share the Link** - Others can join instantly

## �🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher (for development)
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

## 🌐 Deployment for Internet Access

### 🥇 Recommended: Render (Instant Global Access)
Deploy to Render for immediate worldwide accessibility:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for global deployment"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Create Web Service
   - Connect: `nolchhonleang/Leang-Talk`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`

3. **Get Your Global URL**
   - Your app will be available at: `https://leang-talk.onrender.com`
   - **Anyone can join from anywhere on the internet!**

✅ **Full multi-user support across all devices globally !**

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
| `npm run build-and-serve` | Build and serve for production |

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
- **Global Access:** Full support across different devices and browsers worldwide
- **No Fallback:** Always uses WebSocket for best performance

### Avatar System
- **12 Avatar Styles:** Cat, Dog, Bear, Rabbit, Fox, Panda, Unicorn, Koala, Tiger, Lion, Pig
- **Customization:** Colors, accessories (glasses, hats, bows, etc.)
- **Face Tracking:** MediaPipe integration for real-time avatar movement

### Real-time Features
- **Video/Audio:** WebRTC peer-to-peer connections
- **Screen Sharing:** WebRTC display capture API
- **Chat:** WebSocket-based instant messaging
- **Reactions:** Real-time emoji sharing

## 🛠️ Technologies Used

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

## 🎯 How It Works - Global Access

### 1. **Room Creation**
- User creates or joins a room with a unique ID
- WebSocket server manages room participants globally

### 2. **Signaling Process**
- Users exchange WebRTC offer/answer via WebSocket
- ICE candidates are shared for NAT traversal
- Works across different networks and countries

### 3. **Peer Connection**
- Direct WebRTC connections established between participants
- Real-time video/audio flows peer-to-peer
- No server bottleneck after connection

### 4. **Global Features**
- Screen sharing, chat, reactions all work via WebSocket + WebRTC
- Face tracking controls avatar animations in real-time
- Works from anywhere with internet access

## 🌍 Browser Support

| Browser | Version | Support | Internet Access |
|---------|---------|---------|------------------|
| Chrome | 90+ | ✅ Full Support | ✅ Works Globally |
| Firefox | 88+ | ✅ Full Support | ✅ Works Globally |
| Safari | 14+ | ✅ Full Support | ✅ Works Globally |
| Edge | 90+ | ✅ Full Support | ✅ Works Globally |
| Mobile Chrome | 90+ | ✅ Full Support | ✅ Works Globally |
| Mobile Safari | 14+ | ✅ Full Support | ✅ Works Globally |

## 🤝 Contributing

Contributions are what make the open-source community amazing! Here's how you can contribute:

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **MediaPipe Team** - For the face tracking technology
- **WebRTC Community** - For real-time communication standards
- **Team** - For inspiring the video chat experience
- **Render Team** - For providing excellent deployment platform

---

<div align="center">

**⭐ Star this repo if it helped you!**

**🌍 Made with ❤️ by [Nol Chhonleang](https://github.com/nolchhonleang)**
**🚀 Accessible to everyone on the internet!**

</div>

