# Setup Guide - iOS Health Integration App

## Quick Start

### 1. Install Dependencies

```bash
# First, update package.json with these dependencies:
# See PACKAGE_JSON_UPDATE.txt for the complete list

npm install
```

### 2. Update app.json Permissions

Make sure your `app.json` includes these HealthKit permissions:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSHealthShareUsageDescription": "This app needs access to your health data to sync steps, sleep, heart rate, and workouts with your Life OS dashboard.",
        "NSHealthUpdateUsageDescription": "This app needs permission to write health data to track your progress.",
        "NSFaceIDUsageDescription": "This app uses Face ID to secure your health data."
      }
    }
  }
}
```

### 3. Configure Dashboard API URL

Update `services/SyncService.ts` with your actual dashboard URL:

```typescript
const API_BASE_URL = 'http://localhost:3000'; // Update this
```

### 4. Run the App

```bash
# Start Expo development server
npm start

# Press 'i' to open iOS simulator
# Or scan QR code with Expo Go app on physical device
```

## For Physical Device Testing

### Option A: Expo Go (Quick Start)
1. Install Expo Go from App Store
2. Scan QR code from `npm start`
3. **Limitation**: HealthKit and Screen Time APIs won't work with Expo Go

### Option B: Development Build (Full Features)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Create development build
eas build --platform ios --profile development

# Install on device
eas build --platform ios --profile development --local
```

## Known Issues & Solutions

### Issue 1: expo-health Not Found

**Problem**: `expo-health` is not part of standard Expo SDK 51.

**Solution**:
- Use `react-native-health` instead: `npm install react-native-health`
- Update `services/HealthKitService.ts` to use `react-native-health` API

### Issue 2: Screen Time API Not Working

**Problem**: Screen Time API requires special Apple entitlements and native modules.

**Solution**:
- Create a custom native module using Expo Modules API
- Use `DeviceActivity` framework in the native module
- Request Family Controls entitlement from Apple
- Follow guide: `services/ScreenTimeService.ts` (see notes at bottom)

### Issue 3: Background Sync Not Working

**Problem**: Background fetch requires explicit user permission.

**Solution**:
1. Go to iOS Settings → General → Background App Refresh
2. Enable "Background App Refresh"
3. Find your app and enable it
4. Restart the app

### Issue 4: TypeScript Errors

**Problem**: Missing type definitions for expo-health or other packages.

**Solution**:
```bash
# Install type definitions
npm install --save-dev @types/react-native

# Or add // @ts-ignore above problematic lines
```

## Production Deployment

### Step 1: Build for TestFlight

```bash
eas build --platform ios --profile testflight
```

### Step 2: Upload to App Store Connect

1. Go to EAS dashboard: https://expo.dev
2. Find your build
3. Click "Upload to App Store Connect"

### Step 3: Configure App Store Listing

Required information:
- **App Name**: Life OS Health
- **Category**: Health & Fitness
- **Age Rating**: 12+
- **Privacy Policy**: Describe data usage

**Important**: Include privacy info for:
- Health data (HealthKit)
- Screen Time data
- Data collection practices
- Data encryption

### Step 4: Submit for Review

Apple will review:
- HealthKit usage description
- Screen Time API usage
- Privacy policy
- Data encryption methods

## Dashboard API Integration

Your dashboard needs these endpoints:

```typescript
// POST /api/health/sync
// Receives: HealthData
interface HealthData {
  userId: string;
  timestamp: string;
  date: string;
  steps: number;
  stepsGoal: number;
  distance: number;
  activeEnergyBurned: number;
  heartRate: number;
  heartRateVariability: number;
  sleepDuration: number;
  sleepGoal: number;
  deepSleep: number;
  remSleep: number;
  workouts: number;
  workoutMinutes: number;
}

// POST /api/screentime/sync
// Receives: ScreenTimeData
interface ScreenTimeData {
  userId: string;
  timestamp: string;
  date: string;
  totalScreenTime: number;
  productiveTime: number;
  entertainmentTime: number;
  focusSessions: number;
  appUsage: AppUsage[];
  pickups: number;
  notifications: number;
}

// POST /api/productivity/score
// Receives: ProductivityScore
interface ProductivityScore {
  userId: string;
  date: string;
  score: number;
  breakdown: {
    stepsScore: number;
    sleepScore: number;
    focusScore: number;
    workoutScore: number;
  };
  streak: number;
}

// GET /api/health/latest
// Returns: latest HealthData record

// GET /api/productivity/score
// Returns: latest ProductivityScore record
```

## Troubleshooting

### HealthKit Permissions Denied

1. iOS Settings → Privacy → Health → [App Name]
2. Enable all data types
3. Restart app

### Sync Failures

1. Check dashboard API is running
2. Verify API_BASE_URL in SyncService.ts
3. Check network connection
4. View app logs: `npm log:ios`

### Background Sync Not Triggering

1. Enable Background App Refresh in iOS Settings
2. Make sure phone is not in Low Power Mode
3. Force quit and reopen app
4. Check console for error logs

## Development Tips

### Testing Productivity Score

```typescript
// In dashboard.tsx, add test data:
const testHealthData: HealthData = {
  steps: 12000,
  sleepDuration: 7.5,
  workouts: 1,
  // ... other fields
};

const testScore = productivityScoreService.calculateScore(testHealthData);
console.log('Test score:', testScore);
```

### Viewing AsyncStorage

```typescript
// Add to app for debugging:
import AsyncStorage from '@react-native-async-storage/async-storage';

const allKeys = await AsyncStorage.getAllKeys();
const allData = await AsyncStorage.multiGet(allKeys);
console.log('All data:', allData);
```

### Resetting Onboarding

```typescript
// To reset permissions screen:
await SecureStore.deleteItemAsync('hasCompletedOnboarding');
await SecureStore.deleteItemAsync('healthKitPermission');
await SecureStore.deleteItemAsync('screenTimePermission');
```

## Screen Time API Implementation Guide

To implement actual Screen Time API integration:

1. **Create Expo Module**:
```bash
npx create-expo-module screen-time-module
```

2. **Native Module (Objective-C)**:
```objective-c
// ScreenTimeModule.swift
import DeviceActivity
import FamilyControls

@objc(ScreenTimeModule)
class ScreenTimeModule: NSObject {
  @objc
  func getScreenTime(_ resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
    // Implement Screen Time API logic
  }
}
```

3. **Add Entitlements**:
- Go to Apple Developer Portal
- Enable "Family Controls" capability
- Add to app.entitlements file

4. **Use in App**:
```typescript
import { ScreenTimeModule } from 'screen-time-module';

const screenTime = await ScreenTimeModule.getScreenTime();
```

**Note**: This requires Apple Developer approval and special provisioning profiles.

## Alternative: Web-Based Analytics

If Screen Time API is too complex, use web-based analytics:
- App usage via foreground/background events
- Focus session detection via timers
- Self-reported productivity metrics
- Integration with RescueTime or Toggl APIs

## Support

For issues or questions:
1. Check README.md for architecture overview
2. Review services/ for implementation details
3. Check types/health.ts for data structures
4. View Expo Router docs: https://docs.expo.dev/router/

## License

MIT
