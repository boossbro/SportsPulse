import { App } from '@capacitor/app';
import { Toast } from '@capacitor/toast';

let lastBack = 0;

export function useDoubleBackExit() {
  App.addListener('backButton', async ({ canGoBack }) => {
    if (canGoBack) return;

    const now = Date.now();
    if (now - lastBack < 2000) {
      App.exitApp();
    } else {
      lastBack = now;
      await Toast.show({
        text: 'Press back again to exit',
        duration: 'short'
      });
    }
  });
}
