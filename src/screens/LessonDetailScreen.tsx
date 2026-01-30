import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ProgressBar } from '../components';
import { trackLearningProgress } from '../utils/api';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

// Design System Colors
const LESSON_COLORS = {
    primary: '#E53935',
    secondaryPink: '#FDECEA',
    secondaryOrange: '#FFF3E0',
    disabledBg: '#F5F5F5',
    disabledIcon: '#BDBDBD',
    background: '#F8F9FA',
    cardBackground: '#FFFFFF',
    textPrimary: '#212121',
    textSecondary: '#757575',
    success: '#4CAF50',
    successLight: '#E8F5E9',
};

interface LessonDetail {
    id: number;
    title: string;
    description: string | null;
    hsk_level: number;
    estimated_time: number;
    vocabCount: number;
    durationMinutes: number;
    status: 'completed' | 'in_progress' | 'available' | 'locked';
    progressPercent: number;
    // Learned counts from API
    learnedVocabCount: number;
    learnedGrammarCount: number;
    learnedListeningCount: number;
    learnedSpeakingCount: number;
    // Content arrays
    characters: any[];
    vocabulary: any[];
    objectives: any[];
    grammar: any[];
    exercises: any[];
}

interface Activity {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    iconBg: string;
    status: 'completed' | 'in_progress' | 'available' | 'locked';
}

interface LessonDetailScreenProps {
    route?: any;
    navigation?: any;
}

const LessonDetailScreen: React.FC<LessonDetailScreenProps> = ({ route, navigation }) => {
    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get lesson ID from route params or default to 1
    const rawLessonId = route?.params?.lessonId || 1;
    const lessonId = typeof rawLessonId === 'string' && rawLessonId.startsWith('lesson_')
        ? parseInt(rawLessonId.replace('lesson_', ''), 10)
        : rawLessonId;

    // Lesson Progress state
    const [progress, setProgress] = useState({
        percent: 0,
        vocabLearned: 0,
        vocabTotal: 0,
        grammarLearned: 0,
        grammarTotal: 0,
        listeningLearned: 0,
        speakingLearned: 0,
        activitiesCompleted: 0,
        activitiesTotal: 5,
        status: 'available' as LessonDetail['status'],
    });

    useEffect(() => {
        fetchLessonDetail();
    }, [lessonId]);

    const fetchLessonDetail = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('access_token');

            const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });

            if (response.ok) {
                const data: LessonDetail = await response.json();
                setLesson(data);

                // Map API fields to state
                setProgress({
                    percent: data.progressPercent || 0,
                    vocabLearned: data.learnedVocabCount || 0,
                    vocabTotal: data.vocabCount || data.vocabulary?.length || 0,
                    grammarLearned: data.learnedGrammarCount || 0,
                    grammarTotal: data.grammar?.length || 0,
                    listeningLearned: data.learnedListeningCount || 0,
                    speakingLearned: data.learnedSpeakingCount || 0,
                    activitiesCompleted: data.status === 'completed' ? 5 : (data.progressPercent > 0 ? 1 : 0),
                    activitiesTotal: 5,
                    status: data.status || 'available',
                });
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Không thể tải bài học');
            }
        } catch (err) {
            console.error('Error fetching lesson detail:', err);
            setError('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    const getActivities = (): Activity[] => {
        const isCompleted = progress.status === 'completed' || progress.percent === 100;

        return [
            {
                id: 'vocabulary',
                title: 'Từ vựng',
                subtitle: isCompleted ? 'Hoàn thành' : `Đã học ${progress.vocabLearned}/${progress.vocabTotal} từ`,
                icon: 'book-open',
                iconBg: LESSON_COLORS.secondaryPink,
                status: isCompleted ? 'completed' : (progress.vocabLearned > 0 ? 'in_progress' : 'available'),
            },
            {
                id: 'sentences',
                title: 'Câu mẫu',
                subtitle: isCompleted ? 'Hoàn thành' : (progress.grammarLearned > 0 ? `Đã học ${progress.grammarLearned}/${progress.grammarTotal} câu` : 'Chưa học'),
                icon: 'message-square',
                iconBg: LESSON_COLORS.secondaryOrange,
                status: isCompleted ? 'completed' : (progress.grammarLearned > 0 ? 'in_progress' : 'available'),
            },
            {
                id: 'speaking',
                title: 'Luyện nói',
                subtitle: isCompleted ? 'Hoàn thành' : (progress.speakingLearned > 0 ? `Đã hoàn thành ${progress.speakingLearned} bài` : 'Chưa học'),
                icon: 'mic',
                iconBg: LESSON_COLORS.secondaryOrange,
                status: isCompleted ? 'completed' : (progress.speakingLearned > 0 ? 'in_progress' : 'available'),
            },
            {
                id: 'writing',
                title: 'Viết chữ Hán',
                subtitle: isCompleted ? 'Hoàn thành' : 'Chưa học',
                icon: 'edit-3',
                iconBg: LESSON_COLORS.secondaryOrange,
                status: isCompleted ? 'completed' : 'available',
            },
        ];
    };

    const getButtonText = (): string => {
        if (progress.status === 'completed' || progress.percent === 100) return 'Ôn lại bài học';
        if (progress.status === 'in_progress' || progress.percent > 0) return 'Tiếp tục bài học';
        return 'Bắt đầu học';
    };

    const getProgressColor = (): string => {
        return progress.percent === 100 ? LESSON_COLORS.success : LESSON_COLORS.primary;
    };

    const handleGoBack = () => {
        navigation?.goBack();
    };

    const handleActivityPress = (activity: Activity) => {
        if (activity.status === 'locked') return;

        // Note: Progress tracking is done within each activity screen (e.g., VocabularyScreen)
        // using the specific item_id from the API response

        if (activity.id === 'vocabulary') {
            navigation?.navigate('Vocabulary', {
                lessonId: lessonId,
                hskLevel: lesson?.hsk_level || 1,
                lessonNumber: lessonId,
            });
        } else if (activity.id === 'sentences') {
            navigation?.navigate('Grammar', {
                lessonId: lessonId,
                hskLevel: lesson?.hsk_level || 1,
            });
        } else {
            console.log('Activity pressed:', activity.id);
            // TODO: Navigate to other activity screens
        }
    };

    const handleMainButton = () => {
        console.log('Main button pressed, progress:', progress.percent);
        // TODO: Navigate to learning screen
    };

    const renderActivityItem = (activity: Activity) => {
        const isLocked = activity.status === 'locked';
        const isCompleted = activity.status === 'completed';
        const isInProgress = activity.status === 'in_progress';

        return (
            <TouchableOpacity
                key={activity.id}
                style={styles.activityItem}
                onPress={() => handleActivityPress(activity)}
                disabled={isLocked}
                activeOpacity={isLocked ? 1 : 0.7}
            >
                <View style={styles.activityLeft}>
                    <View style={[
                        styles.activityIcon,
                        { backgroundColor: isLocked ? LESSON_COLORS.disabledBg : activity.iconBg },
                    ]}>
                        {isCompleted ? (
                            <Feather name="check" size={20} color={LESSON_COLORS.success} />
                        ) : isLocked ? (
                            <Feather name="lock" size={18} color={LESSON_COLORS.disabledIcon} />
                        ) : (
                            <Feather
                                name={activity.icon as any}
                                size={20}
                                color={isLocked ? LESSON_COLORS.disabledIcon : LESSON_COLORS.primary}
                            />
                        )}
                    </View>
                    <View style={styles.activityInfo}>
                        <Text style={[
                            styles.activityTitle,
                            isLocked && styles.activityTitleLocked,
                        ]}>
                            {activity.title}
                        </Text>
                        <Text style={[
                            styles.activitySubtitle,
                            isLocked && styles.activitySubtitleLocked,
                        ]}>
                            {activity.subtitle}
                        </Text>
                    </View>
                </View>
                <View style={styles.activityRight}>
                    {isCompleted && (
                        <View style={styles.completedBadge}>
                            <Feather name="check-circle" size={20} color={LESSON_COLORS.success} />
                        </View>
                    )}
                    {isInProgress && (
                        <TouchableOpacity style={styles.continueButton}>
                            <Text style={styles.continueButtonText}>Tiếp tục</Text>
                        </TouchableOpacity>
                    )}
                    {!isLocked && !isCompleted && !isInProgress && (
                        <TouchableOpacity style={styles.startButton}>
                            <Text style={styles.startButtonText}>Bắt đầu</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={LESSON_COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color={LESSON_COLORS.disabledIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchLessonDetail}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={LESSON_COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Feather name="chevron-left" size={24} color={LESSON_COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        HSK {lesson?.hsk_level || 1} – Bài {lessonId}
                    </Text>
                    <Text style={styles.headerSubtitle}>{lesson?.title || 'Bài học'}</Text>
                </View>
                <TouchableOpacity style={styles.menuButton}>
                    <Feather name="more-horizontal" size={24} color={LESSON_COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>{progress.percent}% hoàn thành</Text>
                        <Text style={styles.progressPercent}>{progress.percent}%</Text>
                    </View>
                    <ProgressBar
                        progress={progress.percent}
                        height={8}
                        backgroundColor="#E0E0E0"
                        progressColor={getProgressColor()}
                        style={styles.progressBar}
                    />
                    <Text style={styles.progressSubtext}>
                        Đã học {progress.vocabLearned} / {progress.vocabTotal} từ | {progress.activitiesCompleted} / {progress.activitiesTotal} hoạt động
                    </Text>
                </View>

                {/* Lesson Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>THÔNG TIN BÀI HỌC</Text>
                    <Text style={styles.infoTitle}>
                        {lesson?.description || 'Giao tiếp cơ bản về gia đình'}
                    </Text>
                    <View style={styles.infoMeta}>
                        <View style={styles.infoItem}>
                            <Feather name="book" size={14} color={LESSON_COLORS.textSecondary} />
                            <Text style={styles.infoText}>{lesson?.vocabCount || lesson?.vocabulary.length || 0} từ vựng</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Feather name="clock" size={14} color={LESSON_COLORS.textSecondary} />
                            <Text style={styles.infoText}>{lesson?.durationMinutes || lesson?.estimated_time || 0} phút</Text>
                        </View>
                    </View>
                    {/* Family illustration placeholder */}
                    <View style={styles.illustrationContainer}>
                        <Text style={styles.illustrationEmoji}>👨‍👩‍👧‍👦</Text>
                    </View>
                </View>

                {/* Activities Section */}
                <View style={styles.activitiesSection}>
                    <Text style={styles.sectionTitle}>Hoạt động học tập</Text>
                    {getActivities().map(renderActivityItem)}
                </View>
            </ScrollView>

            {/* Sticky Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.mainButton,
                        progress.percent === 100 && styles.mainButtonCompleted,
                    ]}
                    onPress={handleMainButton}
                >
                    <Text style={styles.mainButtonText}>{getButtonText()}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LESSON_COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        marginTop: 16,
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: LESSON_COLORS.primary,
        borderRadius: 16,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: LESSON_COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: LESSON_COLORS.primary,
        marginTop: 2,
    },
    menuButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    progressCard: {
        backgroundColor: LESSON_COLORS.cardBackground,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
    },
    progressPercent: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.primary,
    },
    progressBar: {
        marginBottom: 12,
    },
    progressSubtext: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    infoCard: {
        backgroundColor: LESSON_COLORS.cardBackground,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: LESSON_COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    infoTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 12,
    },
    infoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    infoText: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        marginLeft: 6,
    },
    illustrationContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    illustrationEmoji: {
        fontSize: 48,
    },
    activitiesSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: LESSON_COLORS.cardBackground,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    activityIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 2,
    },
    activityTitleLocked: {
        color: LESSON_COLORS.disabledIcon,
    },
    activitySubtitle: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    activitySubtitleLocked: {
        color: LESSON_COLORS.disabledIcon,
    },
    activityRight: {
        marginLeft: 12,
    },
    completedBadge: {
        padding: 4,
    },
    continueButton: {
        backgroundColor: LESSON_COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    startButton: {
        backgroundColor: LESSON_COLORS.secondaryPink,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: LESSON_COLORS.primary,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: LESSON_COLORS.cardBackground,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 5,
    },
    mainButton: {
        backgroundColor: LESSON_COLORS.primary,
        borderRadius: 16,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonCompleted: {
        backgroundColor: LESSON_COLORS.success,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default LessonDetailScreen;
