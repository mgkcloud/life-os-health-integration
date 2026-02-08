import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { VitalityScoreService, VitalityScore } from '../services/VitalityScoreService';

export default function VitalityScreen() {
  const [vitality, setVitality] = useState<VitalityScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVitality();
  }, []);

  const loadVitality = async () => {
    try {
      const service = new VitalityScoreService(1995); // Will's birth year
      const score = await service.calculateVitalityScore();
      setVitality(score);
    } catch (error) {
      console.error('Error loading vitality:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgeColor = (agingRate: number) => {
    if (agingRate < 0.9) return '#4CAF50';  // Reversing
    if (agingRate < 1.0) return '#8BC34A';  // Slowing
    if (agingRate < 1.1) return '#FFC107';  // Normal
    return '#F44336';                        // Accelerating
  };

  const getAgeMessage = (agingRate: number) => {
    if (agingRate < 0.9) return 'Reversing aging! 🚀';
    if (agingRate < 1.0) return 'Slowing aging 💪';
    if (agingRate < 1.1) return 'Aging normally';
    return 'Aging faster ⚠️';
  };

  if (isLoading || !vitality) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Calculating vitality...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Main Vitality Score */}
        <View style={styles.mainScoreCard}>
          <Text style={styles.mainScoreLabel}>VITALITY SCORE</Text>
          <Text style={styles.mainScore}>{vitality.score}</Text>
          <View style={[styles.ageBadge, { backgroundColor: getAgeColor(vitality.agingRate) }]}>
            <Text style={styles.ageText}>
              Bio Age: {vitality.biologicalAge} | Real: {vitality.chronologicalAge}
            </Text>
          </View>
          <Text style={[styles.agingRate, { color: getAgeColor(vitality.agingRate) }]}>
            {getAgeMessage(vitality.agingRate)}
          </Text>
          <Text style={styles.agingSubtext}>
            Aging at {vitality.agingRate}x normal rate
          </Text>
        </View>

        {/* Component Scores */}
        <Text style={styles.sectionTitle}>Health Components</Text>
        <View style={styles.componentsGrid}>
          <ComponentCard
            label="HRV"
            value={vitality.components.hrv.value + ' ms'}
            score={vitality.components.hrv.score}
          />
          <ComponentCard
            label="Resting HR"
            value={vitality.components.restingHR.value + ' bpm'}
            score={vitality.components.restingHR.score}
          />
          <ComponentCard
            label="Sleep"
            value={vitality.components.sleepQuality.value + '%'}
            score={vitality.components.sleepQuality.score}
          />
          <ComponentCard
            label="VO2 Max"
            value={vitality.components.vo2maxProxy.value.toFixed(1)}
            score={vitality.components.vo2maxProxy.score}
          />
          <ComponentCard
            label="Activity"
            value={vitality.components.activityLevel.value + ' kcal'}
            score={vitality.components.activityLevel.score}
          />
        </View>

        {/* Recommendations */}
        {vitality.recommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {vitality.recommendations.map((rec, i) => (
              <View key={i} style={[styles.recCard, 
                rec.priority === 'high' && styles.recHigh,
                rec.priority === 'medium' && styles.recMedium,
              ]}>
                <Text style={styles.recType}>
                  {rec.type === 'sleep' ? '😴' : 
                   rec.type === 'exercise' ? '🏃' : 
                   rec.type === 'recovery' ? '🧘' : '🧠'} {rec.type.toUpperCase()}
                </Text>
                <Text style={styles.recMessage}>{rec.message}</Text>
                <Text style={styles.recAction}>{rec.action}</Text>
              </View>
            ))}
          </>
        )}

        {/* Goal */}
        <View style={styles.goalCard}>
          <Text style={styles.goalText}>🎯 Mission: Live to 10,000 Years</Text>
          <Text style={styles.goalSubtext}>
            Current trajectory: {Math.round(90 / vitality.agingRate)} years lifespan
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ComponentCard({ label, value, score }: { label: string; value: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return '#4CAF50';
    if (s >= 60) return '#FFC107';
    return '#F44336';
  };

  return (
    <View style={styles.componentCard}>
      <Text style={styles.componentLabel}>{label}</Text>
      <Text style={styles.componentValue}>{value}</Text>
      <View style={[styles.scoreBar, { backgroundColor: getColor(score) + '30' }]}>
        <View style={[styles.scoreFill, { width: score + '%', backgroundColor: getColor(score) }]} />
      </View>
      <Text style={[styles.componentScore, { color: getColor(score) }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  loadingText: { color: '#fff', fontSize: 18 },
  mainScoreCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  mainScoreLabel: { color: '#888', fontSize: 14, letterSpacing: 2, marginBottom: 8 },
  mainScore: { color: '#fff', fontSize: 96, fontWeight: 'bold' },
  ageBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  ageText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  agingRate: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  agingSubtext: { color: '#666', fontSize: 14, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  componentsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  componentCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  componentLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  componentValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  scoreBar: { height: 6, borderRadius: 3, marginBottom: 4 },
  scoreFill: { height: '100%', borderRadius: 3 },
  componentScore: { fontSize: 14, fontWeight: '600' },
  recCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#666',
  },
  recHigh: { borderLeftColor: '#F44336' },
  recMedium: { borderLeftColor: '#FFC107' },
  recType: { color: '#888', fontSize: 12, marginBottom: 4 },
  recMessage: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  recAction: { color: '#aaa', fontSize: 14 },
  goalCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  goalText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  goalSubtext: { color: '#888', fontSize: 14, marginTop: 8 },
});
