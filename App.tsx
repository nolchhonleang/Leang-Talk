import React, { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import VideoRoom from './components/VideoRoom';
import { UserSettings } from './types';

function App() {
  const [user, setUser] = useState<UserSettings | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Handle URL Hash for Room ID
  useEffect(() => {
     const hash = window.location.hash.replace('#/', '');
     if (hash) {
         setRoomId(hash);
     }
     // Don't auto-generate room ID - let user input their own
  }, []);

  const handleJoin = (settings: UserSettings) => {
    setUser(settings);
    // Persist theme
    if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  };

  const handleLeave = () => {
      setUser(null);
      // Optional: Redirect or refresh
      window.location.reload();
  };

  if (!user || !roomId) {
    return <WelcomeScreen onJoin={handleJoin} />;
  }

  return <VideoRoom user={user} roomId={roomId} onLeave={handleLeave} />;
}

export default App;
