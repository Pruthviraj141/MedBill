import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.example.cafepos',
  appName: 'Café POS',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: { androidScheme: 'https' }
};
export default config;
