import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.deltabet.app',
  appName: 'DeltaBet',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
