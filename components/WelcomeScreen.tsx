import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { AvatarStyle, AvatarConfig, UserSettings } from '../types';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { drawAvatar, drawStaticAvatar } from '../utils/avatarRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  SparklesIcon, SwatchIcon, 
  FaceSmileIcon, GiftIcon,
  MoonIcon, SunIcon,
  UserGroupIcon, PlusCircleIcon, MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface WelcomeScreenProps {
  onJoin: (settings: UserSettings) => void;
}

// Redesigned Logo: Modern "Face in Chat Bubble"
const Logo = () => (
    <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
                <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
            </defs>
            {/* Chat Bubble Shape */}
            <path d="M20 20 H80 A15 15 0 0 1 95 35 V65 A15 15 0 0 1 80 80 H40 L20 95 V80 H20 A15 15 0 0 1 5 65 V35 A15 15 0 0 1 20 20 Z" fill="url(#brandGrad)" />
            {/* Simple Face */}
            <circle cx="35" cy="45" r="6" fill="white" />
            <circle cx="65" cy="45" r="6" fill="white" />
            <path d="M40 60 Q50 70 60 60" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
    </div>
);

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoin }) => {
  const { setUser, setRoomId, user: savedUser, setTheme } = useStore();
  
  // Local State
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  
  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [camError, setCamError] = useState(false);
  
  const [config, setConfig] = useState<AvatarConfig>({ 
    style: AvatarStyle.CAT, 
    color: '', 
    accessory: 'none' 
  });
  const [activeTab, setActiveTab] = useState<'style' | 'color' | 'gear'>('style');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // MediaPipe Preview
  const { landmarker, isLoading } = useFaceLandmarker({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // --- Content Lists ---
  const ALL_COLORS = [
      { hex: '#fbbf24', name: 'Golden' }, { hex: '#f87171', name: 'Red' }, { hex: '#60a5fa', name: 'Blue' },
      { hex: '#a78bfa', name: 'Purple' }, { hex: '#34d399', name: 'Mint' }, { hex: '#f472b6', name: 'Pink' },
      { hex: '#fb923c', name: 'Orange' }, { hex: '#94a3b8', name: 'Grey' }, { hex: '#1e293b', name: 'Dark' },
      { hex: '#facc15', name: 'Yellow' }, { hex: '#2dd4bf', name: 'Teal' }, { hex: '#c084fc', name: 'Lavender' },
      { hex: '#39ff14', name: 'Neon Green' }, { hex: '#ff1493', name: 'Hot Pink' }, { hex: '#00ffff', name: 'Electric' },
      { hex: '#ff4500', name: 'Magma' }, { hex: '#7fff00', name: 'Chartreuse' }, { hex: '#ff00ff', name: 'Magenta' },
      { hex: '#4b0082', name: 'Indigo' }, { hex: '#800000', name: 'Maroon' }, { hex: '#000080', name: 'Navy' },
      { hex: '#2f4f4f', name: 'Slate' }, { hex: '#808000', name: 'Olive' }, { hex: '#8b4513', name: 'Chocolate' },
      { hex: '#ffd700', name: 'Gold' }, { hex: '#c0c0c0', name: 'Silver' }, { hex: '#cd7f32', name: 'Bronze' },
      { hex: '#fff8dc', name: 'Cream' }, { hex: '#ffdab9', name: 'Peach' }, { hex: '#000000', name: 'Black' },
      { hex: '#ffffff', name: 'White' }, { hex: '#15803d', name: 'Forest' }
  ];

  const ALL_GEAR = [
      'none', 'glasses', 'bow', 'hat', 'scarf', 'headphones', 
      'crown', 'flower', 'mask', 'pirate', 'monocle',
      'mustache', 'bowtie', 'beanie', 'earrings', 'visor'
  ];

  const getAvatarEmoji = (style: AvatarStyle) => {
      switch(style) {
          case AvatarStyle.CAT: return '🐱';
          case AvatarStyle.DOG: return '🐶';
          case AvatarStyle.FOX: return '🦊';
          case AvatarStyle.RABBIT: return '🐰';
          case AvatarStyle.BEAR: return '🐻';
          case AvatarStyle.PANDA: return '🐼';
          case AvatarStyle.UNICORN: return '🦄';
          case AvatarStyle.KOALA: return '🐨';
          case AvatarStyle.TIGER: return '🐯';
          case AvatarStyle.LION: return '🦁';
          case AvatarStyle.PIG: return '🐷';
          default: return '🙂';
      }
  };

  // Initialize
  useEffect(() => {
      const hash = window.location.hash.replace('#/', '');
      if (hash) {
          setJoinMode('join');
          setRoomCode(hash);
      }
      // Don't auto-set to create mode - let user choose
      
      if (savedUser?.theme === 'dark' || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          setIsDarkMode(true);
      }
      
      if (savedUser?.displayName) setName(savedUser.displayName);
      if (savedUser?.avatarConfig) setConfig(savedUser.avatarConfig);
  }, [savedUser]);

  // Start Preview
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    const startCam = async () => {
       try {
           const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
           stream = mediaStream;

           if (!isMounted) {
               mediaStream.getTracks().forEach(t => t.stop());
               return;
           }

           if (videoRef.current) {
               videoRef.current.srcObject = mediaStream;
               try {
                   await videoRef.current.play();
               } catch (e: any) {
                   if (e.name !== 'AbortError') console.warn("Video play interrupted", e);
               }
           }
           setCamError(false);
       } catch(e) { 
           console.error("Cam error", e);
           setCamError(true);
       }
    };
    startCam();

    return () => {
        isMounted = false;
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
    }
  }, []);

  // Render Loop
  useEffect(() => {
      const loop = () => {
          if (canvasRef.current && videoRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              const video = videoRef.current;
              
              if (video.readyState >= 2 && ctx) {
                 const startTime = performance.now();
                 let result = null;
                 if (landmarker) result = landmarker.detectForVideo(video, startTime);

                 if (result && result.faceLandmarks.length > 0) {
                     drawAvatar(
                        ctx, 
                        result.faceLandmarks[0], 
                        result.faceBlendshapes, 
                        config, 
                        canvasRef.current.width, 
                        canvasRef.current.height
                     );
                 } else {
                     drawStaticAvatar(ctx, config, canvasRef.current.width, canvasRef.current.height);
                 }
              }
          }
          rafRef.current = requestAnimationFrame(loop);
      };
      loop();
      return () => { if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [landmarker, config, isDarkMode]);

  const toggleTheme = () => {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      setTheme(newTheme ? 'dark' : 'light');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
        alert("Please enter your display name to continue!");
        return;
    }

    // Always require room code - no auto-generation
    if (!roomCode.trim()) {
        alert("Please enter a Room Code to create or join a meeting!");
        return;
    }

    const finalRoomId = roomCode.trim();

    const newUser: UserSettings = {
        id: Math.random().toString(36),
        displayName: name,
        avatarConfig: config,
        theme: isDarkMode ? 'dark' : 'light'
    };

    setUser(newUser);
    setRoomId(finalRoomId);
    window.location.hash = '/' + finalRoomId;
    
    onJoin(newUser);
  };

  // Filter Logic
  const filteredStyles = Object.values(AvatarStyle).filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredColors = ALL_COLORS.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredGear = ALL_GEAR.filter(g => g.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="h-[100dvh] bg-brand-50 dark:bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={toggleTheme}
            className="p-2 sm:p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg text-slate-800 dark:text-yellow-400 hover:scale-110 transition-transform"
          >
              {isDarkMode ? <SunIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MoonIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row h-full max-h-[100dvh] lg:h-auto lg:min-h-[700px] border-4 md:border-8 border-white dark:border-slate-700"
      >
        
        {/* LEFT: Avatar Customizer & Preview */}
        <div className="w-full lg:w-5/12 p-4 md:p-8 flex flex-col bg-brand-50/50 dark:bg-slate-900/50 relative border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700 flex-shrink-0">
           <div className="mb-2 sm:mb-4 z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
               <div className="flex items-center gap-2 mb-2">
                   <Logo />
                   <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-800 dark:text-white">
                       Leang-Talk
                   </h1>
               </div>
               <p className="text-slate-500 dark:text-slate-400 text-xs md:text-base">Your face, but cuter! (And Private)</p>
           </div>

           {/* Preview Box */}
           <div className="relative aspect-square w-48 sm:w-64 lg:w-full lg:max-w-md mx-auto rounded-3xl overflow-hidden bg-white shadow-inner mb-4 sm:mb-6 border-4 border-brand-100 dark:border-slate-600 z-10 group">
               <video ref={videoRef} className="absolute inset-0 opacity-0 pointer-events-none" autoPlay muted playsInline />
               <canvas ref={canvasRef} width={600} height={600} className="w-full h-full object-cover transform scale-x-[-1]" />
               
               {isLoading && !camError && (
                   <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10">
                       <div className="flex flex-col items-center">
                           <SparklesIcon className="w-8 h-8 text-brand-500 animate-spin" />
                           <span className="text-sm font-bold text-brand-600 mt-2">Loading...</span>
                       </div>
                   </div>
               )}

                {camError && (
                   <div className="absolute inset-0 flex items-center justify-center bg-red-50/90 dark:bg-red-900/90 backdrop-blur-sm z-10 text-center p-4">
                       <div className="flex flex-col items-center text-red-600 dark:text-red-200">
                           <ExclamationTriangleIcon className="w-8 h-8 mb-2" />
                           <span className="text-xs font-bold">Camera Access Denied</span>
                       </div>
                   </div>
               )}
           </div>

           {/* Name Input */}
           <div className="space-y-2 z-10 w-full max-w-md mx-auto">
               <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full px-5 py-3 rounded-2xl bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 focus:border-brand-500 focus:outline-none text-lg font-bold text-slate-800 dark:text-white text-center lg:text-left shadow-sm"
               />
           </div>

            {/* Footer Credit (Desktop) */}
            <div className="hidden lg:block mt-auto pt-4 text-xs text-slate-400 dark:text-slate-500 font-medium">
               Designed & Developed by <span className="text-brand-600 dark:text-brand-400">Nol Chhonleang</span>
            </div>
        </div>

        {/* RIGHT: Controls */}
        <div className="w-full lg:w-7/12 p-4 md:p-8 bg-white dark:bg-slate-800 flex flex-col h-full overflow-hidden relative">
            
            {/* Customization Tabs + Search Toggle */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'style', icon: FaceSmileIcon, label: 'Avatar' },
                        { id: 'color', icon: SwatchIcon, label: 'Color' },
                        { id: 'gear', icon: GiftIcon, label: 'Gear' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as any); setShowSearch(false); setSearchTerm(''); }}
                            className={clsx(
                                "flex-1 flex items-center justify-center gap-2 py-2 sm:py-3 rounded-xl transition-all font-bold text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4",
                                activeTab === tab.id 
                                    ? "bg-white dark:bg-slate-600 shadow-md text-brand-600 dark:text-white" 
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                {/* Search Toggle Button */}
                <button 
                    onClick={() => setShowSearch(!showSearch)}
                    className={clsx(
                        "p-3 rounded-2xl transition-colors flex-shrink-0",
                        showSearch ? "bg-brand-100 text-brand-600" : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                    )}
                >
                    {showSearch ? <XMarkIcon className="w-5 h-5"/> : <MagnifyingGlassIcon className="w-5 h-5"/>}
                </button>
            </div>

            {/* Collapsible Search Bar */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 top-3.5 text-slate-400" />
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                autoFocus
                                className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none text-sm dark:text-white"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Grid - Added pb-36 to allow scrolling past tall sticky footer */}
            <div className="flex-1 overflow-y-auto custom-scroll pr-2 mb-0 min-h-0 pb-36 lg:pb-0">
                {activeTab === 'style' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                        {filteredStyles.map((style) => (
                            <button
                                key={style}
                                onClick={() => setConfig({ ...config, style })}
                                className={clsx(
                                    "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all p-2",
                                    config.style === style 
                                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" 
                                        : "border-slate-100 dark:border-slate-700 hover:border-brand-200"
                                )}
                            >
                                <span className="text-2xl sm:text-3xl capitalize mb-1">
                                    {getAvatarEmoji(style)}
                                </span>
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase truncate w-full text-center">{style}</span>
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'color' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                        {filteredColors.map((c) => (
                            <button
                                key={c.hex}
                                onClick={() => setConfig({ ...config, color: c.hex })}
                                className={clsx(
                                    "aspect-[4/3] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                                    config.color === c.hex ? "border-slate-800 dark:border-white ring-1 ring-slate-800" : "border-slate-100 dark:border-slate-700"
                                )}
                            >
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: c.hex }} />
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate w-full text-center px-1">{c.name}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => setConfig({ ...config, color: '' })}
                            className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold"
                        >
                            Default
                        </button>
                    </div>
                )}

                {activeTab === 'gear' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                        {filteredGear.map((item) => (
                             <button
                                key={item}
                                onClick={() => setConfig({ ...config, accessory: item as any })}
                                className={clsx(
                                    "p-2 sm:p-3 rounded-xl border-2 font-bold capitalize transition-all flex items-center justify-between",
                                    config.accessory === item 
                                        ? "border-brand-500 bg-brand-50 dark:bg-slate-700 text-brand-700 dark:text-brand-300" 
                                        : "border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:text-slate-300"
                                )}
                            >
                                <span className="text-xs sm:text-sm truncate">{item}</span>
                                {config.accessory === item && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-brand-500 rounded-full flex-shrink-0 ml-2" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* JOIN / CREATE TABS - Sticky Bottom with Blur */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 border-t border-slate-100 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md z-20">
                <div className="flex gap-4 sm:gap-6 mb-3 sm:mb-4">
                    <button
                        onClick={() => setJoinMode('create')}
                        className={clsx("pb-1 font-bold transition-colors border-b-2 text-sm sm:text-base flex-1 text-center", joinMode === 'create' ? "border-brand-500 text-brand-600" : "border-transparent text-slate-400")}
                    >
                        Create Meeting
                    </button>
                    <button
                        onClick={() => setJoinMode('join')}
                        className={clsx("pb-1 font-bold transition-colors border-b-2 text-sm sm:text-base flex-1 text-center", joinMode === 'join' ? "border-brand-500 text-brand-600" : "border-transparent text-slate-400")}
                    >
                        Join Meeting
                    </button>
                </div>

                {/* Room Code Input - Always Visible */}
                <div className="mb-3 sm:mb-4">
                    <input 
                       value={roomCode}
                       onChange={(e) => setRoomCode(e.target.value)}
                       placeholder="Enter Room Code (e.g. meeting-123)"
                       className="w-full px-4 sm:px-5 py-2 sm:py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 focus:border-brand-500 focus:outline-none text-base font-bold text-slate-800 dark:text-white"
                    />
                </div>

                <button 
                    onClick={handleSubmit}
                    className="w-full py-3 sm:py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-display font-bold text-lg sm:text-xl shadow-lg shadow-brand-500/30 transform transition active:scale-95 flex items-center justify-center gap-3"
                >
                    {joinMode === 'create' ? (
                        <>
                            <PlusCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            Create Meeting
                        </>
                    ) : (
                        <>
                            <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            Join Meeting
                        </>
                    )}
                </button>
                
                {/* Footer Credit (Mobile) */}
                <div className="lg:hidden mt-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
                    Created by <span className="font-bold text-brand-600 dark:text-brand-400">Nol Chhonleang</span>
                </div>
            </div>

        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;