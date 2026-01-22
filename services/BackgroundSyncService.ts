import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { SyncService } from './SyncService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

export class BackgroundSyncService {
  private syncService: SyncService;
  private isEnabled = false;

  constructor() {
    this.syncService = new SyncService();
  }

  async initialize(): Promise<void> {
    try {
      // Define background task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          const now = Date.now();
          console.log('Background sync triggered:', new Date(now).toISOString());

          // Perform sync
          await this.syncService.initialize();
          const syncState = await this.syncService.syncNow();

          if (syncState.error) {
            console.error('Background sync error:', syncState.error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
          }

          // Save last background sync time
          await AsyncStorage.setItem('lastBackgroundSync', new Date(now).toISOString());

          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background task error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background fetch
      const status = await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 5 * 60, // 5 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      if (status === BackgroundFetch.BackgroundFetchStatus.Registered) {
        this.isEnabled = true;
        console.log('Background sync registered successfully');
      } else {
        console.log('Background sync status:', status);
      }
    } catch (error) {
      console.error('Error initializing background sync:', error);
    }
  }

  async getStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return status;
    } catch (error) {
      console.error('Error getting background sync status:', error);
      return null;
    }
  }

  async isEnabled(): Promise<boolean> {
    return this.isEnabled;
  }

  async disable(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isEnabled = false;
      console.log('Background sync disabled');
    } catch (error) {
      console.error('Error disabling background sync:', error);
    }
  }

  async getLastBackgroundSync(): Promise<string | null> {
    try {
      const lastSync = await AsyncStorage.getItem('lastBackgroundSync');
      return lastSync;
    } catch (error) {
      console.error('Error getting last background sync:', error);
      return null;
    }
  }

  // Manual sync on app state changes
  async syncOnAppOpen(): Promise<void> {
    try {
      await this.syncService.initialize();

      const lastSync = await this.getLastBackgroundSync();
      const now = new Date();
      let shouldSync = true;

      // Only sync if it's been more than 5 minutes since last sync
      if (lastSync) {
        const lastSyncDate = new Date(lastSync);
        const diff = now.getTime() - lastSyncDate.getTime();
        shouldSync = diff > 5 * 60 * 1000; // 5 minutes
      }

      if (shouldSync) {
        console.log('Syncing on app open');
        await this.syncService.syncNow();
      }
    } catch (error) {
      console.error('Error syncing on app open:', error);
    }
  }
}

// Note: Background sync limitations on iOS:
// - iOS limits background execution time
// - Sync may be delayed due to OS restrictions
// - User must enable Background App Refresh in Settings
// - Battery saver mode can prevent background sync
//
// Best practices:
// - Keep background tasks under 30 seconds
// - Don't fetch large amounts of data
// - Use incremental sync (only fetch new/changed data)
// - Handle failures gracefully and retry on next app open
