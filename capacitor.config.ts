import type { CapacitorConfig } from '@capacitor/cli';

// Set to true for live reload during development
const LIVE_RELOAD = false;

// Your computer's local IP address (find with: ipconfig on Windows, ifconfig on Mac/Linux)
const LOCAL_IP = '10.0.2.2'; // Use 10.0.2.2 for Android emulator (maps to host's localhost)

const config: CapacitorConfig = {
  appId: 'com.controlacceso.app',
  appName: 'Control Acceso',
  webDir: 'dist',
  server: {
    // Enable live reload for development
    ...(LIVE_RELOAD ? {
      url: `http://${LOCAL_IP}:5173`,
      cleartext: true,
    } : {}),
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    allowMixedContent: LIVE_RELOAD
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
