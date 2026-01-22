# Project Structure Quick Reference

## File Tree

```
health-integration-app/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout with navigation
│   ├── index.tsx                # Loading/onboarding screen
│   ├── permissions.tsx          # HealthKit/Screen Time permissions UI
│   └── dashboard.tsx            # Main dashboard with health metrics
│
├── services/                     # Core business logic
│   ├── HealthKitService.ts      # HealthKit data import
│   ├── ScreenTimeService.ts     # Screen Time API wrapper
│   ├── ProductivityScoreService.ts  # Score calculation
│   ├── SyncService.ts           # API sync & offline queue
│   └── BackgroundSyncService.ts # Background sync every 5min
│
├── types/                        # TypeScript interfaces
│   └── health.ts                # HealthData, ScreenTimeData, ProductivityScore
│
├── assets/                       # Images, icons (create this dir)
│
├── docs/                         # Generated docs
│   └── generated/               # Auto-generated documentation
│
├── app.json                      # Expo config (iOS permissions)
├── package.json                  # Dependencies (needs update)
├── tsconfig.json                 # TypeScript config
├── babel.config.js              # Babel config
├── expo-env.d.ts                # TypeScript declarations
│
├── README.md                    # Complete project overview
├── SETUP_GUIDE.md               # Step-by-step setup instructions
├── IMPLEMENTATION_SUMMARY.md    # Project status & checklist
├── PROJECT_STRUCTURE.md         # This file
├── PROMPT.md                    # Original requirements
└── PACKAGE_JSON_UPDATE.txt      # Dependencies reference
```

## Key Files to Modify Before Running

### 1. package.json
Apply dependencies from `PACKAGE_JSON_UPDATE.txt`:
- expo-health (or react-native-health)
- expo-apple-authentication
- expo-device
- expo-secure-store
- expo-background-fetch
- expo-task-manager
- @react-native-async-storage/async-storage

### 2. services/SyncService.ts
Update API base URL:
```typescript
const API_BASE_URL = 'http://localhost:3000'; // Change this
```

### 3. app.json
Verify iOS permissions are set (already done):
```json
{
  "ios": {
    "infoPlist": {
      "NSHealthShareUsageDescription": "...",
      "NSHealthUpdateUsageDescription": "...",
      "NSFaceIDUsageDescription": "..."
    }
  }
}
```

## Architecture Flow

```
User opens app
    ↓
Check onboarding status
    ↓
If first launch → Show Permissions Screen
    ↓
Request HealthKit permissions
    ↓
Request Screen Time permissions
    ↓
Save onboarding status
    ↓
Navigate to Dashboard
    ↓
Background fetches health data
    ↓
Sync to dashboard API
    ↓
Calculate productivity score
    ↓
Display metrics
```

## Data Flow

```
HealthKit (Device)
    ↓
HealthKitService.ts
    ↓
SyncService.ts
    ↓
Dashboard API (/api/health/sync)
    ↓
Database
    ↓
Dashboard UI (updates)
```

## Screen Navigation

```
index.tsx (Loading)
    ↓ (check onboarding)
permissions.tsx (First time only)
    ↓ (grant permissions)
dashboard.tsx (Main app)
```

## Services Quick Reference

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| HealthKitService | Import health data | `getSteps()`, `getSleepAnalysis()`, `getHeartRate()`, `getWorkouts()` |
| ScreenTimeService | Import screen time | `getScreenTimeData()`, `getAppUsage()`, `getFocusSessions()` |
| ProductivityScoreService | Calculate score | `calculateScore()`, `getScoreLabel()`, `getScoreColor()` |
| SyncService | Sync with dashboard | `syncNow()`, `getSyncState()`, `retryFailedSyncs()` |
| BackgroundSyncService | Background tasks | `initialize()`, `syncOnAppOpen()`, `getStatus()` |

## Type Definitions Reference

```typescript
// HealthData
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

// ScreenTimeData
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

// ProductivityScore
interface ProductivityScore {
  userId: string;
  date: string;
  score: number; // 0-100
  breakdown: {
    stepsScore: number;
    sleepScore: number;
    focusScore: number;
    workoutScore: number;
  };
  streak: number;
}
```

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run on iOS simulator
npm run ios

# Build for TestFlight
eas build --platform ios --profile testflight

# View logs
npm log:ios

# Clear cache
npm start -- --clear
```

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| HealthKit permissions denied | iOS Settings → Privacy → Health → App |
| Background sync not working | Enable Background App Refresh in iOS Settings |
| expo-health not found | Use react-native-health instead |
| TypeScript errors | Run `npm install --save-dev @types/react-native` |
| Sync failures | Check API_BASE_URL in SyncService.ts |
| Screen Time not working | Requires native module (see SETUP_GUIDE.md) |

## Next Steps

1. Update package.json dependencies
2. Install dependencies: `npm install`
3. Update API URL in SyncService.ts
4. Run on simulator: `npm start`
5. Test permissions flow
6. Test on physical device
7. Build for production

## Documentation Index

1. **README.md** - Start here for project overview
2. **SETUP_GUIDE.md** - Step-by-step setup instructions
3. **IMPLEMENTATION_SUMMARY.md** - Project status and checklist
4. **PROJECT_STRUCTURE.md** - This file (quick reference)

---

**Last Updated**: January 22, 2026
**Status**: Ready for testing
