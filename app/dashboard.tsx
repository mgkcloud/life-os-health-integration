import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { SyncService } from '../services/SyncService';
import { ProductivityScoreService } from '../services/ProductivityScoreService';
import { HealthData, ProductivityScore, SyncState } from '../types/health';

export default function DashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [productivityScore, setProductivityScore] = useState<ProductivityScore | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    lastSync: null,
    isSyncing: false,
    error: null,
  });

  const syncService = new SyncService();
  const productivityScoreService = new ProductivityScoreService();

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      await syncService.initialize();
      await loadData();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setSyncState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [health, score, sync] await Promise.all([
        syncService.getLastHealthData(),
        syncService.getLastProductivityScore(),
        syncService.getSyncState(),
      ]);

      setHealthData(health);
      setProductivityScore(score);
      setSyncState(sync);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSync = async () => {
    setIsRefreshing(true);
    try {
      const sync = await syncService.syncNow();
      setSyncState(sync);

      if (!sync.error) {
        await loadData();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    handleSync();
  }, []);

  const formatSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    return productivityScoreService.getScoreColor(score);
  };

  const getScoreLabel = (score: number) => {
    return productivityScoreService.getScoreLabel(score);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading health data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello!</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.syncButton,
              syncState.isSyncing && styles.syncButtonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSync}
            disabled={syncState.isSyncing}
          >
            {syncState.isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.syncButtonText}>Sync</Text>
            )}
          </Pressable>
        </View>

        {/* Sync Status */}
        <View style={styles.syncStatusCard}>
          <Text style={styles.syncStatusText}>
            Last synced: {formatSyncTime(syncState.lastSync)}
          </Text>
          {syncState.error && (
            <Text style={styles.errorText}>⚠️ {syncState.error}</Text>
          )}
        </View>

        {/* Productivity Score Card */}
        {productivityScore && (
          <View style={[styles.scoreCard, { borderLeftColor: getScoreColor(productivityScore.score) }]}>
            <Text style={styles.scoreLabel}>Productivity Score</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: getScoreColor(productivityScore.score) }]}>
                {productivityScore.score}
              </Text>
              <View style={styles.scoreMeta}>
                <Text style={[styles.scoreLabelText, { color: getScoreColor(productivityScore.score) }]}>
                  {getScoreLabel(productivityScore.score)}
                </Text>
                {productivityScore.streak > 0 && (
                  <Text style={styles.streakText}>
                    🔥 {productivityScore.streak} day streak
                  </Text>
                )}
              </View>
            </View>

            {/* Score Breakdown */}
            <View style={styles.breakdownContainer}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Steps</Text>
                <Text style={styles.breakdownValue}>+{productivityScore.breakdown.stepsScore}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Sleep</Text>
                <Text style={styles.breakdownValue}>+{productivityScore.breakdown.sleepScore}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Focus</Text>
                <Text style={styles.breakdownValue}>+{productivityScore.breakdown.focusScore}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Workout</Text>
                <Text style={styles.breakdownValue}>+{productivityScore.breakdown.workoutScore}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Health Metrics Grid */}
        {healthData && (
          <View style={styles.metricsGrid}>
            {/* Steps */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Steps</Text>
              <Text style={styles.metricValue}>{healthData.steps.toLocaleString()}</Text>
              <Text style={styles.metricGoal}>
                Goal: {healthData.stepsGoal.toLocaleString()}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((healthData.steps / healthData.stepsGoal) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Sleep */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Sleep</Text>
              <Text style={styles.metricValue}>{healthData.sleepDuration.toFixed(1)}h</Text>
              <Text style={styles.metricGoal}>
                Goal: {healthData.sleepGoal}h
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((healthData.sleepDuration / healthData.sleepGoal) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Heart Rate */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Heart Rate</Text>
              <Text style={styles.metricValue}>{healthData.heartRate} bpm</Text>
              <Text style={styles.metricSubtext}>Latest reading</Text>
            </View>

            {/* Workouts */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Workouts</Text>
              <Text style={styles.metricValue}>{healthData.workouts}</Text>
              <Text style={styles.metricSubtext}>{healthData.workoutMinutes} min</Text>
            </View>

            {/* Distance */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Distance</Text>
              <Text style={styles.metricValue}>{(healthData.distance / 1000).toFixed(2)} km</Text>
              <Text style={styles.metricSubtext}>Walking/Running</Text>
            </View>

            {/* Active Energy */}
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Energy</Text>
              <Text style={styles.metricValue}>{healthData.activeEnergyBurned} kcal</Text>
              <Text style={styles.metricSubtext}>Active burned</Text>
            </View>
          </View>
        )}

        {/* No Data Message */}
        {!healthData && !productivityScore && (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>No health data available yet.</Text>
            <Text style={styles.noDataSubtext}>Pull to refresh to sync your data.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  syncStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  syncStatusText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 16,
  },
  scoreMeta: {
    flex: 1,
  },
  scoreLabelText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: '#FF9800',
  },
  breakdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  metricGoal: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#999',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  noDataCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
