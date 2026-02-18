/**
 * Advanced Health Analytics Library
 * Provides trend analysis, risk scoring, and predictive insights
 */

// ============================================
// Types
// ============================================

export interface DataPoint {
    timestamp: Date | string;
    value: number;
}

export interface TrendAnalysis {
    direction: 'increasing' | 'decreasing' | 'stable';
    slope: number;
    r2: number;
    confidence: number;
    prediction?: number;
}

export interface RiskScore {
    score: number; // 0-100
    level: 'low' | 'moderate' | 'high' | 'critical';
    factors: RiskFactor[];
}

export interface RiskFactor {
    name: string;
    impact: number; // -1 to 1
    description: string;
}

export interface HealthInsight {
    type: 'improvement' | 'warning' | 'critical' | 'info';
    title: string;
    description: string;
    actionable: boolean;
    recommendation?: string;
}

// ============================================
// Trend Analysis
// ============================================

/**
 * Calculate linear regression for trend analysis
 */
export function calculateTrend(data: DataPoint[]): TrendAnalysis {
    if (data.length < 2) {
        return { direction: 'stable', slope: 0, r2: 0, confidence: 0 };
    }

    // Sort by timestamp
    const sorted = [...data].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Convert timestamps to numeric values (days from first point)
    const firstTime = new Date(sorted[0].timestamp).getTime();
    const points = sorted.map(d => ({
        x: (new Date(d.timestamp).getTime() - firstTime) / (1000 * 60 * 60 * 24),
        y: d.value,
    }));

    // Calculate linear regression
    const n = points.length;
    const sumX = points.reduce((acc, p) => acc + p.x, 0);
    const sumY = points.reduce((acc, p) => acc + p.y, 0);
    const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0);
    const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = points.reduce((acc, p) => acc + Math.pow(p.y - yMean, 2), 0);
    const ssResidual = points.reduce((acc, p) => {
        const predicted = slope * p.x + intercept;
        return acc + Math.pow(p.y - predicted, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    // Determine direction
    const absSlope = Math.abs(slope);
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (absSlope < 0.01) {
        direction = 'stable';
    } else {
        direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Calculate confidence based on R-squared and data points
    const confidence = Math.min(r2 * (n / 10), 1);

    // Predict next value (30 days ahead)
    const lastX = points[points.length - 1].x;
    const prediction = slope * (lastX + 30) + intercept;

    return {
        direction,
        slope,
        r2,
        confidence,
        prediction: isFinite(prediction) ? prediction : undefined,
    };
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: DataPoint[], windowSize: number = 7): DataPoint[] {
    if (data.length < windowSize) {
        return data;
    }

    const sorted = [...data].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const result: DataPoint[] = [];
    for (let i = windowSize - 1; i < sorted.length; i++) {
        const window = sorted.slice(i - windowSize + 1, i + 1);
        const avg = window.reduce((acc, d) => acc + d.value, 0) / windowSize;
        result.push({
            timestamp: sorted[i].timestamp,
            value: avg,
        });
    }

    return result;
}

/**
 * Detect anomalies using Z-score method
 */
export function detectAnomalies(data: DataPoint[], threshold: number = 2): DataPoint[] {
    if (data.length < 3) return [];

    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return [];

    return data.filter(d => {
        const zScore = Math.abs((d.value - mean) / stdDev);
        return zScore > threshold;
    });
}

// ============================================
// Risk Scoring
// ============================================

interface BiomarkerRiskConfig {
    name: string;
    optimalMin: number;
    optimalMax: number;
    weight: number;
    unit: string;
}

const BIOMARKER_RISK_CONFIGS: BiomarkerRiskConfig[] = [
    { name: 'glucose', optimalMin: 70, optimalMax: 100, weight: 1.0, unit: 'mg/dL' },
    { name: 'hba1c', optimalMin: 4, optimalMax: 5.6, weight: 1.2, unit: '%' },
    { name: 'cholesterol_total', optimalMin: 0, optimalMax: 200, weight: 0.8, unit: 'mg/dL' },
    { name: 'ldl', optimalMin: 0, optimalMax: 100, weight: 0.9, unit: 'mg/dL' },
    { name: 'hdl', optimalMin: 40, optimalMax: 100, weight: 0.7, unit: 'mg/dL' },
    { name: 'triglycerides', optimalMin: 0, optimalMax: 150, weight: 0.8, unit: 'mg/dL' },
    { name: 'crp', optimalMin: 0, optimalMax: 3, weight: 1.0, unit: 'mg/L' },
    { name: 'creatinine', optimalMin: 0.6, optimalMax: 1.2, weight: 0.9, unit: 'mg/dL' },
    { name: 'blood_pressure_systolic', optimalMin: 90, optimalMax: 120, weight: 1.1, unit: 'mmHg' },
    { name: 'blood_pressure_diastolic', optimalMin: 60, optimalMax: 80, weight: 1.0, unit: 'mmHg' },
];

/**
 * Calculate cardiovascular risk score
 */
export function calculateCardiovascularRisk(biomarkers: Record<string, number>): RiskScore {
    const factors: RiskFactor[] = [];
    let totalRisk = 0;
    let totalWeight = 0;

    for (const config of BIOMARKER_RISK_CONFIGS) {
        const value = biomarkers[config.name];
        if (value === undefined) continue;

        let risk = 0;
        let description = '';

        if (value < config.optimalMin) {
            // Below optimal
            const deviation = (config.optimalMin - value) / config.optimalMin;
            risk = Math.min(deviation * 50, 50);
            description = `${config.name} is below optimal range (${value} ${config.unit})`;
        } else if (value > config.optimalMax) {
            // Above optimal
            const deviation = (value - config.optimalMax) / config.optimalMax;
            risk = Math.min(deviation * 50 + 25, 100);
            description = `${config.name} is above optimal range (${value} ${config.unit})`;
        } else {
            // Within optimal
            description = `${config.name} is within optimal range (${value} ${config.unit})`;
        }

        totalRisk += risk * config.weight;
        totalWeight += config.weight;

        factors.push({
            name: config.name,
            impact: risk / 100,
            description,
        });
    }

    const score = totalWeight > 0 ? Math.round(totalRisk / totalWeight) : 0;

    let level: 'low' | 'moderate' | 'high' | 'critical';
    if (score < 20) level = 'low';
    else if (score < 40) level = 'moderate';
    else if (score < 60) level = 'high';
    else level = 'critical';

    return { score, level, factors };
}

/**
 * Calculate metabolic health score
 */
export function calculateMetabolicHealthScore(biomarkers: Record<string, number>): number {
    const weights: Record<string, { weight: number; optimal: [number, number]; inverse?: boolean }> = {
        glucose: { weight: 1.0, optimal: [70, 100] },
        hba1c: { weight: 1.2, optimal: [4, 5.6] },
        triglycerides: { weight: 0.8, optimal: [0, 150] },
        hdl: { weight: 0.7, optimal: [40, 100], inverse: false },
        waist_circumference: { weight: 0.9, optimal: [0, 40] }, // inches
        blood_pressure_systolic: { weight: 1.0, optimal: [90, 120] },
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [name, config] of Object.entries(weights)) {
        const value = biomarkers[name];
        if (value === undefined) continue;

        let score = 100;
        const [min, max] = config.optimal;

        if (value < min) {
            score = Math.max(0, 100 - (min - value) / min * 100);
        } else if (value > max) {
            score = Math.max(0, 100 - (value - max) / max * 100);
        }

        totalScore += score * config.weight;
        totalWeight += config.weight;
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

// ============================================
// Health Insights Generation
// ============================================

/**
 * Generate health insights from biomarker data
 */
export function generateHealthInsights(
    biomarkers: Record<string, number>,
    trends: Record<string, TrendAnalysis>
): HealthInsight[] {
    const insights: HealthInsight[] = [];

    // Check glucose trends
    if (trends.glucose && biomarkers.glucose) {
        if (trends.glucose.direction === 'increasing' && trends.glucose.confidence > 0.5) {
            insights.push({
                type: 'warning',
                title: 'Rising Glucose Trend',
                description: `Your glucose levels have been trending upward over the analyzed period.`,
                actionable: true,
                recommendation: 'Consider reducing refined carbohydrate intake and increasing physical activity.',
            });
        }
    }

    // Check cardiovascular risk
    const cvRisk = calculateCardiovascularRisk(biomarkers);
    if (cvRisk.level === 'high' || cvRisk.level === 'critical') {
        insights.push({
            type: cvRisk.level === 'critical' ? 'critical' : 'warning',
            title: 'Cardiovascular Risk Alert',
            description: `Your cardiovascular risk score is ${cvRisk.score}/100 (${cvRisk.level}).`,
            actionable: true,
            recommendation: 'Consult with a healthcare provider to discuss your cardiovascular health.',
        });
    }

    // Check metabolic health
    const metabolicScore = calculateMetabolicHealthScore(biomarkers);
    if (metabolicScore >= 80) {
        insights.push({
            type: 'improvement',
            title: 'Excellent Metabolic Health',
            description: `Your metabolic health score is ${metabolicScore}/100. Keep up the good work!`,
            actionable: false,
        });
    } else if (metabolicScore < 50) {
        insights.push({
            type: 'warning',
            title: 'Metabolic Health Needs Attention',
            description: `Your metabolic health score is ${metabolicScore}/100.`,
            actionable: true,
            recommendation: 'Focus on diet quality, regular exercise, and adequate sleep.',
        });
    }

    // Check for anomalies in trends
    for (const [name, trend] of Object.entries(trends)) {
        if (trend.direction !== 'stable' && trend.confidence > 0.7) {
            if (trend.direction === 'increasing' && ['ldl', 'triglycerides', 'glucose', 'crp'].includes(name)) {
                insights.push({
                    type: 'warning',
                    title: `Increasing ${name.toUpperCase()}`,
                    description: `Your ${name} levels show a consistent upward trend.`,
                    actionable: true,
                    recommendation: `Monitor your ${name} levels and consider lifestyle adjustments.`,
                });
            } else if (trend.direction === 'decreasing' && ['hdl', 'vitamin_d', 'iron'].includes(name)) {
                insights.push({
                    type: 'warning',
                    title: `Decreasing ${name.toUpperCase()}`,
                    description: `Your ${name} levels show a consistent downward trend.`,
                    actionable: true,
                    recommendation: `Consider dietary changes or supplementation for ${name}.`,
                });
            }
        }
    }

    return insights;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue === 0 ? 0 : 100;
    return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate variability (coefficient of variation)
 */
export function calculateVariability(data: DataPoint[]): number {
    if (data.length < 2) return 0;

    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean !== 0 ? (stdDev / mean) * 100 : 0;
}

/**
 * Get time-based aggregation
 */
export function aggregateByPeriod(
    data: DataPoint[],
    period: 'day' | 'week' | 'month'
): DataPoint[] {
    if (data.length === 0) return [];

    const grouped = new Map<string, number[]>();

    for (const point of data) {
        const date = new Date(point.timestamp);
        let key: string;

        switch (period) {
            case 'day':
                key = date.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
        }

        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(point.value);
    }

    const result: DataPoint[] = [];
    for (const [key, values] of grouped) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        result.push({
            timestamp: key,
            value: avg,
        });
    }

    return result.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}
