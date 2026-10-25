import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // Check if iOS
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      if (isIos) {
        alert(
          '📱 To install KharchaSplit on your iPhone / iPad:\n\n1. Tap the Share button (⎋) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen" (➕)\n3. Tap "Add" in the top-right corner!'
        );
      } else {
        alert(
          '💡 To install KharchaSplit:\n\nTap the three dots (⋮) in your browser menu and select "Install app" or "Add to Home screen".'
        );
      }
    }
  };

  return {
    canInstall: !isInstalled,
    hasNativePrompt: Boolean(installPrompt),
    isInstalled,
    triggerInstall,
  };
}
