import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button, ProgressBar } from '../components';
import { mockUser } from '../constants/mockData';
import { getStatsOverview, getCurrentGoalProgress, getWeeklyStudyTime, getVocabularyGrowth, getUserAchievements } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { StatsOverview, Achievement } from '../types';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

const { width } = Dimensions.get('window');

const ProgressScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const [stats, setStats] = React.useState<StatsOverview | null>(null);
    const [goalProgress, setGoalProgress] = React.useState<any>(null);
    const [weeklyTime, setWeeklyTime] = React.useState<any>(null);
    const [vocabGrowth, setVocabGrowth] = React.useState<any>(null);
    const [achievements, setAchievements] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [statsData, goalData, timeData, vocabData, achievementsData] = await Promise.all([
                        getStatsOverview(),
                        getCurrentGoalProgress(),
                        getWeeklyStudyTime(),
                        getVocabularyGrowth(),
                        getUserAchievements()
                    ]);
                    
                    setStats(statsData);
                    setGoalProgress(goalData);
                    setWeeklyTime(timeData);
                    setVocabGrowth(vocabData);
                    setAchievements(achievementsData || []);
                } catch (error) {
                    console.error("Error fetching progress data:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }, [])
    );

    const overallProgress = goalProgress?.progress_percent || 0;
    const currentHskLevel = goalProgress?.current_level || 'HSK 1';
    
    const weeklyHours = weeklyTime?.total_hours_this_week || 0;
    const weeklyChange = weeklyTime?.change_percent || 0;
    const weeklyStats = weeklyTime?.daily_stats || [];
    
    const vocabularyNewWords = vocabGrowth?.new_words_this_week || 0;
    const vocabularyChange = vocabGrowth?.growth_percent || 0;

    const handleContinueLearning = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/v1/learning/resume`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                let rawLessonId = data.lesson?.id || data.id || data.lesson_id;
                let lessonId: number | string = rawLessonId;
                
                if (typeof rawLessonId === 'string' && rawLessonId.startsWith('lesson_')) {
                    lessonId = parseInt(rawLessonId.replace('lesson_', ''), 10);
                } else if (typeof rawLessonId === 'string') {
                    const parsed = parseInt(rawLessonId, 10);
                    if (!isNaN(parsed)) lessonId = parsed;
                }

                const hskLevelText = data.course?.level || (data.hsk_level ? `HSK ${data.hsk_level}` : null);
                const hskLevel = hskLevelText ? parseInt(hskLevelText.replace(/[^0-9]/g, '')) : (data.hsk_level || 1);

                if (lessonId) {
                    navigation?.navigate('LessonDetail', {
                        lessonId: lessonId,
                        hskLevel: hskLevel,
                    });
                } else if (data.navigation) {
                    navigation?.navigate(data.navigation.screen, data.navigation.params);
                }
            } else {
                const errorData = await response.json();
                alert(`Lỗi: ${errorData.detail || 'Không thể tiếp tục học'}`);
            }
        } catch (err) {
            console.error('Error resuming learning:', err);
        }
    };

    // Calculate bar chart dimensions
    const maxHours = Math.max(...weeklyStats.map((s: any) => s.hours), 1); // Avoid division by zero
    const barWidth = (width - SPACING.md * 2 - SPACING.lg * 2 - SPACING.sm * 6) / 7;

    const CircularProgress: React.FC<{ progress: number; size: number }> = ({ progress, size }) => {
        const strokeWidth = 8;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={size} height={size} style={{ position: 'absolute' }}>
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={COLORS.progressTrack}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                    />
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={COLORS.primary}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                </Svg>
                <View style={styles.circularProgressContent}>
                    <Text style={styles.progressPercentage}>{progress}%</Text>
                    <Text style={styles.progressLabel}>{currentHskLevel}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>D</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tiến độ học tập</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Feather name="settings" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress Overview Card */}
                <Card style={styles.overviewCard} variant="elevated">
                    <View style={styles.overviewContent}>
                        <CircularProgress progress={overallProgress} size={100} />
                        <View style={styles.overviewTextContent}>
                            <Text style={styles.overviewLabel}>MỤC TIÊU HIỆN TẠI</Text>
                            <Text style={styles.overviewTitle}>Lộ trình {currentHskLevel}</Text>
                            <Button
                                title="Tiếp tục học"
                                onPress={handleContinueLearning}
                                size="small"
                                style={styles.continueButton}
                            />
                        </View>
                    </View>
                </Card>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <Card style={styles.statCard} variant="elevated">
                        <View style={styles.statIconContainer}>
                            <Feather name="check-circle" size={20} color={COLORS.success} />
                        </View>
                        <Text style={styles.statLabel}>Độ chính xác</Text>
                        <Text style={styles.statValue}>{stats?.accuracy_percent ? Math.round(stats.accuracy_percent) : 0}</Text>
                        <Text style={styles.statUnit}>%</Text>
                    </Card>
                    <View style={{ width: SPACING.md }} />
                    <Card style={styles.statCard} variant="elevated">
                        <View style={styles.statIconContainer}>
                            <Feather name="zap" size={20} color={COLORS.accent} />
                        </View>
                        <Text style={styles.statLabel}>Ngày liên tiếp</Text>
                        <Text style={styles.statValue}>{stats?.current_streak || mockUser.consecutiveDays}</Text>
                        <Text style={styles.statUnit}>ngày</Text>
                    </Card>
                </View>

                {/* Achievements Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thành tựu</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllText}>Tất cả</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.achievementsScroll}
                >
                    {achievements.map((achievement) => (
                        <View
                            key={achievement.id}
                            style={[
                                styles.achievementItem,
                                !achievement.is_unlocked && styles.achievementItemLocked,
                            ]}
                        >
                            <View
                                style={[
                                    styles.achievementIcon,
                                    !achievement.is_unlocked && styles.achievementIconLocked,
                                ]}
                            >
                                {achievement.icon === 'flame' && <Text style={styles.achievementEmoji}>🔥</Text>}
                                {achievement.icon === 'book' && <Text style={styles.achievementEmoji}>📚</Text>}
                                {achievement.icon === 'award' && <Text style={styles.achievementEmoji}>🏆</Text>}
                            </View>
                            <Text
                                style={[
                                    styles.achievementTitle,
                                    !achievement.is_unlocked && styles.achievementTitleLocked,
                                ]}
                                numberOfLines={2}
                            >
                                {achievement.title}
                            </Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Weekly Stats Card */}
                <Card style={styles.weeklyCard} variant="elevated">
                    <Text style={styles.weeklyTitle}>Thời gian học (phút)</Text>
                    <View style={styles.weeklyValueRow}>
                        <Text style={styles.weeklyValue}>{weeklyHours} giờ/tuần</Text>
                        <View style={styles.weeklyChange}>
                            <Feather name="arrow-up" size={14} color={COLORS.success} />
                            <Text style={styles.weeklyChangeText}>+{weeklyChange}%</Text>
                        </View>
                    </View>
                    <View style={styles.barChart}>
                        {weeklyStats.map((stat: any, index: number) => {
                            const barHeight = (stat.hours / maxHours) * 80;
                            // Highlight current day if possible, or omit
                            const isHighlighted = index === 6; // Thường index cuối sẽ là hôm nay nếu mảng sort từ QK tới HT
                            return (
                                <View key={stat.day} style={styles.barContainer}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: barHeight,
                                                backgroundColor: isHighlighted ? COLORS.primary : COLORS.progressTrack,
                                            },
                                        ]}
                                    />
                                    <Text style={[styles.barLabel, isHighlighted && styles.barLabelHighlighted]}>
                                        {stat.day}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </Card>

                {/* Vocabulary Growth Card */}
                <Card style={styles.vocabCard} variant="elevated">
                    <Text style={styles.vocabTitle}>Tăng trưởng từ vựng</Text>
                    <View style={styles.vocabValueRow}>
                        <Text style={styles.vocabValue}>+{vocabularyNewWords} từ</Text>
                        <View style={styles.vocabChange}>
                            <Feather name={vocabularyChange >= 0 ? "arrow-up" : "arrow-down"} size={14} color={COLORS.success} />
                            <Text style={styles.vocabChangeText}>{vocabularyChange > 0 ? '+' : ''}{vocabularyChange}%</Text>
                        </View>
                    </View>
                    {/* Simple wave chart placeholder */}
                    <View style={styles.waveChart}>
                        <Svg width="100%" height={60}>
                            <Defs>
                                <LinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.3" />
                                    <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
                                </LinearGradient>
                            </Defs>
                            <Path
                                d="M 0 40 Q 30 20, 60 35 T 120 25 T 180 40 T 240 30 T 300 35 L 300 60 L 0 60 Z"
                                fill="url(#waveGradient)"
                            />
                            <Path
                                d="M 0 40 Q 30 20, 60 35 T 120 25 T 180 40 T 240 30 T 300 35"
                                stroke={COLORS.primary}
                                strokeWidth="2"
                                fill="transparent"
                            />
                        </Svg>
                    </View>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    avatarSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarSmallText: {
        color: COLORS.textWhite,
        fontSize: FONT_SIZES.body,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    settingsButton: {
        padding: SPACING.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    overviewCard: {
        backgroundColor: COLORS.progressBackground,
        marginBottom: SPACING.md,
        padding: SPACING.lg,
    },
    overviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    circularProgressContent: {
        alignItems: 'center',
    },
    progressPercentage: {
        fontSize: FONT_SIZES.h2,
        fontWeight: '700',
        color: COLORS.primary,
    },
    progressLabel: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    overviewTextContent: {
        flex: 1,
        marginLeft: SPACING.lg,
    },
    overviewLabel: {
        fontSize: FONT_SIZES.captionSmall,
        color: COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    overviewTitle: {
        fontSize: FONT_SIZES.h3,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    continueButton: {
        alignSelf: 'flex-start',
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: SPACING.md,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    statLabel: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    statValue: {
        fontSize: FONT_SIZES.h1,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    statUnit: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    viewAllText: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.primary,
        fontWeight: '500',
    },
    achievementsScroll: {
        paddingBottom: SPACING.md,
    },
    achievementItem: {
        alignItems: 'center',
        marginRight: SPACING.md,
        width: 80,
    },
    achievementItemLocked: {
        opacity: 0.5,
    },
    achievementIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.accent + '30',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    achievementIconLocked: {
        backgroundColor: COLORS.border,
    },
    achievementEmoji: {
        fontSize: 24,
    },
    achievementTitle: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textPrimary,
        textAlign: 'center',
        fontWeight: '500',
    },
    achievementTitleLocked: {
        color: COLORS.textLight,
    },
    weeklyCard: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    weeklyTitle: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    weeklyValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    weeklyValue: {
        fontSize: FONT_SIZES.h2,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    weeklyChange: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.sm,
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.round,
    },
    weeklyChangeText: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.success,
        fontWeight: '600',
        marginLeft: 2,
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
    },
    barContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    bar: {
        width: 20,
        borderRadius: BORDER_RADIUS.sm,
        marginBottom: SPACING.sm,
    },
    barLabel: {
        fontSize: FONT_SIZES.captionSmall,
        color: COLORS.textLight,
    },
    barLabelHighlighted: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    vocabCard: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    vocabTitle: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    vocabValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    vocabValue: {
        fontSize: FONT_SIZES.h2,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    vocabChange: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: SPACING.sm,
        backgroundColor: COLORS.success + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.round,
    },
    vocabChangeText: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.success,
        fontWeight: '600',
        marginLeft: 2,
    },
    waveChart: {
        height: 60,
    },
});

export default ProgressScreen;
