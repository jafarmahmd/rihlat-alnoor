import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rihlat.alnoor.app',
  appName: 'رحلة النور',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#059669',
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
  },
};

export default config;
