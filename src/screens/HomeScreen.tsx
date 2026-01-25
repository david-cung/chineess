import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button, ProgressBar, QuickAction } from '../components';
import { mockUser, mockDailyGoal, currentLesson } from '../constants/mockData';

const HomeScreen: React.FC = () => {
    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'CHÀO BUỔI SÁNG';
        if (hour < 18) return 'CHÀO BUỔI CHIỀU';
        return 'CHÀO BUỔI TỐI';
    };

    const progressPercentage = (mockDailyGoal.completedMinutes / mockDailyGoal.targetMinutes) * 100;
    const remainingMinutes = mockDailyGoal.targetMinutes - mockDailyGoal.completedMinutes;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>D</Text>
                            </View>
                        </View>
                        <View style={styles.greetingContainer}>
                            <Text style={styles.greeting}>{getGreeting()}</Text>
                            <Text style={styles.userName}>{mockUser.name} 👋</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.streakBadge}>
                        <Feather name="zap" size={16} color={COLORS.accent} />
                        <Text style={styles.streakText}>{mockUser.streak} ngày</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Lesson Card */}
                <Card style={styles.lessonCard} variant="elevated">
                    <View style={styles.lessonCardContent}>
                        <View style={styles.lessonTextContent}>
                            <View style={styles.pinyinBadge}>
                                <Text style={styles.pinyinBadgeText}>{currentLesson.pinyin}</Text>
                            </View>
                            <Text style={styles.chineseText}>{currentLesson.chinesePhrase}</Text>
                        </View>
                        <View style={styles.illustrationContainer}>
                            <View style={styles.illustration}>
                                <Text style={styles.illustrationEmoji}>👩🏻</Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Continue Learning Section */}
                <View style={styles.continueSection}>
                    <Text style={styles.sectionLabel}>TIẾP TỤC HỌC</Text>
                    <Text style={styles.lessonTitle}>
                        {currentLesson.level} – Bài {currentLesson.baiNumber}: {currentLesson.title}
                    </Text>
                    <Text style={styles.lessonDescription}>{currentLesson.description}</Text>
                    <Button
                        title="Tiếp tục học"
                        onPress={() => { }}
                        icon={<Feather name="play" size={16} color={COLORS.textWhite} />}
                        iconPosition="right"
                        fullWidth
                        style={styles.continueButton}
                    />
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <View style={styles.quickActionsHeader}>
                        <Text style={styles.sectionTitle}>Lối tắt nhanh</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.quickActionsGrid}>
                        <QuickAction
                            icon="book-open"
                            title="Từ vựng"
                            onPress={() => { }}
                            iconColor={COLORS.primary}
                            iconBackgroundColor={COLORS.progressBackground}
                        />
                        <View style={styles.quickActionSpacer} />
                        <QuickAction
                            icon="headphones"
                            title="Luyện nghe"
                            onPress={() => { }}
                            iconColor={COLORS.secondary}
                            iconBackgroundColor="#EBF3FC"
                        />
                    </View>
                    <View style={[styles.quickActionsGrid, { marginTop: SPACING.md }]}>
                        <QuickAction
                            icon="mic"
                            title="Luyện nói"
                            onPress={() => { }}
                            iconColor="#4CAF50"
                            iconBackgroundColor="#E8F5E9"
                        />
                        <View style={styles.quickActionSpacer} />
                        <QuickAction
                            icon="edit-3"
                            title="Viết chữ"
                            onPress={() => { }}
                            iconColor="#9C27B0"
                            iconBackgroundColor="#F3E5F5"
                        />
                    </View>
                </View>

                {/* Daily Goal */}
                <Card style={styles.dailyGoalCard} variant="elevated">
                    <View style={styles.dailyGoalHeader}>
                        <View style={styles.dailyGoalTitleContainer}>
                            <View style={styles.fireIcon}>
                                <Text>🔥</Text>
                            </View>
                            <Text style={styles.dailyGoalTitle}>Mục tiêu hàng ngày</Text>
                        </View>
                        <Text style={styles.dailyGoalProgress}>
                            {mockDailyGoal.completedMinutes} / {mockDailyGoal.targetMinutes} phút
                        </Text>
                    </View>
                    <ProgressBar
                        progress={progressPercentage}
                        height={10}
                        backgroundColor={COLORS.progressTrack}
                        progressColor={COLORS.primary}
                        style={styles.dailyGoalProgressBar}
                    />
                    <Text style={styles.dailyGoalHint}>
                        Chỉ còn {remainingMinutes} phút nữa để hoàn thành mục tiêu!
                    </Text>
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: SPACING.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: COLORS.textWhite,
        fontSize: FONT_SIZES.h4,
        fontWeight: '600',
    },
    greetingContainer: {},
    greeting: {
        fontSize: FONT_SIZES.captionSmall,
        color: COLORS.textSecondary,
        letterSpacing: 1,
        fontWeight: '500',
    },
    userName: {
        fontSize: FONT_SIZES.h3,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 2,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
        ...SHADOWS.small,
    },
    streakText: {
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 6,
    },
    lessonCard: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    lessonCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lessonTextContent: {
        flex: 1,
    },
    pinyinBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.round,
        alignSelf: 'flex-start',
        marginBottom: SPACING.sm,
    },
    pinyinBadgeText: {
        color: COLORS.textWhite,
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: '500',
    },
    chineseText: {
        fontSize: 48,
        fontWeight: '700',
        color: COLORS.textWhite,
    },
    illustrationContainer: {
        marginLeft: SPACING.md,
    },
    illustration: {
        width: 100,
        height: 120,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    illustrationEmoji: {
        fontSize: 64,
    },
    continueSection: {
        marginBottom: SPACING.lg,
    },
    sectionLabel: {
        fontSize: FONT_SIZES.captionSmall,
        color: COLORS.primary,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: SPACING.xs,
    },
    lessonTitle: {
        fontSize: FONT_SIZES.h3,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    lessonDescription: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: SPACING.md,
    },
    continueButton: {
        marginTop: SPACING.sm,
    },
    quickActionsContainer: {
        marginBottom: SPACING.lg,
    },
    quickActionsHeader: {
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
    quickActionsGrid: {
        flexDirection: 'row',
    },
    quickActionSpacer: {
        width: SPACING.md,
    },
    dailyGoalCard: {
        padding: SPACING.md,
    },
    dailyGoalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    dailyGoalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fireIcon: {
        marginRight: SPACING.sm,
    },
    dailyGoalTitle: {
        fontSize: FONT_SIZES.body,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    dailyGoalProgress: {
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    dailyGoalProgressBar: {
        marginBottom: SPACING.sm,
    },
    dailyGoalHint: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default HomeScreen;
