/**
 * Core Metrics Module
 * Handles eye health calculations, scoring, and data aggregation
 */

import { EyeMetrics, UserStatus, BreakSession, EyeHealthScore } from '../../types/index';

/**
 * Eye Health Scoring System
 * Calculates a comprehensive score (0-100) based on multiple factors
 */
export class EyeHealthScorer {
  private static readonly WEIGHTS = {
    EAR: 0.25,        // Eye Aspect Ratio
    PERCLOS: 0.30,    // Percentage of Eye Closure
    BLINK_RATE: 0.20, // Blink frequency
    POSTURE: 0.15,    // Head posture
    FATIGUE: 0.10     // Overall fatigue index
  };

  private static readonly THRESHOLDS = {
    EAR: {
      EXCELLENT: 0.25,
      GOOD: 0.22,
      FAIR: 0.18,
      POOR: 0.15
    },
    PERCLOS: {
      EXCELLENT: 0.15,
      GOOD: 0.20,
      FAIR: 0.30,
      POOR: 0.40
    },
    BLINK_RATE: {
      EXCELLENT: { min: 15, max: 20 },
      GOOD: { min: 12, max: 25 },
      FAIR: { min: 8, max: 30 },
      POOR: { min: 0, max: 50 }
    }
  };

  /**
   * Calculate overall eye health score
   */
  static calculateScore(metrics: EyeMetrics[]): EyeHealthScore {
    if (metrics.length === 0) {
      return {
        overall: 50,
        components: {
          eyeStrain: 50,
          blinkHealth: 50,
          postureHealth: 50,
          fatigueLevel: 50
        },
        trend: 'stable',
        recommendations: ['Start monitoring your eye health']
      };
    }

    const latest = metrics[metrics.length - 1];
    const avgMetrics = this.calculateAverages(metrics.slice(-10)); // Last 10 readings

    const eyeStrainScore = this.calculateEyeStrainScore(avgMetrics.earValue, avgMetrics.perclosValue);
    const blinkHealthScore = this.calculateBlinkHealthScore(avgMetrics.blinkRate);
    const postureScore = this.calculatePostureScore(latest.posture);
    const fatigueScore = 100 - (avgMetrics.fatigueIndex * 100);

    const overall = Math.round(
      eyeStrainScore * this.WEIGHTS.EAR +
      eyeStrainScore * this.WEIGHTS.PERCLOS +
      blinkHealthScore * this.WEIGHTS.BLINK_RATE +
      postureScore * this.WEIGHTS.POSTURE +
      fatigueScore * this.WEIGHTS.FATIGUE
    );

    const trend = this.calculateTrend(metrics);
    const recommendations = this.generateRecommendations({
      eyeStrain: eyeStrainScore,
      blinkHealth: blinkHealthScore,
      postureHealth: postureScore,
      fatigueLevel: fatigueScore
    });

    return {
      overall: Math.max(0, Math.min(100, overall)),
      components: {
        eyeStrain: eyeStrainScore,
        blinkHealth: blinkHealthScore,
        postureHealth: postureScore,
        fatigueLevel: fatigueScore
      },
      trend,
      recommendations
    };
  }

  private static calculateAverages(metrics: EyeMetrics[]) {
    const sum = metrics.reduce((acc, m) => ({
      earValue: acc.earValue + m.earValue,
      perclosValue: acc.perclosValue + m.perclosValue,
      blinkRate: acc.blinkRate + m.blinkRate,
      fatigueIndex: acc.fatigueIndex + m.fatigueIndex
    }), { earValue: 0, perclosValue: 0, blinkRate: 0, fatigueIndex: 0 });

    const count = metrics.length;
    return {
      earValue: sum.earValue / count,
      perclosValue: sum.perclosValue / count,
      blinkRate: sum.blinkRate / count,
      fatigueIndex: sum.fatigueIndex / count
    };
  }

  private static calculateEyeStrainScore(earValue: number, perclosValue: number): number {
    const earScore = this.scoreByThreshold(earValue, this.THRESHOLDS.EAR, true);
    const perclosScore = this.scoreByThreshold(perclosValue, this.THRESHOLDS.PERCLOS, false);
    return Math.round((earScore + perclosScore) / 2);
  }

  private static calculateBlinkHealthScore(blinkRate: number): number {
    const thresholds = this.THRESHOLDS.BLINK_RATE;
    
    if (blinkRate >= thresholds.EXCELLENT.min && blinkRate <= thresholds.EXCELLENT.max) {
      return 90;
    } else if (blinkRate >= thresholds.GOOD.min && blinkRate <= thresholds.GOOD.max) {
      return 75;
    } else if (blinkRate >= thresholds.FAIR.min && blinkRate <= thresholds.FAIR.max) {
      return 60;
    } else {
      return 40;
    }
  }

  private static calculatePostureScore(posture: string): number {
    switch (posture) {
      case 'excellent': return 95;
      case 'good': return 80;
      case 'fair': return 65;
      case 'poor': return 45;
      case 'very_poor': return 25;
      default: return 50;
    }
  }

  private static scoreByThreshold(
    value: number, 
    thresholds: any, 
    higherIsBetter: boolean
  ): number {
    if (higherIsBetter) {
      if (value >= thresholds.EXCELLENT) return 90;
      if (value >= thresholds.GOOD) return 75;
      if (value >= thresholds.FAIR) return 60;
      return 40;
    } else {
      if (value <= thresholds.EXCELLENT) return 90;
      if (value <= thresholds.GOOD) return 75;
      if (value <= thresholds.FAIR) return 60;
      return 40;
    }
  }

  private static calculateTrend(metrics: EyeMetrics[]): 'improving' | 'stable' | 'declining' {
    if (metrics.length < 5) return 'stable';

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);
    
    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, m) => sum + (1 - m.fatigueIndex), 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + (1 - m.fatigueIndex), 0) / older.length;

    const difference = recentAvg - olderAvg;
    
    if (difference > 0.05) return 'improving';
    if (difference < -0.05) return 'declining';
    return 'stable';
  }

  private static generateRecommendations(scores: {
    eyeStrain: number;
    blinkHealth: number;
    postureHealth: number;
    fatigueLevel: number;
  }): string[] {
    const recommendations: string[] = [];

    if (scores.eyeStrain < 60) {
      recommendations.push('Take more frequent breaks to reduce eye strain');
      recommendations.push('Adjust screen brightness and contrast');
    }

    if (scores.blinkHealth < 60) {
      recommendations.push('Practice conscious blinking exercises');
      recommendations.push('Use artificial tears if eyes feel dry');
    }

    if (scores.postureHealth < 60) {
      recommendations.push('Improve your sitting posture');
      recommendations.push('Adjust monitor height to eye level');
    }

    if (scores.fatigueLevel < 60) {
      recommendations.push('Get adequate sleep (7-9 hours)');
      recommendations.push('Take longer breaks between work sessions');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Keep maintaining healthy eye habits');
    }

    return recommendations;
  }
}

/**
 * Daily KPI Calculator
 * Aggregates daily metrics and calculates key performance indicators
 */
export class DailyKPICalculator {
  /**
   * Calculate daily KPIs from metrics and break sessions
   */
  static calculateDailyKPIs(
    metrics: EyeMetrics[],
    breakSessions: BreakSession[],
    date: Date = new Date()
  ) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Filter data for the specific day
    const dayMetrics = metrics.filter(m => {
      const metricDate = new Date(m.timestamp);
      return metricDate >= dayStart && metricDate <= dayEnd;
    });

    const dayBreaks = breakSessions.filter(b => {
      const breakDate = new Date(b.startTime);
      return breakDate >= dayStart && breakDate <= dayEnd;
    });

    // Calculate screen time (approximate from metrics frequency)
    const screenTimeMinutes = dayMetrics.length > 0 
      ? Math.round((dayMetrics.length * 30) / 60) // Assuming 30-second intervals
      : 0;

    // Calculate break statistics
    const totalBreaks = dayBreaks.length;
    const completedBreaks = dayBreaks.filter(b => b.completed).length;
    const totalBreakTime = dayBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);

    // Calculate average metrics
    const avgMetrics = dayMetrics.length > 0 ? {
      earValue: dayMetrics.reduce((sum, m) => sum + m.earValue, 0) / dayMetrics.length,
      perclosValue: dayMetrics.reduce((sum, m) => sum + m.perclosValue, 0) / dayMetrics.length,
      blinkRate: dayMetrics.reduce((sum, m) => sum + m.blinkRate, 0) / dayMetrics.length,
      fatigueIndex: dayMetrics.reduce((sum, m) => sum + m.fatigueIndex, 0) / dayMetrics.length
    } : null;

    // Calculate eye health score
    const eyeHealthScore = EyeHealthScorer.calculateScore(dayMetrics);

    return {
      date: date.toISOString().split('T')[0],
      screenTime: screenTimeMinutes,
      totalBreaks,
      completedBreaks,
      breakCompletionRate: totalBreaks > 0 ? (completedBreaks / totalBreaks) * 100 : 0,
      totalBreakTime,
      averageMetrics: avgMetrics,
      eyeHealthScore: eyeHealthScore.overall,
      recommendations: eyeHealthScore.recommendations,
      alerts: this.generateAlerts(avgMetrics, totalBreaks, screenTimeMinutes)
    };
  }

  private static generateAlerts(
    avgMetrics: any,
    totalBreaks: number,
    screenTime: number
  ): string[] {
    const alerts: string[] = [];

    if (screenTime > 480) { // More than 8 hours
      alerts.push('Excessive screen time detected');
    }

    if (totalBreaks < 3 && screenTime > 120) { // Less than 3 breaks in 2+ hours
      alerts.push('Take more frequent breaks');
    }

    if (avgMetrics && avgMetrics.fatigueIndex > 0.7) {
      alerts.push('High fatigue levels detected');
    }

    if (avgMetrics && avgMetrics.perclosValue > 0.3) {
      alerts.push('Excessive eye closure detected');
    }

    return alerts;
  }
}

/**
 * Weekly Summary Generator
 * Creates weekly summaries and trends
 */
export class WeeklySummaryGenerator {
  /**
   * Generate weekly summary data
   */
  static generateWeeklySummary(
    metrics: EyeMetrics[],
    breakSessions: BreakSession[],
    weekStart: Date
  ) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Generate daily KPIs for each day of the week
    const dailyKPIs = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(currentDay.getDate() + i);
      
      const dayKPIs = DailyKPICalculator.calculateDailyKPIs(
        metrics,
        breakSessions,
        currentDay
      );
      
      dailyKPIs.push(dayKPIs);
    }

    // Calculate weekly aggregates
    const totalScreenTime = dailyKPIs.reduce((sum, day) => sum + day.screenTime, 0);
    const totalBreaks = dailyKPIs.reduce((sum, day) => sum + day.totalBreaks, 0);
    const avgEyeHealthScore = dailyKPIs.reduce((sum, day) => sum + day.eyeHealthScore, 0) / 7;
    
    // Calculate trends
    const eyeHealthTrend = this.calculateWeeklyTrend(
      dailyKPIs.map(day => day.eyeHealthScore)
    );
    
    const screenTimeTrend = this.calculateWeeklyTrend(
      dailyKPIs.map(day => day.screenTime)
    );

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dailyKPIs,
      summary: {
        totalScreenTime,
        avgDailyScreenTime: Math.round(totalScreenTime / 7),
        totalBreaks,
        avgEyeHealthScore: Math.round(avgEyeHealthScore),
        eyeHealthTrend,
        screenTimeTrend
      },
      insights: this.generateWeeklyInsights(dailyKPIs)
    };
  }

  private static calculateWeeklyTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.1; // 10% threshold

    if (difference > threshold) return 'improving';
    if (difference < -threshold) return 'declining';
    return 'stable';
  }

  private static generateWeeklyInsights(dailyKPIs: any[]): string[] {
    const insights: string[] = [];

    // Find best and worst days
    const bestDay = dailyKPIs.reduce((best, day) => 
      day.eyeHealthScore > best.eyeHealthScore ? day : best
    );
    
    const worstDay = dailyKPIs.reduce((worst, day) => 
      day.eyeHealthScore < worst.eyeHealthScore ? day : worst
    );

    insights.push(`Best eye health day: ${new Date(bestDay.date).toLocaleDateString('en-US', { weekday: 'long' })}`);
    insights.push(`Most challenging day: ${new Date(worstDay.date).toLocaleDateString('en-US', { weekday: 'long' })}`);

    // Screen time insights
    const avgScreenTime = dailyKPIs.reduce((sum, day) => sum + day.screenTime, 0) / 7;
    if (avgScreenTime > 360) { // More than 6 hours average
      insights.push('Consider reducing daily screen time');
    }

    // Break consistency
    const daysWithGoodBreaks = dailyKPIs.filter(day => day.breakCompletionRate > 70).length;
    if (daysWithGoodBreaks < 5) {
      insights.push('Try to maintain consistent break habits throughout the week');
    }

    return insights;
  }
}