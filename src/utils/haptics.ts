import { WebHaptics } from 'web-haptics';

type Preset = 'light' | 'medium' | 'success' | 'selection' | 'warning' | 'error';

let instance: WebHaptics | null = null;

function getHaptics() {
  if (typeof window === 'undefined') {
    return null;
  }

  instance ??= new WebHaptics();
  return instance;
}

function trigger(preset: Preset) {
  void getHaptics()?.trigger(preset);
}

export const haptics = {
  supported() {
    return WebHaptics.isSupported;
  },
  light() {
    trigger('light');
  },
  medium() {
    trigger('medium');
  },
  success() {
    trigger('success');
  },
  selection() {
    trigger('selection');
  },
  warning() {
    trigger('warning');
  },
  error() {
    trigger('error');
  },
};
