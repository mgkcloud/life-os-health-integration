import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthData, ScreenTimeData, ProductivityScore, SyncState } from '../types/health';
import { HealthKitService } from './HealthKitService';
import { ScreenTimeService } from './ScreenTimeService';
import { ProductivityScoreService } from './ProductivityScoreService';

const API_BASE_URL = 'http://localhost:3000'; // Update with actual dashboard URL

export class SyncService {
  private healthKitService: HealthKitService;
  private screenTimeService: ScreenTimeService;
  private productivityScoreService: ProductivityScoreService;
  private syncQueue: Array<any> = [];

  constructor() {
    this.healthKitService = new HealthKitService();
    this.screenTimeService = new ScreenTimeService();
    this.productivityScoreService = new ProductivityScoreService();
  }

  async initialize(): Promise<void> {
    await this.healthKitService.initialize();
    await this.screenTimeService.initialize();
    await this.loadSyncQueue();
  }

  async syncNow(): Promise<SyncState> {
    try {
      const healthData = await this.healthKitService.getTodayHealthData();
      const screenTimeData = await this.screenTimeService.getScreenTimeData();

      const productivityScore = this.productivityScoreService.calculateScore(
        healthData,
        screenTimeData
      );

      // Sync health data
      await this.syncHealthData(healthData as HealthData);

      // Sync screen time data
      if (screenTimeData) {
        await this.syncScreenTimeData(screenTimeData);
      }

      // Sync productivity score
      await this.syncProductivityScore(productivityScore);

      const syncState: SyncState = {
        lastSync: new Date().toISOString(),
        isSyncing: false,
        error: null,
      };

      await this.saveSyncState(syncState);
      return syncState;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const syncState: SyncState = {
        lastSync: null,
        isSyncing: false,
        error: errorMessage,
      };

      await this.saveSyncState(syncState);

      // Queue for retry
      await this.queueFailedSync({ timestamp: new Date().toISOString(), error: errorMessage });

      return syncState;
    }
  }

  private async syncHealthData(data: HealthData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Health data synced successfully');
    } catch (error) {
      console.error('Error syncing health data:', error);
      throw error;
    }
  }

  private async syncScreenTimeData(data: ScreenTimeData): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/screentime/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Screen time data synced successfully');
    } catch (error) {
      console.error('Error syncing screen time data:', error);
      throw error;
    }
  }

  private async syncProductivityScore(data: ProductivityScore): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/productivity/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Productivity score synced successfully');
    } catch (error) {
      console.error('Error syncing productivity score:', error);
      throw error;
    }
  }

  private async saveSyncState(state: SyncState): Promise<void> {
    try {
      await AsyncStorage.setItem('syncState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  }

  async getSyncState(): Promise<SyncState> {
    try {
      const stateJson = await AsyncStorage.getItem('syncState');
      if (stateJson) {
        return JSON.parse(stateJson);
      }
    } catch (error) {
      console.error('Error loading sync state:', error);
    }

    return {
      lastSync: null,
      isSyncing: false,
      error: null,
    };
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem('syncQueue');
      if (queueJson) {
        this.syncQueue = JSON.parse(queueJson);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async queueFailedSync(item: any): Promise<void> {
    this.syncQueue.push(item);
    try {
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  async retryFailedSyncs(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    console.log(`Retrying ${this.syncQueue.length} failed syncs`);

    // Process queue in order
    for (const item of this.syncQueue) {
      try {
        await this.syncNow();
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(i => i.timestamp !== item.timestamp);
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }

    // Save updated queue
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  async getLastHealthData(): Promise<HealthData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health/latest`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching last health data:', error);
      return null;
    }
  }

  async getLastProductivityScore(): Promise<ProductivityScore | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/productivity/score`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching last productivity score:', error);
      return null;
    }
  }
}
