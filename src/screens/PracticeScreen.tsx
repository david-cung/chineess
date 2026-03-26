import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button, Badge, ProgressBar, ErrorState } from '../components';
import { mockPracticeItems, mockDailyGoal } from '../constants/mockData';
import { PracticeItem } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

const PracticeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [activeLessonId, setActiveLessonId] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchActiveLesson();
    }, []);

    const fetchActiveLesson = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const token = await AsyncStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/v1/learning/resume`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                let rawLessonId = data.lesson?.id || data.id || data.lesson_id;
                if (rawLessonId) {
                    let id = typeof rawLessonId === 'string' ? parseInt(rawLessonId.replace('lesson_', ''), 10) : rawLessonId;
                    if (!isNaN(id)) {
                        setActiveLessonId(id);
                        await AsyncStorage.setItem('cached_active_lesson', id.toString());
                    }
                }
            } else {
                const cached = await AsyncStorage.getItem('cached_active_lesson');
                if (cached) setActiveLessonId(parseInt(cached));
            }
        } catch (err) {
            console.log('Failed to fetch active lesson');
            const cached = await AsyncStorage.getItem('cached_active_lesson');
            if (cached) setActiveLessonId(parseInt(cached));
        } finally {
            setIsLoading(false);
        }
    };
    const completedTasks = 3;
    const totalTasks = 5;

    const getIconComponent = (iconName: string, color: string) => {
        switch (iconName) {
            case 'mic':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
                        <Feather name="mic" size={28} color={COLORS.primary} />
                    </View>
                );
            case 'help-circle':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: '#FFF3E0' }]}>
                        <Feather name="help-circle" size={28} color="#FF9800" />
                    </View>
                );
            case 'radio':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: '#E3F2FD' }]}>
                        <Feather name="radio" size={28} color="#2196F3" />
                    </View>
                );
            case 'message-square':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: '#E8F5E9' }]}>
                        <Feather name="message-square" size={28} color="#4CAF50" />
                    </View>
                );
            case 'refresh-cw':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: '#EBF3FC' }]}>
                        <Feather name="refresh-cw" size={28} color={COLORS.secondary} />
                    </View>
                );
            case 'wifi-off':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: '#F5F5F5' }]}>
                        <Feather name="wifi-off" size={28} color={COLORS.textLight} />
                    </View>
                );
            default:
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: COLORS.progressBackground }]}>
                        <Feather name="book" size={28} color={COLORS.primary} />
                    </View>
                );
        }
    };

    const renderPracticeItem = (item: PracticeItem) => {
        const isAccent = item.type === 'speaking';

        const handlePress = () => {
            if (item.type === 'quiz') {
                navigation.navigate('Quiz', { lessonId: activeLessonId });
            } else if (item.type === 'review') {
                navigation.navigate('Review');
            } else if (item.type === 'speaking') {
                navigation.navigate('SpeakingPractice');
            } else if (item.type === 'radio') {
                navigation.navigate('RadioMode', { lessonId: activeLessonId });
            } else if (item.type === 'ai_chat') {
                navigation.navigate('AIChat');
            } else if (item.type === 'offline') {
                navigation.navigate('OfflineReview');
            } else {
                console.log('Practice pressed:', item.type);
            }
        };

        return (
            <Card key={item.id} style={styles.practiceCard} variant="elevated">
                <View style={styles.practiceCardContent}>
                    <View style={styles.practiceCardLeft}>
                        {item.hasAiBadge && (
                            <Badge text="AI SCORE BADGE" variant="ai" size="small" style={styles.aiBadge} />
                        )}
                        <Text style={styles.practiceTitle}>{item.title}</Text>
                        <Text style={styles.practiceDescription}>{item.description}</Text>
                        <Button
                            title={item.buttonText}
                            onPress={handlePress}
                            variant={isAccent ? 'primary' : 'outline'}
                            size="small"
                            icon={<Feather name="play" size={14} color={isAccent ? COLORS.textWhite : COLORS.primary} />}
                            iconPosition="left"
                            style={styles.practiceButton}
                        />
                    </View>
                    <View style={styles.practiceCardRight}>
                        {getIconComponent(item.icon, COLORS.primary)}
                    </View>
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Luyện tập hôm nay</Text>
                <TouchableOpacity style={styles.settingsButton}>
                    <Feather name="settings" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Motivation Text */}
                <View style={styles.motivationContainer}>
                    <Text style={styles.motivationText}>
                        Luyện 5 phút mỗi ngày để nhớ lâu hơn 🔥
                    </Text>
                </View>

                {/* Practice Items */}
                {mockPracticeItems.map(renderPracticeItem)}

                {/* Daily Goal Card */}
                <Card style={styles.dailyGoalCard} variant="elevated">
                    <View style={styles.dailyGoalHeader}>
                        <Text style={styles.dailyGoalTitle}>Mục tiêu hôm nay</Text>
                        <Text style={styles.dailyGoalProgress}>
                            {completedTasks}/{totalTasks} hoàn thành
                        </Text>
                    </View>
                    <ProgressBar
                        progress={(completedTasks / totalTasks) * 100}
                        height={8}
                        style={styles.dailyGoalProgressBar}
                    />
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
    backButton: {
        padding: SPACING.xs,
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
    motivationContainer: {
        marginBottom: SPACING.lg,
    },
    motivationText: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    practiceCard: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    practiceCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    practiceCardLeft: {
        flex: 1,
        marginRight: SPACING.md,
    },
    practiceCardRight: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiBadge: {
        alignSelf: 'flex-start',
        marginBottom: SPACING.sm,
    },
    practiceTitle: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    practiceDescription: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        lineHeight: 20,
    },
    practiceButton: {
        alignSelf: 'flex-start',
    },
    practiceIconContainer: {
        width: 64,
        height: 64,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dailyGoalCard: {
        marginTop: SPACING.md,
        padding: SPACING.md,
    },
    dailyGoalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    dailyGoalTitle: {
        fontSize: FONT_SIZES.body,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    dailyGoalProgress: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
    },
    dailyGoalProgressBar: {},
});

export default PracticeScreen;
