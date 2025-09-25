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
    EAR: 0.30,        // Eye Aspect Ratio (increased from 0.25)
    PERCLOS: 0.35,    // Percentage of Eye Closure (increased from 0.30)
    BLINK_RATE: 0.00, // Blink frequency (disabled for real-time scoring)
    POSTURE: 0.25,    // Head posture (increased from 0.15)
    FATIGUE: 0.10     // Overall fatigue index
  };

  private static readonly THRESHOLDS = {
    EAR: {
      EXCELLENT: 0.25,  // Adjusted for real-world values (normal ~0.3, lower threshold for better scoring)
      GOOD: 0.20,
      FAIR: 0.15,
      POOR: 0.10
    },
    PERCLOS: {
      EXCELLENT: 0.15,  // Adjusted for real-world values (lower is better, more lenient)
      GOOD: 0.25,
      FAIR: 0.35,
      POOR: 0.50
    },
    BLINK_RATE: {
      EXCELLENT: { min: 15, max: 20 },
      GOOD: { min: 12, max: 25 },
      FAIR: { min: 8, max: 30 },
      POOR: { min: 0, max: 50 }
    }
  };

  /**
   * Calculate overall eye health score with base score approach
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
    // fatigueIndex is already on 0-100 scale, so we invert it (lower fatigue = higher score)
    const fatigueScore = Math.max(0, Math.min(100, 100 - avgMetrics.fatigueIndex));

    console.log('🔍 EyeHealthScorer: Component scores:', {
      eyeStrainScore,
      blinkHealthScore,
      postureScore,
      fatigueScore,
      avgMetrics,
      latest: latest.posture
    });

    // Base score approach: Start with 50 and add weighted improvements
    const BASE_SCORE = 50;
    const maxPossibleScore = 100;
    const improvementRange = maxPossibleScore - BASE_SCORE; // 50 points to distribute
    
    const weightedImprovement = 
      (eyeStrainScore / 100) * (this.WEIGHTS.EAR + this.WEIGHTS.PERCLOS) * improvementRange +
      (postureScore / 100) * this.WEIGHTS.POSTURE * improvementRange +
      (fatigueScore / 100) * this.WEIGHTS.FATIGUE * improvementRange;
    
    const overall = Math.round(BASE_SCORE + weightedImprovement);

    console.log('🔍 EyeHealthScorer: Base score calculation:', {
      baseScore: BASE_SCORE,
      improvementRange,
      eyeStrainContribution: ((eyeStrainScore / 100) * (this.WEIGHTS.EAR + this.WEIGHTS.PERCLOS) * improvementRange).toFixed(1),
      postureContribution: ((postureScore / 100) * this.WEIGHTS.POSTURE * improvementRange).toFixed(1),
      fatigueContribution: ((fatigueScore / 100) * this.WEIGHTS.FATIGUE * improvementRange).toFixed(1),
      totalImprovement: weightedImprovement.toFixed(1),
      finalScore: overall
    });

    const trend = this.calculateTrend(metrics);
    const recommendations = this.generateRecommendations({
      eyeStrain: eyeStrainScore,
      blinkHealth: blinkHealthScore,
      postureHealth: postureScore,
      fatigueLevel: fatigueScore
    });

    return {
      overall: Math.max(BASE_SCORE, Math.min(100, overall)),
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
    
    // Optimal range is 15-20 blinks per minute
    const optimal = (thresholds.EXCELLENT.min + thresholds.EXCELLENT.max) / 2; // 17.5
    
    if (blinkRate >= thresholds.EXCELLENT.min && blinkRate <= thresholds.EXCELLENT.max) {
      // Perfect range: 95-100
      const deviation = Math.abs(blinkRate - optimal) / (thresholds.EXCELLENT.max - optimal);
      return Math.round(100 - (deviation * 5));
    } else if (blinkRate >= thresholds.GOOD.min && blinkRate <= thresholds.GOOD.max) {
      // Good range: 70-95
      const distance = blinkRate < thresholds.EXCELLENT.min 
        ? (thresholds.EXCELLENT.min - blinkRate) / (thresholds.EXCELLENT.min - thresholds.GOOD.min)
        : (blinkRate - thresholds.EXCELLENT.max) / (thresholds.GOOD.max - thresholds.EXCELLENT.max);
      return Math.round(95 - (distance * 25));
    } else if (blinkRate >= thresholds.FAIR.min && blinkRate <= thresholds.FAIR.max) {
      // Fair range: 40-70
      const distance = blinkRate < thresholds.GOOD.min 
        ? (thresholds.GOOD.min - blinkRate) / (thresholds.GOOD.min - thresholds.FAIR.min)
        : (blinkRate - thresholds.GOOD.max) / (thresholds.FAIR.max - thresholds.GOOD.max);
      return Math.round(70 - (distance * 30));
    } else {
      // Poor range: 0-40
      const maxDistance = Math.max(
        Math.abs(blinkRate - thresholds.FAIR.min),
        Math.abs(blinkRate - thresholds.FAIR.max)
      );
      const normalizedDistance = Math.min(maxDistance / 20, 1); // Cap at reasonable distance
      return Math.round(40 - (normalizedDistance * 40));
    }
  }

  private static calculatePostureScore(posture: string): number {
    // Add some randomization within ranges to create more dynamic scoring
    const randomOffset = () => Math.floor(Math.random() * 6) - 3; // -3 to +3
    
    switch (posture) {
      case 'excellent': return Math.min(100, Math.max(92, 97 + randomOffset()));
      case 'good': return Math.min(91, Math.max(75, 83 + randomOffset()));
      case 'fair': return Math.min(74, Math.max(55, 65 + randomOffset()));
      case 'poor': return Math.min(54, Math.max(25, 40 + randomOffset()));
      case 'very_poor': return Math.min(24, Math.max(0, 15 + randomOffset()));
      default: return Math.min(60, Math.max(40, 50 + randomOffset()));
    }
  }

  private static scoreByThreshold(
    value: number, 
    thresholds: any, 
    higherIsBetter: boolean
  ): number {
    if (higherIsBetter) {
      if (value >= thresholds.EXCELLENT) {
        // Excellent range: 90-100
        const excess = Math.min((value - thresholds.EXCELLENT) / (thresholds.EXCELLENT * 0.2), 1);
        return Math.round(90 + (excess * 10));
      }
      if (value >= thresholds.GOOD) {
        // Good range: 70-90
        const progress = (value - thresholds.GOOD) / (thresholds.EXCELLENT - thresholds.GOOD);
        return Math.round(70 + (progress * 20));
      }
      if (value >= thresholds.FAIR) {
        // Fair range: 40-70
        const progress = (value - thresholds.FAIR) / (thresholds.GOOD - thresholds.FAIR);
        return Math.round(40 + (progress * 30));
      }
      // Poor range: 0-40
      const progress = Math.max(0, value / thresholds.FAIR);
      return Math.round(progress * 40);
    } else {
      if (value <= thresholds.EXCELLENT) {
        // Excellent range: 90-100
        const quality = Math.max(0, 1 - (value / thresholds.EXCELLENT));
        return Math.round(90 + (quality * 10));
      }
      if (value <= thresholds.GOOD) {
        // Good range: 70-90
        const progress = 1 - ((value - thresholds.EXCELLENT) / (thresholds.GOOD - thresholds.EXCELLENT));
        return Math.round(70 + (progress * 20));
      }
      if (value <= thresholds.FAIR) {
        // Fair range: 40-70
        const progress = 1 - ((value - thresholds.GOOD) / (thresholds.FAIR - thresholds.GOOD));
        return Math.round(40 + (progress * 30));
      }
      // Poor range: 0-40
      const degradation = Math.min((value - thresholds.FAIR) / (thresholds.FAIR * 2), 1);
      return Math.round(40 - (degradation * 40));
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