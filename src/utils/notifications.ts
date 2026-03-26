const APP_ICON = '/icons/icon-192.svg';

export type NotificationStatus =
  | 'granted'
  | 'denied'
  | 'default'
  | 'unsupported'
  | 'install-required';

function isStandalone() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIOS() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

async function getRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  return navigator.serviceWorker.getRegistration();
}

export const notifications = {
  async registerServiceWorker() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return registration;
  },

  getStatus(): NotificationStatus {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      return 'unsupported';
    }

    if (isIOS() && !isStandalone()) {
      return 'install-required';
    }

    return Notification.permission;
  },

  async requestPermission() {
    const status = this.getStatus();

    if (status === 'unsupported' || status === 'install-required') {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async show(title: string, body: string, options?: { tag?: string }) {
    if (this.getStatus() !== 'granted') {
      return false;
    }

    const registration = await getRegistration();

    if (!registration) {
      return false;
    }

    await registration.showNotification(title, {
      body,
      tag: options?.tag,
      badge: APP_ICON,
      icon: APP_ICON,
      data: { url: '/' },
    });

    return true;
  },
};
