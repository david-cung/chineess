import React, { useState } from 'react';
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
import { Card, ProgressBar, Badge } from '../components';
import { mockLessons } from '../constants/mockData';
import { Lesson } from '../types';

const categories = ['HSK 1', 'HSK 2', 'Giao tiếp', 'Business'];

const LessonsScreen: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('HSK 1');

    const renderLessonItem = (lesson: Lesson, index: number) => {
        const isActive = lesson.progress > 0 && lesson.progress < 100;
        const isCompleted = lesson.isCompleted;
        const isLocked = lesson.isLocked;

        return (
            <TouchableOpacity
                key={lesson.id}
                style={[
                    styles.lessonItem,
                    isActive && styles.lessonItemActive,
                ]}
                activeOpacity={isLocked ? 1 : 0.7}
                disabled={isLocked}
            >
                <View style={styles.lessonItemLeft}>
                    <View
                        style={[
                            styles.lessonIcon,
                            isCompleted && styles.lessonIconCompleted,
                            isActive && styles.lessonIconActive,
                            isLocked && styles.lessonIconLocked,
                        ]}
                    >
                        {isCompleted ? (
                            <Feather name="check" size={20} color={COLORS.textWhite} />
                        ) : isLocked ? (
                            <Feather name="lock" size={18} color={COLORS.textLight} />
                        ) : (
                            <Feather name="circle" size={20} color={isActive ? COLORS.primary : COLORS.textLight} />
                        )}
                    </View>
                    <View style={styles.lessonInfo}>
                        <Text style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}>
                            {lesson.level.replace(/(\d)/, ' $1')} – Bài {index + 5}: {lesson.title}
                        </Text>
                        <Text style={[styles.lessonMeta, isLocked && styles.lessonMetaLocked]}>
                            {lesson.vocabularyCount} từ • {lesson.duration} phút
                        </Text>
                        {isActive && (
                            <ProgressBar
                                progress={lesson.progress}
                                height={4}
                                style={styles.lessonProgress}
                            />
                        )}
                    </View>
                </View>
                <View style={styles.lessonItemRight}>
                    {isActive && (
                        <Badge text="TIẾP TỤC" variant="primary" size="small" />
                    )}
                    {isActive && (
                        <Text style={styles.progressText}>{lesson.progress}%</Text>
                    )}
                    {!isLocked && !isActive && !isCompleted && (
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
                    <TouchableOpacity style={styles.headerButton}>
                        <Feather name="settings" size={22} color={COLORS.textPrimary} />
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
                            key={category}
                            style={[
                                styles.categoryTab,
                                selectedCategory === category && styles.categoryTabActive,
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategory === category && styles.categoryTextActive,
                                ]}
                            >
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Lessons List */}
            <ScrollView
                style={styles.lessonsList}
                contentContainerStyle={styles.lessonsContent}
                showsVerticalScrollIndicator={false}
            >
                {mockLessons.map((lesson, index) => renderLessonItem(lesson, index))}
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
    lessonItemActive: {
        borderWidth: 2,
        borderColor: COLORS.primary,
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
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    lessonIconCompleted: {
        backgroundColor: COLORS.success,
    },
    lessonIconActive: {
        backgroundColor: COLORS.progressBackground,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    lessonIconLocked: {
        backgroundColor: COLORS.background,
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
    lessonTitleLocked: {
        color: COLORS.textLight,
    },
    lessonMeta: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
    },
    lessonMetaLocked: {
        color: COLORS.textLight,
    },
    lessonProgress: {
        marginTop: SPACING.sm,
    },
    lessonItemRight: {
        alignItems: 'flex-end',
    },
    progressText: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 4,
    },
});

export default LessonsScreen;
