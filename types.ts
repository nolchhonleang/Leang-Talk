export enum AvatarStyle {
  CAT = 'cat',
  DOG = 'dog',
  BEAR = 'bear',
  RABBIT = 'rabbit',
  FOX = 'fox',
  PANDA = 'panda',
  UNICORN = 'unicorn',
  KOALA = 'koala',
  TIGER = 'tiger',
  LION = 'lion',
  PIG = 'pig'
}

export interface AvatarConfig {
  style: AvatarStyle;
  color: string; // Hex code
  accessory: 'none' | 'glasses' | 'bow' | 'hat' | 'scarf' | 'headphones' | 'crown' | 'flower' | 'mask' | 'pirate' | 'monocle' | 'mustache' | 'bowtie' | 'beanie' | 'earrings' | 'visor';
}

export interface UserSettings {
  id: string;
  displayName: string;
  avatarConfig: AvatarConfig;
  theme: 'light' | 'dark' | 'auto';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Reaction {
  id: string;
  senderId: string;
  emoji: string;
  timestamp: number;
}

export interface PeerData {
  id: string;
  displayName: string;
  avatarConfig: AvatarConfig;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
}

// Signaling Types
export type SignalType = 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate' | 'chat' | 'reaction' | 'update-state' | 'meeting-request' | 'meeting-accept' | 'meeting-reject';

export interface SignalMessage {
  type: SignalType;
  senderId: string;
  targetId?: string;
  payload?: any;
  timestamp?: number; // Add timestamp for security
}

export interface FaceLandmarkerResult {
  faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  faceBlendshapes: Array<{ categories: Array<{ score: number; categoryName: string }> }>;
}