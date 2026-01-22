import * as AppleHealthKit from 'expo-health';
import { HealthData } from '../types/health';

export class HealthKitService {
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      const isAvailable = await AppleHealthKit.isHealthDataAvailable();

      if (!isAvailable) {
        console.log('HealthKit is not available on this device');
        return false;
      }

      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Workouts,
          ],
          write: [],
        },
      } as const;

      const result = await AppleHealthKit.initHealthKit(permissions);

      if (result === 'Success') {
        this.isInitialized = true;
        return true;
      }

      return false;
    } catch (error) {
      console.error('HealthKit initialization error:', error);
      return false;
    }
  }

  async getSteps(date: Date = new Date()): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const options = {
      date: date.toISOString(),
      includeManuallyAdded: true,
    };

    try {
      const result = await AppleHealthKit.getStepCount(options);
      return result.value || 0;
    } catch (error) {
      console.error('Error fetching steps:', error);
      return 0;
    }
  }

  async getDistance(date: Date = new Date()): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const options = {
      date: date.toISOString(),
      unit: 'meter',
    };

    try {
      const result = await AppleHealthKit.getDistanceWalkingRunning(options);
      return result.value || 0;
    } catch (error) {
      console.error('Error fetching distance:', error);
      return 0;
    }
  }

  async getActiveEnergy(date: Date = new Date()): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const options = {
      date: date.toISOString(),
      unit: 'kilocalorie',
    };

    try {
      const result = await AppleHealthKit.getActiveEnergyBurned(options);
      return result.value || 0;
    } catch (error) {
      console.error('Error fetching active energy:', error);
      return 0;
    }
  }

  async getHeartRate(date: Date = new Date()): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const options = {
      date: date.toISOString(),
      unit: 'bpm',
      limit: 1,
    };

    try {
      const results = await AppleHealthKit.getHeartRateSamples(options);
      return results[0]?.value || 0;
    } catch (error) {
      console.error('Error fetching heart rate:', error);
      return 0;
    }
  }

  async getSleepAnalysis(date: Date = new Date()): Promise<{
    duration: number;
    deepSleep: number;
    remSleep: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    try {
      const results = await AppleHealthKit.getSleepSamples(options);

      // Calculate total sleep duration (in hours)
      let totalDuration = 0;
      let deepSleep = 0;
      let remSleep = 0;

      for (const sample of results) {
        if (sample.startDate && sample.endDate) {
          const start = new Date(sample.startDate);
          const end = new Date(sample.endDate);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
          totalDuration += duration;

          // Note: HealthKit doesn't always provide detailed sleep stages
          // This is a simplified approach
          if (sample.value === 'asleep') {
            // Assuming baseline sleep
          }
        }
      }

      return {
        duration: totalDuration,
        deepSleep: totalDuration * 0.2, // Approximate 20% deep sleep
        remSleep: totalDuration * 0.25, // Approximate 25% REM sleep
      };
    } catch (error) {
      console.error('Error fetching sleep analysis:', error);
      return {
        duration: 0,
        deepSleep: 0,
        remSleep: 0,
      };
    }
  }

  async getWorkouts(date: Date = new Date()): Promise<{
    count: number;
    minutes: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('HealthKit not initialized');
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    try {
      const results = await AppleHealthKit.getWorkouts(options);

      let totalMinutes = 0;
      for (const workout of results) {
        if (workout.startDate && workout.endDate) {
          const start = new Date(workout.startDate);
          const end = new Date(workout.endDate);
          const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
          totalMinutes += duration;
        }
      }

      return {
        count: results.length,
        minutes: totalMinutes,
      };
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return {
        count: 0,
        minutes: 0,
      };
    }
  }

  async getTodayHealthData(): Promise<Partial<HealthData>> {
    const today = new Date();

    const [steps, distance, activeEnergy, heartRate, sleep, workouts] =
      await Promise.all([
        this.getSteps(today),
        this.getDistance(today),
        this.getActiveEnergy(today),
        this.getHeartRate(today),
        this.getSleepAnalysis(today),
        this.getWorkouts(today),
      ]);

    return {
      timestamp: new Date().toISOString(),
      date: today.toISOString().split('T')[0],
      steps,
      stepsGoal: 10000,
      distance,
      activeEnergyBurned: activeEnergy,
      heartRate,
      heartRateVariability: 0, // Not always available
      sleepDuration: sleep.duration,
      sleepGoal: 8,
      deepSleep: sleep.deepSleep,
      remSleep: sleep.remSleep,
      workouts: workouts.count,
      workoutMinutes: workouts.minutes,
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}
