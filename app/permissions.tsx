import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { HealthKitService } from '../services/HealthKitService';
import { ScreenTimeService } from '../services/ScreenTimeService';
import { PermissionStatus } from '../types/health';

export default function PermissionsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [healthKitStatus, setHealthKitStatus] = useState<PermissionStatus>('not_requested');
  const [screenTimeStatus, setScreenTimeStatus] = useState<PermissionStatus>('not_requested');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    try {
      const savedHealthKitStatus = await SecureStore.getItemAsync('healthKitPermission');
      const savedScreenTimeStatus = await SecureStore.getItemAsync('screenTimePermission');

      if (savedHealthKitStatus) {
        setHealthKitStatus(savedHealthKitStatus as PermissionStatus);
      }
      if (savedScreenTimeStatus) {
        setScreenTimeStatus(savedScreenTimeStatus as PermissionStatus);
      }

      // If all permissions granted, skip to dashboard
      if (savedHealthKitStatus === 'granted' && savedScreenTimeStatus === 'granted') {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestHealthKitPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const healthKitService = new HealthKitService();
      const success = await healthKitService.initialize();

      if (success) {
        setHealthKitStatus('granted');
        await SecureStore.setItemAsync('healthKitPermission', 'granted');
      } else {
        setHealthKitStatus('denied');
        await SecureStore.setItemAsync('healthKitPermission', 'denied');
      }
    } catch (error) {
      console.error('HealthKit permission error:', error);
      setHealthKitStatus('denied');
      setError('Failed to request HealthKit permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestScreenTimePermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const screenTimeService = new ScreenTimeService();
      const success = await screenTimeService.initialize();

      if (success) {
        setScreenTimeStatus('granted');
        await SecureStore.setItemAsync('screenTimePermission', 'granted');
      } else {
        // Screen Time might not be available, but we can still proceed
        setScreenTimeStatus('granted');
        await SecureStore.setItemAsync('screenTimePermission', 'granted');
      }
    } catch (error) {
      console.error('Screen Time permission error:', error);
      // Don't block on Screen Time errors
      setScreenTimeStatus('granted');
      await SecureStore.setItemAsync('screenTimePermission', 'granted');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    try {
      await SecureStore.setItemAsync('hasCompletedOnboarding', 'true');
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const canContinue = healthKitStatus === 'granted' && screenTimeStatus === 'granted';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Life OS Health</Text>
        <Text style={styles.subtitle}>
          We need access to your health data to calculate your productivity score and sync
          with your dashboard.
        </Text>

        {/* HealthKit Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <Text style={styles.permissionTitle}>HealthKit</Text>
            {healthKitStatus === 'granted' && (
              <Text style={styles.grantedBadge}>✓ Granted</Text>
            )}
            {healthKitStatus === 'denied' && (
              <Text style={styles.deniedBadge}>✗ Denied</Text>
            )}
          </View>
          <Text style={styles.permissionDescription}>
            We'll read your steps, sleep, heart rate, and workout data to calculate your
            productivity score.
          </Text>
          <Text style={styles.dataTypes}>Data types:</Text>
          <Text style={styles.dataType}>• Steps</Text>
          <Text style={styles.dataType}>• Sleep analysis</Text>
          <Text style={styles.dataType}>• Heart rate</Text>
          <Text style={styles.dataType}>• Workouts</Text>
          <Text style={styles.dataType}>• Active energy</Text>

          {healthKitStatus !== 'granted' && (
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={requestHealthKitPermission}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {healthKitStatus === 'denied' ? 'Retry' : 'Grant Permission'}
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Screen Time Permission */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <Text style={styles.permissionTitle}>Screen Time</Text>
            {screenTimeStatus === 'granted' && (
              <Text style={styles.grantedBadge}>✓ Granted</Text>
            )}
            {screenTimeStatus === 'denied' && (
              <Text style={styles.deniedBadge}>✗ Denied</Text>
            )}
          </View>
          <Text style={styles.permissionDescription}>
            We'll read your app usage to detect focus sessions and categorize productive vs.
            entertainment time.
          </Text>
          <Text style={styles.dataTypes}>Data types:</Text>
          <Text style={styles.dataType}>• App usage time</Text>
          <Text style={styles.dataType}>• Device pickups</Text>
          <Text style={styles.dataType}>• Focus sessions</Text>

          {screenTimeStatus !== 'granted' && (
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
              onPress={requestScreenTimePermission}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {screenTimeStatus === 'denied' ? 'Retry' : 'Grant Permission'}
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Continue Button */}
        {canContinue && (
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
          </Pressable>
        )}

        {/* Skip Option */}
        {!canContinue && (
          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </Pressable>
        )}

        <Text style={styles.privacyNote}>
          Your data stays on your device and is encrypted. Only aggregated metrics are synced
          to your dashboard.
        </Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  dataTypes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 12,
    marginBottom: 8,
  },
  dataType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    marginLeft: 8,
  },
  grantedBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  deniedBadge: {
    backgroundColor: '#F44336',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  privacyNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
