# iOS Health & Screen Time Integration App

## Project Goal

Build a native iOS Expo app that:
1. Imports Apple Health data (steps, sleep, heart rate, workouts)
2. Imports Screen Time API data (app usage, productivity metrics)
3. Syncs automatically with Life OS dashboard database
4. Replaces all mocked health data in dashboard
5. Gamifies scores based on real productivity

## Technical Requirements

### Expo SDK 51+ with Native Modules

**Required Packages:**
- expo-health - Apple Health integration
- expo-apple-authentication - HealthKit permissions
- expo-screen-time - Screen time API (iOS 15+)
- expo-store-kit - AsyncStorage for offline
- expo-device - Device info
- expo-updates - Over-the-air updates
- expo-splash-screen - Launch screen

### Data Types to Import

**HealthKit:**
- Steps (quantityTypeIdentifier: HKQuantityTypeIdentifierStepCount)
- Distance (HKQuantityTypeIdentifierDistanceWalkingRunning)
- Active Energy (HKQuantityTypeIdentifierActiveEnergyBurned)
- Heart Rate (HKQuantityTypeIdentifierHeartRate)
- Sleep Analysis (HKCategoryTypeIdentifierSleepAnalysis)
- Workouts (HKWorkoutTypeIdentifier)

**Screen Time:**
- App usage (category: deviceUsage)
- Pickup/usage counts
- Notification usage
- Web usage

### Database Integration

**Life OS Dashboard API:**
- POST /api/health/sync - Sync health data
- POST /api/screentime/sync - Sync screen time
- GET /api/health/latest - Get latest metrics
- GET /api/productivity/score - Get productivity score

**Sync Frequency:**
- Real-time sync on app open
- Background sync every 5 minutes
- Sync on significant data changes
- Batch sync every hour for historical data

### Score Gamification

**Productivity Score Formula:**
```
Base Score = 50

Step Bonus (up to +20):
- 10,000+ steps = +20
- 7,500-9,999 = +15
- 5,000-7,499 = +10
- <5,000 = 0

Sleep Bonus (up to +15):
- 8h+ sleep = +15
- 7-8h = +10
- 6-7h = +5
- <6h = 0

Focus Bonus (up to +15):
- 4+ deep work sessions = +15
- 2-3 sessions = +10
- 1 session = +5
- 0 sessions = 0

Workout Bonus (up to +10):
- Any workout = +10
- Strength training = +5
- Cardio = +5

Penalties:
- <5k steps = -10
- <6h sleep = -10
- 0 workouts = -5

Final Score = Base + Bonuses - Penalties (0-100)
```

## Implementation Phases

### Phase 1: Project Setup (4 tasks)
- [ ] Initialize Expo project with SDK 51
- [ ] Install health and screen time packages
- [ ] Configure app.json for iOS permissions
- [ ] Set up TypeScript with strict types

### Phase 2: Permissions & Auth (6 tasks)
- [ ] Create HealthKit permission request
- [ ] Implement Apple Authentication
- [ ] Create permission explanation UI
- [ ] Handle denied permissions gracefully
- [ ] Store permission status
- [ ] Re-prompt if needed

### Phase 3: Health Data Import (8 tasks)
- [ ] Create HealthKit client wrapper
- [ ] Request step count authorization
- [ ] Fetch historical steps (last 30 days)
- [ ] Request sleep data authorization
- [ ] Fetch sleep analysis
- [ ] Request heart rate authorization
- [ ] Fetch latest heart rate
- [ ] Request workout data

### Phase 4: Screen Time Integration (7 tasks)
- [ ] Check Screen Time API availability (iOS 15+)
- [ ] Create Screen Time client wrapper
- [ ] Fetch app usage data
- [ ] Pickup/usage counts
- [ ] Categorize apps (productivity vs entertainment)
- [ ] Calculate focus sessions
- [ ] Detect app switches

### Phase 5: Database Sync (8 tasks)
- [ ] Create sync service for health data
- [ ] Implement POST /api/health/sync integration
- [ ] Create sync service for screen time
- [ ] Implement POST /api/screentime/sync integration
- [ ] Add offline storage (StoreKit)
- [ ] Queue failed syncs for retry
- [ ] Background sync every 5 minutes
- [ ] Sync on app open/resume

### Phase 6: Dashboard Integration (6 tasks)
- [ ] Test API endpoints with real data
- [ ] Update HealthMetricsCard to use real data
- [ ] Remove mock data from dashboard
- [ ] Add productivity score card
- [ ] Add focus sessions tracker
- [ ] Add app usage breakdown

### Phase 7: Gamification (5 tasks)
- [ ] Calculate productivity score
- [ ] Display score in dashboard
- [ ] Add score history tracking
- [ ] Create achievements system
- [ ] Add streaks and badges

### Phase 8: Polish & Testing (7 tasks)
- [ ] Error handling for permission denied
- [ ] Graceful degradation if HealthKit unavailable
- [ ] Test sync with dashboard
- - Test on real device with data
- - Verify data accuracy
- - Test background sync
- [ ] Performance optimization
- [ ] Battery usage optimization

## Exit Criteria

1. ✅ Expo project created with all required packages
2. ✅ HealthKit permissions requested and handled
3. ✅ Screen Time API integrated (iOS 15+)
4. ✅ Real health data syncing to dashboard
5. ✅ Real screen time data syncing to dashboard
6. ✅ All mock data removed from dashboard
7. ✅ Productivity score calculated and displayed
8. ✅ Background sync working reliably
9. ✅ Error handling robust
10. ✅ Tested on real iOS device

## Database Schema

**Health Data Collection:**
```typescript
interface HealthData {
  userId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  steps: number;
  stepsGoal: number;
  distance: number; // meters
  activeEnergyBurned: number; // kcal
  heartRate: number; // bpm
  heartRateVariability: number;
  sleepDuration: number; // hours
  sleepGoal: number;
  deepSleep: number; // hours
  remSleep: number; // hours
  workouts: number;
  workoutMinutes: number;
}
```

**Screen Time Data Collection:**
```typescript
interface ScreenTimeData {
  userId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  totalScreenTime: number; // minutes
  productiveTime: number; // minutes
  entertainmentTime: number; // minutes
  focusSessions: number; // count
  appUsage: AppUsage[];
  pickups: number; // device pickups
  notifications: number;
}

interface AppUsage {
  appName: string;
  bundleId: string;
  category: 'productive' | 'entertainment' | 'neutral';
  timeSpent: number; // minutes
  pickups: number;
}
```

**Productivity Score:**
```typescript
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
  streak: number; // consecutive days with score > 70
}
```

## Known Challenges

### HealthKit Permissions
- Users may deny permissions - must handle gracefully
- Permission explanations must be clear
- Need re-prompt flow for denied permissions

### Screen Time API
- Only available on iOS 15+
- Requires explicit user authorization
- Limited to 7 days of historical data

### Background Sync
- iOS limits background execution
- Must use Background Tasks API
- Sync may be delayed due to OS restrictions

### Data Accuracy
- Screen time categories may need manual calibration
- Workout data may be incomplete
- Sleep analysis may have gaps

## Success Metrics

✅ Health data syncing automatically (no manual export)
✅ Screen time data captured and categorized
✅ Dashboard shows real data (no mocks)
✅ Productivity score accurately calculated
✅ Background sync working reliably
✅ Battery usage acceptable (<5% per day)
✅ Error handling robust for permissions/sync failures

## Next Steps After Completion

1. Deploy to TestFlight for beta testing
2. Test on multiple iOS devices
3. Calibrate app categorization
4. Refine productivity score formula
5. Add Android support (Google Fit, Digital Wellbeing)
6. Create user onboarding flow
7. Add data visualization in app
8. Implement achievements and badges

## Important Notes

- This app replaces ALL mocked health data
- Dashboard becomes fully data-driven
- Scores are calculated from real user behavior
- Privacy-first: data stays on device, only aggregated metrics synced
- GDPR/HIPAA compliant (health data is sensitive)
- Background sync respects iOS limitations

---
**Status:** Ready to build
**Priority:** HIGH - Core dashboard functionality depends on this
**Estimated Time:** 3-5 hours for Ralph autonomous development
