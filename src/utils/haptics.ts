/**
 * Subtle haptic feedback utility for tactile web experiences.
 * Uses the Vibration API where supported.
 */

export const haptics = {
  /**
   * A very light tap, used for general button presses.
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * A slightly stronger tap, used for successful actions or completion.
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  /**
   * A double tap, used for significant milestones or errors.
   */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  },
};
