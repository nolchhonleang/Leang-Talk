import { create } from 'zustand';
import { UserSettings, AvatarStyle, AvatarConfig } from '../types';

interface AppState {
  user: UserSettings | null;
  roomId: string | null;
  
  // Actions
  setUser: (user: UserSettings) => void;
  updateAvatarConfig: (config: Partial<AvatarConfig>) => void;
  setRoomId: (id: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

// Random ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>((set) => ({
  user: null,
  roomId: null,

  setUser: (user) => {
    // Save to localStorage for persistence
    localStorage.setItem('leang-talk-user', JSON.stringify(user));
    set({ user });
  },

  updateAvatarConfig: (config) => set((state) => {
    if (!state.user) return {};
    const newUser = {
      ...state.user,
      avatarConfig: { ...state.user.avatarConfig, ...config }
    };
    localStorage.setItem('leang-talk-user', JSON.stringify(newUser));
    return { user: newUser };
  }),

  setRoomId: (roomId) => set({ roomId }),

  setTheme: (theme) => {
    if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set((state) => state.user ? { user: { ...state.user, theme } } : {});
  }
}));

// Initialize from local storage if available
const stored = localStorage.getItem('leang-talk-user');
if (stored) {
  useStore.getState().setUser(JSON.parse(stored));
}