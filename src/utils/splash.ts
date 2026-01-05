import { SplashScreen } from '@capacitor/splash-screen';

export async function hideSplash() {
  await SplashScreen.hide({
    fadeOutDuration: 600
  });
}
