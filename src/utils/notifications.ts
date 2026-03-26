/**
 * Utility for handling web notifications.
 */

export const notifications = {
  /**
   * Request permission to show notifications.
   */
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  /**
   * Show a notification.
   */
  show: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico', // Assuming a favicon exists
      });
    }
  },
};
