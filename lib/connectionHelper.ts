/**
 * Expo Connection Helper Utility
 * 
 * Handles connection retries and fallbacks when tunnel/preview fails
 * Run this in development if you encounter ERR_NGROK_3200 or connection issues
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface ConnectionStatus {
  method: 'tunnel' | 'lan' | 'localhost' | 'unknown';
  isConnected: boolean;
  debuggerHost: string | null;
  expoConfig: any;
}

export function getConnectionStatus(): ConnectionStatus {
  const manifest = Constants.manifest as any;
  const manifest2 = Constants.manifest2 as any;
  
  const debuggerHost = manifest?.debuggerHost || 
                       manifest2?.extra?.expoGo?.debuggerHost ||
                       'unknown';

  let method: ConnectionStatus['method'] = 'unknown';
  
  if (debuggerHost.includes('exp.direct') || debuggerHost.includes('ngrok')) {
    method = 'tunnel';
  } else if (debuggerHost.includes('localhost') || debuggerHost.includes('127.0.0.1')) {
    method = 'localhost';
  } else if (/^\d+\.\d+\.\d+\.\d+/.test(debuggerHost)) {
    method = 'lan';
  }

  return {
    method,
    isConnected: !!debuggerHost && debuggerHost !== 'unknown',
    debuggerHost,
    expoConfig: Constants.expoConfig,
  };
}

export function logConnectionInfo() {
  const status = getConnectionStatus();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📡 Expo Connection Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Platform: ${Platform.OS}`);
  console.log(`Method: ${status.method.toUpperCase()}`);
  console.log(`Connected: ${status.isConnected ? '✅' : '❌'}`);
  console.log(`Debugger Host: ${status.debuggerHost}`);
  console.log(`Project ID: ${Constants.expoConfig?.extra?.eas?.projectId || 'N/A'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (status.method === 'tunnel' && !status.isConnected) {
    console.warn('⚠️  TUNNEL CONNECTION FAILED');
    console.warn('Solutions:');
    console.warn('1. Stop the server (Ctrl+C)');
    console.warn('2. Run: npx expo start --lan --clear');
    console.warn('3. Or run: ./start-expo.sh (interactive)');
  }

  if (status.method === 'lan') {
    console.log('✅ Using LAN connection (recommended)');
  }

  return status;
}

export function getRecommendedStartCommand(): string {
  if (Platform.OS === 'web') {
    return 'npx expo start --localhost --clear';
  }
  return 'npx expo start --lan --clear';
}

/**
 * Call this in development to monitor connection health
 */
export function enableConnectionMonitoring() {
  if (__DEV__) {
    logConnectionInfo();
    
    let checkCount = 0;
    const maxChecks = 3;
    
    const intervalId = setInterval(() => {
      const status = getConnectionStatus();
      
      if (!status.isConnected) {
        console.error('❌ Connection lost!');
        console.error('Recommended: ' + getRecommendedStartCommand());
        clearInterval(intervalId);
      }
      
      checkCount++;
      if (checkCount >= maxChecks) {
        clearInterval(intervalId);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }
}

/**
 * Get troubleshooting steps for current connection issues
 */
export function getTroubleshootingSteps(): string[] {
  const status = getConnectionStatus();
  const steps: string[] = [];

  if (!status.isConnected) {
    steps.push('1. Check if Metro bundler is running');
    steps.push('2. Verify phone and computer are on same WiFi (LAN mode)');
    steps.push('3. Clear cache: npx expo start --clear');
  }

  if (status.method === 'tunnel') {
    steps.push('4. Tunnel may be rate-limited. Try LAN instead:');
    steps.push('   npx expo start --lan --clear');
    steps.push('5. If tunnel keeps failing, clean ngrok:');
    steps.push('   pkill -9 ngrok && rm -rf ~/.ngrok2');
  }

  if (status.method === 'lan' && !status.isConnected) {
    steps.push('4. Check firewall settings');
    steps.push('5. Ensure both devices are on same network');
    steps.push('6. Try restarting WiFi on both devices');
  }

  return steps;
}

export default {
  getConnectionStatus,
  logConnectionInfo,
  getRecommendedStartCommand,
  enableConnectionMonitoring,
  getTroubleshootingSteps,
};
