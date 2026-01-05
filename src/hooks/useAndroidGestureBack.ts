import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';

let lastBack = 0;

export function useAndroidGestureBack() {
  App.addListener('backButton', async (event) => {
    // Let Android gesture animation happen
    if (event.canGoBack) {
      window.history.back();
      return;
    }

    const now = Date.now();
    if (now - lastBack < 2000) {
      App.exitApp();
    } else {
      lastBack = now;
      await Toast.show({
        text: 'Swipe or press back again to exit',
        duration: 'short',
      });
    }
  });
}
