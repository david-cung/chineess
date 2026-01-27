import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, ProgressBar, Badge } from '../components';
import { useNavigation } from '@react-navigation/native';

// Get API base URL from config
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

interface LessonSummary {
    id: number;
    title: string;
    description: string | null;
    hsk_level: number;
    character_count: number;
    vocabulary_count: number;
    estimated_time: number;
    completed: boolean;
}

const categories = [
    { label: 'HSK 1', level: 1 },
    { label: 'HSK 2', level: 2 },
    { label: 'HSK 3', level: 3 },
    { label: 'HSK 4', level: 4 },
    { label: 'HSK 5', level: 5 },
];

const LessonsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [lessons, setLessons] = useState<LessonSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLessons(selectedLevel);
    }, [selectedLevel]);

    const fetchLessons = async (hskLevel: number) => {
        try {
            setIsLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('access_token');

            const response = await fetch(`${API_BASE_URL}/api/lessons?hsk_level=${hskLevel}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });

            if (response.ok) {
                const data: LessonSummary[] = await response.json();
                setLessons(data);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Không thể tải danh sách bài học');
            }
        } catch (err) {
            console.error('Error fetching lessons:', err);
            setError('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    const renderLessonItem = (lesson: LessonSummary, index: number) => {
        const isCompleted = lesson.completed;

        return (
            <TouchableOpacity
                key={lesson.id}
                style={styles.lessonItem}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('LessonDetail', { lessonId: lesson.id })}
            >
                <View style={styles.lessonItemLeft}>
                    <View
                        style={[
                            styles.lessonIcon,
                            isCompleted && styles.lessonIconCompleted,
                        ]}
                    >
                        {isCompleted ? (
                            <Feather name="check" size={20} color={COLORS.textWhite} />
                        ) : (
                            <Text style={styles.lessonNumber}>{index + 1}</Text>
                        )}
                    </View>
                    <View style={styles.lessonInfo}>
                        <Text style={styles.lessonTitle}>
                            Bài {index + 1}: {lesson.title}
                        </Text>
                        <Text style={styles.lessonMeta}>
                            {lesson.character_count} chữ • {lesson.vocabulary_count} từ • {lesson.estimated_time} phút
                        </Text>
                        {lesson.description && (
                            <Text style={styles.lessonDescription} numberOfLines={2}>
                                {lesson.description}
                            </Text>
                        )}
                    </View>
                </View>
                <View style={styles.lessonItemRight}>
                    {isCompleted ? (
                        <Badge text="HOÀN THÀNH" variant="success" size="small" />
                    ) : (
                        <Feather name="chevron-right" size={20} color={COLORS.textLight} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bài học</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerButton}>
                        <Feather name="search" size={22} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Tabs */}
            <View style={styles.categoryContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.level}
                            style={[
                                styles.categoryTab,
                                selectedLevel === category.level && styles.categoryTabActive,
                            ]}
                            onPress={() => setSelectedLevel(category.level)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedLevel === category.level && styles.categoryTextActive,
                                ]}
                            >
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Lessons List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color={COLORS.textLight} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchLessons(selectedLevel)}
                    >
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : lessons.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="book" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>Chưa có bài học nào</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.lessonsList}
                    contentContainerStyle={styles.lessonsContent}
                    showsVerticalScrollIndicator={false}
                >
                    {lessons.map((lesson, index) => renderLessonItem(lesson, index))}
                </ScrollView>
            )}
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
    headerTitle: {
        fontSize: FONT_SIZES.h1,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    categoryContainer: {
        paddingVertical: SPACING.sm,
    },
    categoryScroll: {
        paddingHorizontal: SPACING.md,
    },
    categoryTab: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginRight: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryTabActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryText: {
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    categoryTextActive: {
        color: COLORS.textWhite,
    },
    lessonsList: {
        flex: 1,
    },
    lessonsContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    lessonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...SHADOWS.small,
    },
    lessonItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    lessonIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.progressBackground,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    lessonIconCompleted: {
        backgroundColor: COLORS.success,
    },
    lessonNumber: {
        fontSize: FONT_SIZES.body,
        fontWeight: '600',
        color: COLORS.primary,
    },
    lessonInfo: {
        flex: 1,
    },
    lessonTitle: {
        fontSize: FONT_SIZES.body,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    lessonMeta: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
    },
    lessonDescription: {
        fontSize: FONT_SIZES.captionSmall,
        color: COLORS.textLight,
        marginTop: 4,
    },
    lessonItemRight: {
        alignItems: 'flex-end',
        marginLeft: SPACING.sm,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    errorText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: SPACING.md,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
    },
    retryText: {
        fontSize: FONT_SIZES.body,
        fontWeight: '600',
        color: COLORS.textWhite,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
    },
});

export default LessonsScreen;
