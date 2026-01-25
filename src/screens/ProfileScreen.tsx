import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button } from '../components';
import { mockUser } from '../constants/mockData';

interface SettingItemProps {
    icon: keyof typeof Feather.glyphMap;
    iconColor?: string;
    iconBgColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    iconColor = COLORS.textPrimary,
    iconBgColor = COLORS.background,
    title,
    subtitle,
    onPress,
    rightElement,
    showArrow = true,
}) => (
    <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
    >
        <View style={[styles.settingIconContainer, { backgroundColor: iconBgColor }]}>
            <Feather name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {rightElement}
        {showArrow && !rightElement && (
            <Feather name="chevron-right" size={20} color={COLORS.textLight} />
        )}
    </TouchableOpacity>
);

const ProfileScreen: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [offlineDownload, setOfflineDownload] = useState(true);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton}>
                    <Feather name="settings" size={22} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hồ sơ</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>D</Text>
                        <TouchableOpacity style={styles.editAvatarButton}>
                            <Feather name="edit-2" size={12} color={COLORS.textWhite} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{mockUser.name}</Text>
                    <Text style={styles.profileLevel}>Người mới bắt đầu – {mockUser.level}</Text>
                </View>

                {/* Premium Card */}
                <Card style={styles.premiumCard} variant="elevated">
                    <View style={styles.premiumHeader}>
                        <View style={styles.premiumBadge}>
                            <Feather name="star" size={16} color={COLORS.accent} />
                        </View>
                        <Text style={styles.premiumTitle}>Nâng cấp Premium</Text>
                    </View>
                    <Text style={styles.premiumDescription}>
                        Mở khóa tất cả cấp độ HSK, chế độ học ngoại tuyến và gỡ bỏ quảng cáo hoàn toàn.
                    </Text>
                    <Button
                        title="Nâng cấp ngay"
                        onPress={() => { }}
                        variant="outline"
                        style={styles.premiumButton}
                    />
                </Card>

                {/* Settings Section */}
                <Text style={styles.sectionTitle}>CÀI ĐẶT HỌC TẬP</Text>
                <Card style={styles.settingsCard} variant="default" padding="none">
                    <SettingItem
                        icon="target"
                        iconColor={COLORS.primary}
                        iconBgColor={COLORS.progressBackground}
                        title="Mục tiêu học tập"
                        onPress={() => { }}
                    />
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon="bell"
                        iconColor={COLORS.accent}
                        iconBgColor="#FFF8E1"
                        title="Thông báo"
                        onPress={() => { }}
                    />
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon="moon"
                        iconColor="#5C6BC0"
                        iconBgColor="#E8EAF6"
                        title="Chế độ tối"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.cardBackground}
                            />
                        }
                    />
                </Card>

                {/* Language Settings */}
                <Card style={styles.settingsCard} variant="default" padding="none">
                    <SettingItem
                        icon="globe"
                        iconColor={COLORS.secondary}
                        iconBgColor="#E3F2FD"
                        title="Ngôn ngữ"
                        subtitle="Tiếng Việt"
                        onPress={() => { }}
                        rightElement={
                            <View style={styles.checkmark}>
                                <Feather name="check" size={16} color={COLORS.success} />
                            </View>
                        }
                        showArrow={false}
                    />
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon="download-cloud"
                        iconColor={COLORS.success}
                        iconBgColor="#E8F5E9"
                        title="Tải bài học offline"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={offlineDownload}
                                onValueChange={setOfflineDownload}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.cardBackground}
                            />
                        }
                    />
                </Card>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton}>
                    <Feather name="log-out" size={18} color={COLORS.primary} />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
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
    headerButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xxl,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    avatarLargeText: {
        color: COLORS.textWhite,
        fontSize: 40,
        fontWeight: '700',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.textPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.cardBackground,
    },
    profileName: {
        fontSize: FONT_SIZES.h2,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    profileLevel: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
    },
    premiumCard: {
        backgroundColor: COLORS.progressBackground,
        marginBottom: SPACING.lg,
        padding: SPACING.lg,
    },
    premiumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    premiumBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.accent + '30',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    premiumTitle: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '700',
        color: COLORS.primary,
    },
    premiumDescription: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginBottom: SPACING.md,
    },
    premiumButton: {
        alignSelf: 'stretch',
    },
    sectionTitle: {
        fontSize: FONT_SIZES.caption,
        fontWeight: '600',
        color: COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
    },
    settingsCard: {
        marginBottom: SPACING.md,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: FONT_SIZES.body,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    settingSubtitle: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    settingDivider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginLeft: 72,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.success + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        marginTop: SPACING.md,
    },
    logoutText: {
        fontSize: FONT_SIZES.body,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: SPACING.sm,
    },
});

export default ProfileScreen;
