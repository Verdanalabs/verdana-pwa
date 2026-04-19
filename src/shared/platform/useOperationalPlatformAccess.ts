import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

type PlatformAccess = 'checking' | 'allowed' | 'blocked';

function canUseOperationalAppOnWeb() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (typeof navigator !== 'undefined' && 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const isNarrowViewport = window.innerWidth <= 768;

  return isStandalone || isNarrowViewport;
}

export function useOperationalPlatformAccess(): PlatformAccess {
  const [access, setAccess] = useState<PlatformAccess>(Platform.OS === 'web' ? 'checking' : 'allowed');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setAccess('allowed');
      return;
    }

    const evaluate = () => {
      setAccess(canUseOperationalAppOnWeb() ? 'allowed' : 'blocked');
    };

    evaluate();
    window.addEventListener('resize', evaluate);

    return () => {
      window.removeEventListener('resize', evaluate);
    };
  }, []);

  return access;
}
