// Types cho Navigation
export type RootStackParamList = {
    Login: undefined;
    MainTabs: undefined;
    LessonDetail: { lessonId: number };
    Vocabulary: { lessonId: number; hskLevel: number; lessonNumber: number };
    Grammar: { lessonId: number; hskLevel: number };
    Review: undefined;
    Quiz: { lessonId: number };
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

// ==================== Review Types ====================
export interface ReviewRating {
    id: number;
    name: string;
    duration_minutes: number;
}

export interface ReviewCard {
    id: number;
    vocabulary: Vocabulary;
    deck: string;
    show_next: string;
    rating_id?: number;
    created_at: string;
}

export interface Vocabulary {
    id: number;
    word: string;
    pinyin: string;
    meaning: string;
    hsk_level: number;
    audio_url?: string;
    examples: VocabularyExample[];
}

export interface VocabularyExample {
    id: number;
    sentence: string;
    pinyin: string;
    translation: string;
}

// ==================== Quiz Types ====================
export interface QuizQuestion {
    id: string;
    vocabulary_id: number;
    question: string;
    correct_answer: string;
    options: string[];
    type: 'zh_to_en' | 'en_to_zh';
}

export interface MatchingPair {
    zh: string;
    en: string;
    vocabulary_id: number;
}

export interface SentenceGameQuestion {
    sentence_id: number;
    characters: string;
    pinyin: string;
    meaning: string;
    words: string[];
}

// ==================== Statistics Types ====================
export interface DailyStat {
    date: string;
    right_count: number;
    wrong_count: number;
}

export interface StatsOverview {
    new_words_today: number;
    reviewed_today: number;
    accuracy_percent: number;
    current_streak: number;
}
