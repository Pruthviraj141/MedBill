import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.example.cafepos',
  appName: 'TBT Cafe',
  webDir: 'dist',
  server: { androidScheme: 'https' }
};
export default config;
