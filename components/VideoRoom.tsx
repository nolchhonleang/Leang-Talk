import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { UserSettings, PeerData } from '../types';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { useWebRTC } from '../hooks/useWebRTC';
import { drawAvatar, drawStaticAvatar } from '../utils/avatarRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
    MicrophoneIcon, 
    ChatBubbleLeftRightIcon,
    PaperAirplaneIcon, 
    ShareIcon, 
    SunIcon, 
    MoonIcon, 
    ClipboardDocumentCheckIcon,
    ComputerDesktopIcon, 
    StopIcon,
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    SpeakerXMarkIcon,
    UserPlusIcon,
    ArrowLeftOnRectangleIcon,
    BellAlertIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/solid';

interface VideoRoomProps {
    user: UserSettings;
    roomId: string;
    onLeave: () => void;
}

// Sounds
const JOIN_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; 
const CHAT_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; 

const Logo = () => (
    <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <defs>
                <linearGradient id="brandGradSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
            </defs>
            <path d="M20 20 H80 A15 15 0 0 1 95 35 V65 A15 15 0 0 1 80 80 H40 L20 95 V80 H20 A15 15 0 0 1 5 65 V35 A15 15 0 0 1 20 20 Z" fill="url(#brandGradSmall)" />
            <circle cx="35" cy="45" r="6" fill="white" />
            <circle cx="65" cy="45" r="6" fill="white" />
            <path d="M40 60 Q50 70 60 60" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
    </div>
);

const VideoRoom: React.FC<VideoRoomProps> = ({ user, roomId, onLeave }) => {
    const { setUser, setRoomId, setTheme } = useStore();
    const [isMuted, setIsMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [msgText, setMsgText] = useState('');
    const [copied, setCopied] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [toasts, setToasts] = useState<{id: number, msg: string, type: 'info' | 'chat'}[]>([]);
    
    // Engine Refs
    const sourceVideoRef = useRef<HTMLVideoElement>(null);
    const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    // Logic
    const { landmarker } = useFaceLandmarker({});
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [sourceStream, setSourceStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    // Device State
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedAudioId, setSelectedAudioId] = useState('');
    const [selectedVideoId, setSelectedVideoId] = useState('');

    const joinAudioRef = useRef(new Audio(JOIN_SOUND));
    const chatAudioRef = useRef(new Audio(CHAT_SOUND));

    const addToast = (msg: string, type: 'info' | 'chat') => {
        const id = Date.now();
        setToasts(prev => [...prev, {id, msg, type}]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    
    const { peers, chatMessages, reactions, sendChat, sendReaction, startScreenShare, stopScreenShare } = useWebRTC(
        roomId!, 
        user!, 
        localStream,
        {
            onPeerJoin: (name) => {
                joinAudioRef.current.play().catch(() => {});
                addToast(`${name} joined`, 'info');
            },
            onMessage: (msg) => {
                if (!showChat) {
                    chatAudioRef.current.play().catch(() => {});
                    addToast(`Msg: ${msg.senderName}`, 'chat');
                }
            }
        }
    );

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, showChat]);

    // Load Devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const devs = await navigator.mediaDevices.enumerateDevices();
                setAudioDevices(devs.filter(d => d.kind === 'audioinput'));
                setVideoDevices(devs.filter(d => d.kind === 'videoinput'));
            } catch(e) { console.error("Error fetching devices", e); }
        };
        getDevices();
    }, []);

    // Initialize Camera & Engine
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                if (sourceStream) {
                    sourceStream.getTracks().forEach(t => t.stop());
                }

                const constraints = {
                    video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
                    audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true
                };

                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                if (!isMounted) {
                    mediaStream.getTracks().forEach(t => t.stop());
                    return;
                }
                
                setSourceStream(mediaStream);

                if (sourceVideoRef.current) {
                    sourceVideoRef.current.srcObject = mediaStream;
                    await sourceVideoRef.current.play().catch(e => console.warn(e));
                }

                if (sourceCanvasRef.current) {
                    const canvasStream = sourceCanvasRef.current.captureStream(30);
                    // Add the audio track to the canvas stream so it's sent over WebRTC
                    mediaStream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
                    setLocalStream(canvasStream);
                }
            } catch (e) { console.error("Media Init Error", e); }
        };
        init();

        return () => {
            isMounted = false;
        };
    }, [selectedAudioId, selectedVideoId]);

    // Avatar Drawing Loop
    useEffect(() => {
        const loop = () => {
            if (!sourceCanvasRef.current || !sourceVideoRef.current || !user) return;
            const ctx = sourceCanvasRef.current.getContext('2d');
            const video = sourceVideoRef.current;

            if (ctx && video.readyState >= 2) {
                if (sourceCanvasRef.current.width !== 640) {
                    sourceCanvasRef.current.width = 640;
                    sourceCanvasRef.current.height = 480;
                }

                if (landmarker) {
                    const res = landmarker.detectForVideo(video, performance.now());
                    if (res.faceLandmarks.length > 0) {
                        drawAvatar(ctx, res.faceLandmarks[0], res.faceBlendshapes, user.avatarConfig, sourceCanvasRef.current.width, sourceCanvasRef.current.height);
                    } else {
                        drawStaticAvatar(ctx, user.avatarConfig, sourceCanvasRef.current.width, sourceCanvasRef.current.height);
                    }
                } else {
                     drawStaticAvatar(ctx, user.avatarConfig, sourceCanvasRef.current.width, sourceCanvasRef.current.height);
                }
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        loop();
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }
    }, [landmarker, user, isDarkMode]);

    // Handle Mic Mute (Affects the stream sent to peers)
    useEffect(() => {
        if (sourceStream) sourceStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
    }, [isMuted, sourceStream]);

    const handleScreenShare = async () => {
        if (!isScreenSharing) {
            const stream = await startScreenShare();
            if (stream) {
                setScreenStream(stream);
                setIsScreenSharing(true);
                setFocusedId('me');
                
                stream.getVideoTracks()[0].onended = () => {
                     setScreenStream(null);
                     setIsScreenSharing(false);
                     setFocusedId(null);
                };
            }
        } else {
            stopScreenShare();
            setScreenStream(null);
            setIsScreenSharing(false);
            setFocusedId(null);
        }
    };

    const handleLeave = () => {
        window.location.hash = '';
        window.location.reload(); 
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        setTheme(newTheme ? 'dark' : 'light');
    };

    return (
        <div className="fixed inset-0 bg-brand-50 dark:bg-slate-950 text-slate-800 dark:text-white flex flex-col transition-colors duration-300 h-[100dvh]">
            
            {/* --- HIDDEN ENGINE (Source of Magic) --- */}
            <div className="absolute opacity-0 pointer-events-none -z-50 w-px h-px overflow-hidden">
                <video ref={sourceVideoRef} muted autoPlay playsInline />
                <canvas ref={sourceCanvasRef} />
            </div>

            {/* Header */}
            <header className="flex-none h-14 md:h-16 px-4 flex items-center justify-between border-b border-brand-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-2">
                    <Logo />
                    <span className="font-display font-bold text-lg hidden sm:block">Leang-Talk</span>
                    <button 
                        onClick={handleShare}
                        className="ml-2 px-3 py-1.5 bg-brand-100 dark:bg-slate-800 hover:bg-brand-200 dark:hover:bg-slate-700 rounded-full text-xs font-mono text-brand-600 dark:text-brand-300 flex items-center gap-2 transition-colors border border-brand-200 dark:border-slate-700"
                    >
                        <span className="max-w-[80px] sm:max-w-[120px] truncate">{roomId}</span>
                        {copied ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500" /> : <ShareIcon className="w-3 h-3" />}
                    </button>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                     <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                         {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-400" />}
                     </button>
                     <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                         <Cog6ToothIcon className="w-5 h-5 text-slate-400" />
                     </button>
                     <span className="text-xs md:text-sm font-bold bg-green-100 text-green-600 px-2 py-1 md:px-3 md:py-1 rounded-full border border-green-200 whitespace-nowrap">
                        {peers.length + 1} Online
                     </span>
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 relative flex overflow-hidden w-full bg-slate-100 dark:bg-black/20">
                
                {/* TOASTS */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
                    <AnimatePresence>
                        {toasts.map(toast => (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                className="px-4 py-2 bg-slate-800/90 text-white text-sm rounded-full shadow-lg backdrop-blur flex items-center gap-2"
                            >
                                {toast.type === 'chat' ? <ChatBubbleLeftRightIcon className="w-4 h-4 text-brand-400"/> : <BellAlertIcon className="w-4 h-4 text-yellow-400"/>}
                                {toast.msg}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Settings Modal */}
                <AnimatePresence>
                    {showSettings && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl w-full max-w-md"
                            >
                                <h2 className="text-xl font-bold mb-4">Device Settings</h2>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-500">Camera</label>
                                        <select 
                                            value={selectedVideoId} 
                                            onChange={(e) => setSelectedVideoId(e.target.value)}
                                            className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none"
                                        >
                                            {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}`}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-500">Microphone</label>
                                        <select 
                                            value={selectedAudioId} 
                                            onChange={(e) => setSelectedAudioId(e.target.value)}
                                            className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none"
                                        >
                                            {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,5)}`}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="mt-6 w-full py-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700"
                                >
                                    Done
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Empty State Overlay */}
                {peers.length === 0 && !focusedId && (
                    <div className="absolute inset-x-0 top-16 z-10 flex justify-center pointer-events-none px-4">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-brand-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl flex items-center gap-4 pointer-events-auto w-full max-w-sm transform transition-all hover:scale-105">
                            <div className="p-3 bg-brand-100 dark:bg-slate-700 rounded-full">
                                <UserPlusIcon className="w-6 h-6 text-brand-600 dark:text-brand-300" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold mb-1">Waiting for friends...</p>
                                <button onClick={handleShare} className="text-xs font-semibold bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition-colors w-full">
                                    {copied ? 'Link Copied!' : 'Copy Invite Link'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {focusedId ? (
                    // FOCUS MODE LAYOUT
                    <div className="flex-1 w-full h-full flex flex-col md:flex-row p-2 md:p-4 gap-2 md:gap-4 overflow-hidden">
                         <div className="flex-1 h-[70%] md:h-full min-h-0 rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-800 relative ring-1 ring-white/10">
                             {focusedId === 'me' 
                                ? <VideoTile 
                                    isLocal 
                                    name={`${user?.displayName} (You)`} 
                                    stream={isScreenSharing ? screenStream : localStream} 
                                    isMuted={isMuted} 
                                    isScreenSharing={isScreenSharing} 
                                    isFocused={true} 
                                    onClick={() => setFocusedId(null)}
                                  />
                                : peers.find(p => p.id === focusedId) 
                                    ? <VideoTile 
                                        name={peers.find(p => p.id === focusedId)!.displayName}
                                        stream={peers.find(p => p.id === focusedId)!.stream}
                                        isMuted={peers.find(p => p.id === focusedId)!.isMuted}
                                        isScreenSharing={peers.find(p => p.id === focusedId)!.isScreenSharing}
                                        isFocused={true}
                                        onClick={() => setFocusedId(null)}
                                      />
                                    : <div className="flex items-center justify-center h-full text-white">User left</div>
                             }
                             <button onClick={() => setFocusedId(null)} className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md z-30 transition-transform hover:scale-110 shadow-lg">
                                <ArrowsPointingInIcon className="w-6 h-6" />
                             </button>
                         </div>
                         <div className="h-[30%] md:h-full md:w-72 flex md:flex-col gap-2 bg-white/5 dark:bg-black/20 rounded-2xl p-2 md:p-3 overflow-x-auto md:overflow-y-auto custom-scroll flex-shrink-0 backdrop-blur-sm pb-24 md:pb-3">
                             {focusedId !== 'me' && (
                                <div className="min-w-[160px] md:w-full flex-shrink-0 aspect-video rounded-xl overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/10">
                                    <VideoTile isLocal name={`${user?.displayName} (You)`} stream={isScreenSharing ? screenStream : localStream} isMuted={isMuted} isScreenSharing={isScreenSharing} onClick={() => setFocusedId('me')} />
                                </div>
                             )}
                             {peers.filter(p => p.id !== focusedId).map(peer => (
                                 <div key={peer.id} className="min-w-[160px] md:w-full flex-shrink-0 aspect-video rounded-xl overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/10">
                                    <VideoTile name={peer.displayName} stream={peer.stream} isMuted={peer.isMuted} isScreenSharing={peer.isScreenSharing} onClick={() => setFocusedId(peer.id)} />
                                 </div>
                             ))}
                         </div>
                    </div>
                ) : (
                    // GRID MODE LAYOUT - IMPROVED RESPONSIVE
                    <div className={clsx(
                        "flex-1 w-full p-2 md:p-4 grid gap-2 md:gap-4 transition-all duration-300 overflow-y-auto content-start pb-24",
                        // Default (Mobile Portrait): 1 Col
                        // Mobile Landscape / Small Tablet (min 500px): 2 Cols
                        // Desktop (lg): 3 Cols
                        // Large Desktop (xl): 4 Cols
                        peers.length === 0 ? "grid-cols-1 place-items-center max-w-4xl mx-auto h-min my-auto" :
                        "grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max"
                    )}>
                        <div className={clsx("w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-700", peers.length === 0 && "h-auto max-h-[60vh] aspect-[3/4] sm:aspect-video")}>
                            <VideoTile isLocal name={`${user?.displayName} (You)`} stream={isScreenSharing ? screenStream : localStream} isMuted={isMuted} isScreenSharing={isScreenSharing} onClick={() => setFocusedId('me')} />
                        </div>
                        {peers.map(peer => (
                             <div key={peer.id} className="w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-700">
                                <VideoTile name={peer.displayName} stream={peer.stream} isMuted={peer.isMuted} isScreenSharing={peer.isScreenSharing} onClick={() => setFocusedId(peer.id)} />
                             </div>
                        ))}
                    </div>
                )}

                {/* Chat Sidebar */}
                <AnimatePresence>
                    {showChat && (
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border-l border-brand-100 dark:border-slate-700 flex flex-col z-30"
                        >
                            <div className="p-4 border-b dark:border-slate-800 font-bold flex justify-between items-center bg-brand-50/50 dark:bg-slate-800/50">
                                <span>Messages</span>
                                <button onClick={() => setShowChat(false)} className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"><ArrowLeftOnRectangleIcon className="w-4 h-4 transform rotate-180"/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                                {chatMessages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm space-y-2">
                                        <ChatBubbleLeftRightIcon className="w-10 h-10 opacity-20" />
                                        <p>No messages yet...</p>
                                    </div>
                                )}
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={clsx("flex flex-col max-w-[85%]", msg.senderId === user?.id ? "self-end items-end" : "self-start items-start")}>
                                        <div className="text-[10px] text-slate-500 mb-1 px-1">{msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        <div className={clsx(
                                            "px-4 py-2 rounded-2xl text-sm shadow-sm",
                                            msg.senderId === user?.id 
                                                ? "bg-brand-500 text-white rounded-br-sm" 
                                                : "bg-slate-100 dark:bg-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700"
                                        )}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); if(msgText.trim()) { sendChat(msgText); setMsgText(''); } }} className="p-4 border-t dark:border-slate-800 flex gap-2 mb-safe bg-white dark:bg-slate-900">
                                <input 
                                    value={msgText} onChange={e => setMsgText(e.target.value)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ring-brand-500 border border-transparent focus:border-transparent transition-all"
                                    placeholder="Type a message..."
                                />
                                <button type="submit" disabled={!msgText.trim()} className="p-2.5 bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Reaction Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
                <AnimatePresence>
                    {reactions.map(r => (
                        <motion.div
                            key={r.id}
                            initial={{ y: '100vh', x: Math.random() * window.innerWidth, opacity: 1, scale: 0.5 }}
                            animate={{ y: '50vh', opacity: 0, scale: 2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            className="absolute text-6xl"
                        >
                            {r.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Controls Bar */}
            <div className="flex-none p-3 sm:p-4 pb-5 sm:pb-6 flex items-center justify-center z-20 pointer-events-none mb-safe">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-full px-3 py-2 sm:px-6 sm:py-3 shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 sm:gap-4 pointer-events-auto max-w-full">
                    
                    {/* MUTE */}
                    <ControlBtn 
                        isActive={isMuted}
                        activeColor="bg-red-500 text-white hover:bg-red-600 shadow-red-500/30"
                        inactiveColor="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                        icon={isMuted ? SpeakerXMarkIcon : MicrophoneIcon} 
                        onClick={() => setIsMuted(!isMuted)} 
                        label={isMuted ? "Unmute" : "Mute"}
                    />
                    
                    {/* SCREEN SHARE */}
                    <ControlBtn 
                        isActive={isScreenSharing}
                        activeColor="bg-green-500 text-white hover:bg-green-600 shadow-green-500/30"
                        inactiveColor="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                        icon={isScreenSharing ? StopIcon : ComputerDesktopIcon} 
                        onClick={handleScreenShare} 
                        label={isScreenSharing ? "Stop Sharing" : "Share"}
                    />

                    <div className="w-px h-6 sm:h-8 bg-slate-300 dark:bg-slate-700 mx-1" />

                    {/* REACTIONS */}
                    <div className="flex gap-1 sm:gap-2">
                        {['❤️', '😂', '🎉'].map(emoji => (
                            <button 
                                key={emoji}
                                onClick={() => sendReaction(emoji)}
                                className="text-xl sm:text-2xl hover:scale-125 transition-transform p-1.5 sm:p-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 sm:h-8 bg-slate-300 dark:bg-slate-700 mx-1" />

                    {/* CHAT */}
                    <ControlBtn 
                        isActive={showChat}
                        activeColor="bg-brand-500 text-white hover:bg-brand-600 shadow-brand-500/30"
                        inactiveColor="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                        icon={ChatBubbleLeftRightIcon} 
                        onClick={() => setShowChat(!showChat)} 
                        label="Chat"
                        badge={chatMessages.length > 0}
                    />

                    {/* LEAVE BUTTON */}
                    <button 
                        onClick={handleLeave}
                        className="ml-2 sm:ml-4 p-3 sm:p-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all hover:scale-110 border border-red-200 dark:border-red-900/50"
                        title="Leave Room"
                    >
                        <ArrowLeftOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Reusable Robust Video Tile ---
interface VideoTileProps {
    stream?: MediaStream | null;
    name: string;
    isMuted?: boolean;
    isScreenSharing?: boolean;
    isLocal?: boolean;
    isFocused?: boolean;
    onClick?: () => void;
}

const VideoTile: React.FC<VideoTileProps> = ({ stream, name, isMuted, isScreenSharing, isLocal, isFocused, onClick }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasStream, setHasStream] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            setHasStream(true);
            videoRef.current.play().catch(e => console.log("Auto-play prevented", e));

            // Setup Audio Visualizer
            if (!isLocal && !isScreenSharing) {
                try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const analyser = audioCtx.createAnalyser();
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyser.fftSize = 256;
                    audioContextRef.current = audioCtx;
                    analyserRef.current = analyser;

                    const checkAudio = () => {
                        const dataArray = new Uint8Array(analyser.frequencyBinCount);
                        analyser.getByteFrequencyData(dataArray);
                        const sum = dataArray.reduce((a, b) => a + b, 0);
                        const avg = sum / dataArray.length;
                        setIsSpeaking(avg > 10); // Threshold for speaking
                        requestAnimationFrame(checkAudio);
                    };
                    checkAudio();
                } catch(e) { console.error("Audio Vis Error", e); }
            }
        } else {
            setHasStream(false);
            setIsSpeaking(false);
        }
        
        return () => {
            audioContextRef.current?.close();
        };
    }, [stream, isLocal]);

    return (
        <div 
            onClick={onClick}
            className={clsx(
                "relative w-full h-full bg-slate-200 dark:bg-slate-800 group cursor-pointer overflow-hidden transition-all duration-200",
                isFocused ? "" : "hover:scale-[1.02]",
                isSpeaking ? "ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] z-10" : ""
            )}
        >
            <video 
                ref={videoRef}
                className={clsx(
                    "w-full h-full",
                    isScreenSharing ? "object-contain bg-black" : "object-cover",
                    // Only mirror if it's the Avatar (local) and NOT screen sharing
                    isLocal && !isScreenSharing && "transform scale-x-[-1]"
                )}
                autoPlay 
                playsInline 
                // CRITICAL FIX: Mute LOCAL video to prevent feedback, unmute REMOTE
                muted={isLocal} 
            />
            
            {!hasStream && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <div className="animate-pulse w-16 h-16 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
            )}

            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs sm:text-sm font-bold border border-white/10 flex items-center gap-2 max-w-[80%] shadow-lg">
                    <span className="truncate">{name}</span>
                    {isScreenSharing && <ComputerDesktopIcon className="w-4 h-4 text-green-400 flex-shrink-0" />}
                    {isMuted ? (
                        <SpeakerXMarkIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                    ) : (
                         isSpeaking ? 
                         <div className="flex gap-0.5 items-end h-3">
                             <div className="w-1 bg-green-500 animate-[bounce_0.8s_infinite] h-full" />
                             <div className="w-1 bg-green-500 animate-[bounce_1.2s_infinite] h-2/3" />
                             <div className="w-1 bg-green-500 animate-[bounce_0.6s_infinite] h-full" />
                         </div> : 
                         <div className="w-2 h-2 rounded-full bg-green-500/50 flex-shrink-0" />
                    )}
                </div>
            </div>

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                {isFocused 
                    ? <ArrowsPointingInIcon className="w-10 h-10 text-white drop-shadow-xl transform scale-90 group-hover:scale-100 transition-transform"/> 
                    : <ArrowsPointingOutIcon className="w-10 h-10 text-white drop-shadow-xl transform scale-90 group-hover:scale-100 transition-transform"/>
                }
            </div>
        </div>
    );
};

const ControlBtn = ({ isActive, activeColor, inactiveColor, icon: Icon, onClick, label, badge }: any) => (
    <button
        onClick={onClick}
        className={clsx(
            "p-3 sm:p-3.5 rounded-full transition-all duration-200 flex-shrink-0 group relative",
            isActive ? activeColor : inactiveColor
        )}
    >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        {badge && !isActive && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
        )}
        <span className="hidden md:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-sm">
            {label}
        </span>
    </button>
);

export default VideoRoom;