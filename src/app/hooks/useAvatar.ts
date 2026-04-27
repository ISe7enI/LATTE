import { useState, useEffect } from 'react';

const AVATAR_KEY = 'user_avatar';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200&h=200';

export function useAvatar() {
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem(AVATAR_KEY) || DEFAULT_AVATAR;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setAvatar(localStorage.getItem(AVATAR_KEY) || DEFAULT_AVATAR);
    };
    
    window.addEventListener('avatar-updated', handleStorageChange);
    return () => window.removeEventListener('avatar-updated', handleStorageChange);
  }, []);

  const updateAvatar = (newAvatarUrl: string) => {
    localStorage.setItem(AVATAR_KEY, newAvatarUrl);
    setAvatar(newAvatarUrl);
    window.dispatchEvent(new Event('avatar-updated'));
  };

  return { avatar, updateAvatar };
}
