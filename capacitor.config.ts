import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alllive.videoportal',
  appName: 'All Live',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
