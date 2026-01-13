# 🎥 Leang Talk

<div align="center">

![Leang Talk Logo](https://img.shields.io/badge/Leang-Talk-blue?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-purple?style=for-the-badge)

**A cutting-edge video chat application with real-time avatar customization and advanced face tracking**

*Created by [Nol Chhonleang](https://github.com/nolchhonleang)*

[![Live Demo](https://img.shields.io/badge/demo-online-brightgreen?style=for-the-badge)](http://localhost:3000)
[![Report Bug](https://img.shields.io/badge/report-bug-red?style=for-the-badge)](https://github.com/nolchhonleang/leang-talk/issues)
[![Request Feature](https://img.shields.io/badge/request-feature-blue?style=for-the-badge)](https://github.com/nolchhonleang/leang-talk/issues)

</div>

## 🌟 Features

### 🎯 Core Functionality
- **🔴 Real-time Video Chat** - Seamless WebRTC-based video communication
- **🎭 Avatar Customization** - Multiple avatar styles with extensive personalization options
- **👁️ Face Tracking** - Advanced MediaPipe-powered facial landmark detection
- **🌙 Dark Mode** - Beautiful dark/light theme toggle
- **📱 Responsive Design** - Optimized for all devices and screen sizes

### 🛠️ Technical Features
- **⚡ High Performance** - Built with React 19 and Vite for lightning-fast development
- **🎨 Modern UI** - Beautiful animations with Framer Motion
- **🔧 TypeScript** - Full type safety and better developer experience
- **🎯 State Management** - Efficient state handling with Zustand
- **🎭 Component Library** - Heroicons for consistent iconography

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
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

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## � Deployment

### Development (Local)
```bash
npm install
npm start
```
This runs both the WebSocket server (port 3001) and Vite dev server (port 3000)

### Static Deployment (GitHub Pages, Netlify, Vercel)

**Important Note:** Static hosting services don't support WebSocket servers, so multi-user functionality requires a signaling server.

#### Option 1: Deploy Signaling Server Separately
1. Deploy the WebSocket server to Render/Heroku:
   ```bash
   # Deploy server.js to a service that supports Node.js
   # Update the WebSocket URL in useWebRTCSignaling.ts
   ```

#### Option 2: Use Fallback Mode (Limited)
The app automatically falls back to localStorage-based signaling for static deployments, which works for:
- ✅ Same browser, multiple tabs
- ❌ Different devices/users over the internet

#### Option 3: Full Production Setup
For full multi-user functionality, deploy both:
- **Frontend:** Vercel/Netlify/GitHub Pages
- **Backend:** Render/Heroku/Railway (WebSocket server)

### Environment Variables
- `NODE_ENV=production` - Enables production mode
- WebSocket URL is automatically configured based on deployment type

## �🏗️ Project Structure

```
leang-talk/
├── components/          # React components
│   ├── WelcomeScreen.tsx    # Main welcome interface
│   └── VideoRoom.tsx        # Video chat room component
├── hooks/              # Custom React hooks
│   ├── useFaceLandmarker.ts # Face tracking logic
│   └── useWebRTC.ts         # WebRTC functionality
├── utils/              # Utility functions
│   ├── avatarDrawer.ts      # Avatar rendering
│   └── avatarRenderer.ts    # Avatar animation
├── store/              # State management
│   └── useStore.ts          # Global application state
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── index.html          # HTML template
```

## 🎨 Avatar Customization

Choose from a variety of avatar styles and personalize your virtual presence:

- **🐱 Cat Avatars** - Cute and playful feline characters
- **🐻 Bear Avatars** - Friendly and warm bear characters  
- **🦊 Fox Avatars** - Clever and charming fox characters
- **🐼 Panda Avatars** - Adorable and gentle panda characters

### Customization Options
- **Colors**: Multiple color schemes for each avatar type
- **Accessories**: Hats, glasses, and other fun accessories
- **Expressions**: Dynamic facial expressions based on face tracking

## 🔧 Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### Libraries & Tools
- **Framer Motion** - Smooth animations and transitions
- **Zustand** - Lightweight state management
- **Heroicons** - Beautiful SVG icons
- **MediaPipe** - Face detection and tracking
- **WebRTC** - Real-time video communication

## 🌐 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full Support |
| Firefox | 88+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 90+ | ✅ Full Support |

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 Roadmap

- [ ] **Multi-user Rooms** - Support for group video chats
- [ ] **Screen Sharing** - Share your screen with others
- [ ] **Recording Feature** - Record video conversations
- [ ] **Mobile App** - Native mobile applications
- [ ] **AI Avatars** - AI-powered avatar generation
- [ ] **Voice Effects** - Real-time voice modulation

## 🐛 Troubleshooting

### Common Issues

**Q: Camera not working?**
A: Ensure you've granted camera permissions in your browser settings.

**Q: Face tracking not working?**
A: Make sure you're in a well-lit environment and your face is clearly visible.

**Q: Build fails?**
A: Try clearing the node_modules folder and reinstalling dependencies.


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MediaPipe Team** - For the amazing face tracking technology
- **React Community** - For the incredible ecosystem and tools
- **Tailwind CSS** - For the utility-first CSS framework
- **All Contributors** - Everyone who has contributed to this project

---

<div align="center">

**Made with ❤️ by [Nol Chhonleang](https://github.com/nolchhonleang)**

[![GitHub followers](https://img.shields.io/github/followers/nolchhonleang?style=social)](https://github.com/nolchhonleang)
[![GitHub stars](https://img.shields.io/github/stars/nolchhonleang/leang-talk?style=social)](https://github.com/nolchhonleang/leang-talk)

</div>
<img width="1918" height="1011" alt="image" src="https://github.com/user-attachments/assets/e75f7a2d-5d20-415c-a349-7cbb251d12af" />
<img width="1917" height="1015" alt="image" src="https://github.com/user-attachments/assets/8cda8c46-dec4-431e-aba2-3a294035132f" />

