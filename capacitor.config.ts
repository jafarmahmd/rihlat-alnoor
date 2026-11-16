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
  server: {
    url: 'https://ais-pre-akqc23dw6qsgg577uvgzi7-802107894744.europe-west2.run.app',
    cleartext: false,
    allowNavigation: [
      'ais-pre-akqc23dw6qsgg577uvgzi7-802107894744.europe-west2.run.app',
    ],
  },
};

export default config;
