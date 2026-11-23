import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.medbill.pos',
  appName: 'MedBill',
  webDir: 'dist',
  server: { androidScheme: 'https' }
};
export default config;
