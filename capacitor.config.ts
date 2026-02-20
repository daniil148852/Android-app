import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aiface.xray',
  appName: 'X-Ray Face AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  loggingBehavior: 'debug'
};

export default config;
