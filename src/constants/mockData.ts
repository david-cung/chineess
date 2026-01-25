import { User, Lesson, PracticeItem, Achievement, DailyGoal, WeeklyStats } from '../types';

export const mockUser: User = {
    id: '1',
    name: 'David',
    level: 'HSK 1',
    streak: 7,
    totalVocabulary: 120,
    consecutiveDays: 7,
    isPremium: false,
};

export const mockLessons: Lesson[] = [
    {
        id: '1',
        title: 'Chào hỏi',
        level: 'HSK1',
        category: 'Giao tiếp',
        vocabularyCount: 12,
        duration: 8,
        progress: 100,
        isLocked: false,
        isCompleted: true,
    },
    {
        id: '2',
        title: 'Gia đình',
        level: 'HSK1',
        category: 'Giao tiếp',
        vocabularyCount: 15,
        duration: 10,
        progress: 45,
        isLocked: false,
        isCompleted: false,
    },
    {
        id: '3',
        title: 'Mua sắm',
        level: 'HSK1',
        category: 'Giao tiếp',
        vocabularyCount: 10,
        duration: 12,
        progress: 0,
        isLocked: true,
        isCompleted: false,
    },
    {
        id: '4',
        title: 'Thời gian',
        level: 'HSK1',
        category: 'Giao tiếp',
        vocabularyCount: 15,
        duration: 10,
        progress: 0,
        isLocked: true,
        isCompleted: false,
    },
    {
        id: '5',
        title: 'Thời tiết',
        level: 'HSK1',
        category: 'Giao tiếp',
        vocabularyCount: 11,
        duration: 14,
        progress: 0,
        isLocked: true,
        isCompleted: false,
    },
];

export const mockPracticeItems: PracticeItem[] = [
    {
        id: '1',
        type: 'listening',
        title: 'Luyện Nghe',
        description: 'Cải thiện phản xạ nghe với người bản xứ',
        icon: 'headphones',
        buttonText: 'Bắt đầu',
    },
    {
        id: '2',
        type: 'speaking',
        title: 'Luyện Nói',
        description: 'Chấm điểm phát âm AI chuẩn xác',
        icon: 'mic',
        hasAiBadge: true,
        buttonText: 'Bắt đầu',
    },
    {
        id: '3',
        type: 'writing',
        title: 'Luyện Viết',
        description: 'Học cách viết các bộ thủ cơ bản',
        icon: 'edit-2',
        buttonText: 'Bắt đầu',
    },
    {
        id: '4',
        type: 'quiz',
        title: 'Trắc nghiệm nhanh',
        description: 'Kiểm tra từ vựng trong 30 giây',
        icon: 'help-circle',
        buttonText: 'Thử ngay',
    },
];

export const mockAchievements: Achievement[] = [
    {
        id: '1',
        title: '7 ngày liên tiếp',
        description: 'Học 7 ngày không nghỉ',
        icon: 'flame',
        isUnlocked: true,
    },
    {
        id: '2',
        title: '100 từ vựng',
        description: 'Học được 100 từ vựng',
        icon: 'book',
        isUnlocked: true,
    },
    {
        id: '3',
        title: 'Học giỏi HSK 1',
        description: 'Hoàn thành tất cả bài HSK 1',
        icon: 'award',
        isUnlocked: false,
        progress: 65,
    },
];

export const mockDailyGoal: DailyGoal = {
    targetMinutes: 15,
    completedMinutes: 10,
    targetVocabulary: 5,
    completedVocabulary: 3,
};

export const mockWeeklyStats: WeeklyStats[] = [
    { day: 'T2', hours: 0.5 },
    { day: 'T3', hours: 0.8 },
    { day: 'T4', hours: 0.6 },
    { day: 'T5', hours: 1.2 },
    { day: 'T6', hours: 1.5 },
    { day: 'T7', hours: 0.4 },
    { day: 'CN', hours: 0.3 },
];

export const currentLesson = {
    id: '2',
    title: 'Chào hỏi',
    baiNumber: 5,
    level: 'HSK 1',
    description: 'Làm quen với các cách chào hỏi cơ bản và cấu trúc câu lịch sự trong tiếng Trung.',
    chinesePhrase: '你好',
    pinyin: 'Nǐ hǎo!',
};
