import { HealthData, ScreenTimeData, ProductivityScore } from '../types/health';

export class ProductivityScoreService {
  calculateScore(healthData: Partial<HealthData>, screenTimeData?: ScreenTimeData | null): ProductivityScore {
    const baseScore = 50;

    // Step Bonus (up to +20)
    const stepsScore = this.calculateStepsScore(healthData.steps || 0);

    // Sleep Bonus (up to +15)
    const sleepScore = this.calculateSleepScore(healthData.sleepDuration || 0);

    // Focus Bonus (up to +15)
    const focusScore = this.calculateFocusScore(screenTimeData?.focusSessions || 0);

    // Workout Bonus (up to +10)
    const workoutScore = this.calculateWorkoutScore(
      healthData.workouts || 0,
      healthData.workoutMinutes || 0
    );

    // Calculate total score
    let totalScore = baseScore + stepsScore + sleepScore + focusScore + workoutScore;

    // Apply penalties
    if ((healthData.steps || 0) < 5000) {
      totalScore -= 10;
    }
    if ((healthData.sleepDuration || 0) < 6) {
      totalScore -= 10;
    }
    if ((healthData.workouts || 0) === 0) {
      totalScore -= 5;
    }

    // Clamp score between 0 and 100
    totalScore = Math.max(0, Math.min(100, totalScore));

    return {
      userId: 'user-1', // Would come from auth
      date: healthData.date || new Date().toISOString().split('T')[0],
      score: totalScore,
      breakdown: {
        stepsScore,
        sleepScore,
        focusScore,
        workoutScore,
      },
      streak: 0, // Would be calculated from historical data
    };
  }

  private calculateStepsScore(steps: number): number {
    if (steps >= 10000) return 20;
    if (steps >= 7500) return 15;
    if (steps >= 5000) return 10;
    return 0;
  }

  private calculateSleepScore(sleepHours: number): number {
    if (sleepHours >= 8) return 15;
    if (sleepHours >= 7) return 10;
    if (sleepHours >= 6) return 5;
    return 0;
  }

  private calculateFocusScore(focusSessions: number): number {
    if (focusSessions >= 4) return 15;
    if (focusSessions >= 2) return 10;
    if (focusSessions >= 1) return 5;
    return 0;
  }

  private calculateWorkoutScore(workouts: number, minutes: number): number {
    if (workouts === 0) return 0;

    let score = 10; // Base score for any workout

    // Bonus for longer workouts
    if (minutes >= 60) {
      score += 5;
    } else if (minutes >= 30) {
      score += 3;
    }

    return Math.min(20, score); // Cap at 20
  }

  getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FFC107'; // Amber
    if (score >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  async getStreak(userId: string, currentDate: string): Promise<number> {
    // Calculate streak of consecutive days with score > 70
    // This would query the database for historical scores

    // Placeholder implementation
    // In production, you'd:
    // 1. Query database for last 30 days of scores
    // 2. Count consecutive days with score > 70
    // 3. Return the streak count

    return 0;
  }
}
