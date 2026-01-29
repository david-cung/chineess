// Types cho Navigation
export type RootStackParamList = {
    Login: undefined;
    MainTabs: undefined;
    LessonDetail: { lessonId: number };
    Vocabulary: { lessonId: number; hskLevel: number; lessonNumber: number };
};

export type RootTabParamList = {
    Home: undefined;
    Lessons: undefined;
    Practice: undefined;
    Progress: undefined;
    Profile: undefined;
};

// Types cho User
export interface User {
    id: string;
    name: string;
    avatar?: string;
    level: string;
    streak: number;
    totalVocabulary: number;
    consecutiveDays: number;
    isPremium: boolean;
}

// Types cho Lesson
export interface Lesson {
    id: string;
    title: string;
    level: 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';
    category: 'Giao tiếp' | 'Business' | 'Du lịch';
    vocabularyCount: number;
    duration: number; // in minutes
    progress: number; // 0-100
    isLocked: boolean;
    isCompleted: boolean;
}

// Types cho Practice
export interface PracticeItem {
    id: string;
    type: 'listening' | 'speaking' | 'writing' | 'quiz';
    title: string;
    description: string;
    icon: string;
    hasAiBadge?: boolean;
    buttonText: string;
}

// Types cho Achievement
export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    isUnlocked: boolean;
    progress?: number;
}

// Types cho DailyGoal
export interface DailyGoal {
    targetMinutes: number;
    completedMinutes: number;
    targetVocabulary?: number;
    completedVocabulary?: number;
}

// Types cho WeeklyStats
export interface WeeklyStats {
    day: string;
    hours: number;
}

// Types cho Settings
export interface Settings {
    dailyGoal: number;
    notifications: boolean;
    darkMode: boolean;
    language: 'vi' | 'en';
    offlineDownload: boolean;
}
