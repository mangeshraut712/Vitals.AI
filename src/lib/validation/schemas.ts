import { z } from 'zod';

// ============================================
// Biomarker Validation Schemas
// ============================================

export const BiomarkerCategorySchema = z.enum([
    'metabolic',
    'cardiovascular',
    'lipid',
    'liver',
    'kidney',
    'thyroid',
    'vitamins',
    'minerals',
    'hormones',
    'inflammation',
    'blood',
    'other',
]);

export const BiomarkerUnitSchema = z.string().min(1);

export const BiomarkerSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    value: z.number(),
    unit: BiomarkerUnitSchema,
    referenceRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
    }).optional(),
    category: BiomarkerCategorySchema.optional(),
    date: z.string().datetime().or(z.date()).optional(),
    source: z.string().optional(),
    flag: z.enum(['low', 'high', 'normal', 'unknown']).optional(),
});

export const BiomarkerArraySchema = z.array(BiomarkerSchema);

// ============================================
// Body Composition Validation Schemas
// ============================================

export const BodyCompositionSchema = z.object({
    date: z.string().datetime().or(z.date()),
    weight: z.number().positive().optional(),
    bodyFatPercentage: z.number().min(0).max(100).optional(),
    muscleMass: z.number().positive().optional(),
    boneMass: z.number().positive().optional(),
    waterPercentage: z.number().min(0).max(100).optional(),
    visceralFat: z.number().min(0).optional(),
    bmr: z.number().positive().optional(),
    segmental: z.object({
        leftArm: z.number().min(0).max(100).optional(),
        rightArm: z.number().min(0).max(100).optional(),
        leftLeg: z.number().min(0).max(100).optional(),
        rightLeg: z.number().min(0).max(100).optional(),
        trunk: z.number().min(0).max(100).optional(),
    }).optional(),
});

// ============================================
// Vitals Validation Schemas
// ============================================

export const VitalSignSchema = z.object({
    timestamp: z.string().datetime().or(z.date()),
    heartRate: z.number().int().min(30).max(220).optional(),
    bloodPressureSystolic: z.number().int().min(60).max(250).optional(),
    bloodPressureDiastolic: z.number().int().min(40).max(150).optional(),
    hrv: z.number().min(0).optional(),
    spo2: z.number().min(0).max(100).optional(),
    respiratoryRate: z.number().int().min(4).max(60).optional(),
    bodyTemperature: z.number().min(30).max(45).optional(),
});

// ============================================
// Activity & Sleep Validation Schemas
// ============================================

export const ActivitySchema = z.object({
    date: z.string().datetime().or(z.date()),
    steps: z.number().int().min(0).optional(),
    distance: z.number().min(0).optional(),
    calories: z.number().min(0).optional(),
    activeMinutes: z.number().int().min(0).optional(),
    floors: z.number().int().min(0).optional(),
});

export const SleepSessionSchema = z.object({
    date: z.string().datetime().or(z.date()),
    startTime: z.string().datetime().or(z.date()),
    endTime: z.string().datetime().or(z.date()),
    duration: z.number().min(0),
    efficiency: z.number().min(0).max(100).optional(),
    stages: z.object({
        deep: z.number().min(0).optional(),
        light: z.number().min(0).optional(),
        rem: z.number().min(0).optional(),
        awake: z.number().min(0).optional(),
    }).optional(),
});

// ============================================
// API Request/Response Validation Schemas
// ============================================

export const SyncRequestSchema = z.object({
    source: z.enum(['google-fit', 'apple-health', 'fitbit', 'garmin', 'withings', 'oura', 'whoop']),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export const GoalSchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    target: z.number(),
    current: z.number().optional(),
    deadline: z.string().datetime().or(z.date()).optional(),
    status: z.enum(['active', 'completed', 'failed', 'paused']).optional(),
});

export const GoalCreateRequestSchema = z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(2000),
    priority: z.enum(['high', 'medium', 'low']),
    category: z.string().trim().min(1).max(80).optional().default('Other'),
    actionItems: z.array(z.string().trim().min(1).max(280)).min(1).max(12),
});

export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1),
    timestamp: z.string().datetime().optional(),
});

export const ChatRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1),
    context: z.record(z.string(), z.unknown()).optional(),
});

export const ChatPromptRequestSchema = z.object({
    message: z.string().trim().min(1).max(4000),
});

// ============================================
// File Upload Validation Schemas
// ============================================

export const FileUploadSchema = z.object({
    filename: z.string().min(1),
    mimeType: z.enum([
        'application/pdf',
        'text/csv',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/xml',
        'text/xml',
    ]),
    size: z.number().int().max(50 * 1024 * 1024), // 50MB max
});

// ============================================
// Health Event Validation Schemas
// ============================================

export const HealthEventSchema = z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    timestamp: z.string().datetime().or(z.date()),
    value: z.number().optional(),
    unit: z.string().optional(),
    source: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// Utility Functions
// ============================================

export function validateBiomarker(data: unknown) {
    return BiomarkerSchema.safeParse(data);
}

export function validateBiomarkerArray(data: unknown) {
    return BiomarkerArraySchema.safeParse(data);
}

export function validateBodyComposition(data: unknown) {
    return BodyCompositionSchema.safeParse(data);
}

export function validateVitalSign(data: unknown) {
    return VitalSignSchema.safeParse(data);
}

export function validateSyncRequest(data: unknown) {
    return SyncRequestSchema.safeParse(data);
}

export function validateChatRequest(data: unknown) {
    return ChatRequestSchema.safeParse(data);
}

export function validateChatPromptRequest(data: unknown) {
    return ChatPromptRequestSchema.safeParse(data);
}

export function validateGoalCreateRequest(data: unknown) {
    return GoalCreateRequestSchema.safeParse(data);
}

export function validateFileUpload(data: unknown) {
    return FileUploadSchema.safeParse(data);
}

// Type exports
export type Biomarker = z.infer<typeof BiomarkerSchema>;
export type BodyComposition = z.infer<typeof BodyCompositionSchema>;
export type VitalSign = z.infer<typeof VitalSignSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type SleepSession = z.infer<typeof SleepSessionSchema>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type Goal = z.infer<typeof GoalSchema>;
export type GoalCreateRequest = z.infer<typeof GoalCreateRequestSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatPromptRequest = z.infer<typeof ChatPromptRequestSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type HealthEvent = z.infer<typeof HealthEventSchema>;
