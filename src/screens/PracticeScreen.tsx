import React from 'react';
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
import { Card, Button, Badge, ProgressBar } from '../components';
import { mockPracticeItems, mockDailyGoal } from '../constants/mockData';
import { PracticeItem } from '../types';

const PracticeScreen: React.FC = () => {
    const completedTasks = 3;
    const totalTasks = 5;

    const getIconComponent = (iconName: string, color: string) => {
        switch (iconName) {
            case 'headphones':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: `${COLORS.secondary}15` }]}>
                        <Feather name="headphones" size={28} color={COLORS.secondary} />
                    </View>
                );
            case 'mic':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
                        <Feather name="mic" size={28} color={COLORS.primary} />
                    </View>
                );
            case 'edit-2':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: '#F3E5F5' }]}>
                        <Feather name="edit-2" size={28} color="#9C27B0" />
                    </View>
                );
            case 'help-circle':
                return (
                    <View style={[styles.practiceIconContainer, { backgroundColor: '#FFF3E0' }]}>
                        <Feather name="help-circle" size={28} color="#FF9800" />
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
                            onPress={() => { }}
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
