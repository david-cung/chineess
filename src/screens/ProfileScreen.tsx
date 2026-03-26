import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button } from '../components';
import { getCurrentUser, getStatsOverview, getUserAchievements, updateProfile } from '../utils/api';
import { SyncService } from '../services/syncService';
import { Achievement, StatsOverview } from '../types';

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
    const navigation = useNavigation();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<StatsOverview | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [dailyGoal, setDailyGoal] = useState(15);
    const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [offlineDownload, setOfflineDownload] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isNameModalVisible, setIsNameModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            const result = await SyncService.performFullSync();
            if (result.success) {
                alert('Đồng bộ dữ liệu thành công!');
                loadData(); // Refresh profile data too
            } else {
                alert(`Đồng bộ thất bại: ${result.error || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            console.error('Manual sync error:', error);
            alert('Đồng bộ thất bại. Vui lòng thử lại sau.');
        } finally {
            setIsSyncing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData();
            loadSettings();
        }, [])
    );

    const [notifications, setNotifications] = useState(true);

    const loadSettings = async () => {
        try {
            const savedGoal = await AsyncStorage.getItem('daily_goal');
            if (savedGoal) setDailyGoal(parseInt(savedGoal));
            
            const savedDarkMode = await AsyncStorage.getItem('dark_mode');
            if (savedDarkMode) setDarkMode(savedDarkMode === 'true');

            const savedNotifications = await AsyncStorage.getItem('notifications');
            if (savedNotifications) setNotifications(savedNotifications === 'true');
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    };

    const toggleNotifications = async (value: boolean) => {
        setNotifications(value);
        await AsyncStorage.setItem('notifications', value.toString());
    };

    const saveGoal = async (goal: number) => {
        setDailyGoal(goal);
        await AsyncStorage.setItem('daily_goal', goal.toString());
        setIsGoalModalVisible(false);
    };

    const toggleDarkMode = async (value: boolean) => {
        setDarkMode(value);
        await AsyncStorage.setItem('dark_mode', value.toString());
    };

    const handleUpdateName = async () => {
        if (!newName.trim()) return;
        setIsUpdatingName(true);
        try {
            const updatedUser = await updateProfile({ full_name: newName.trim() });
            if (updatedUser) {
                setUser(updatedUser);
                setIsNameModalVisible(false);
            }
        } catch (error) {
            console.error('Error updating name:', error);
        } finally {
            setIsUpdatingName(false);
        }
    };

    const openNameModal = () => {
        setNewName(user?.full_name || user?.username || '');
        setIsNameModalVisible(true);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [userData, statsData, achievementsData] = await Promise.all([
                getCurrentUser(),
                getStatsOverview(),
                getUserAchievements()
            ]);
            setUser(userData);
            setStats(statsData);
            setAchievements(achievementsData || []);
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('access_token');
            // Navigate back to Login screen
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                })
            );
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const getDisplayName = () => {
        if (user?.full_name) return user.full_name;
        if (user?.username) return user.username;
        return 'Người dùng';
    };

    const getHskLevel = () => {
        return `HSK ${user?.level || 1}`;
    };

    const goalOptions = [
        { label: 'Dễ (5 phút)', value: 5 },
        { label: 'Vừa (15 phút)', value: 15 },
        { label: 'Chăm chỉ (30 phút)', value: 30 },
        { label: 'Cường độ cao (60 phút)', value: 60 },
    ];

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
                        {user?.avatar ? (
                             <Text style={styles.avatarLargeText}>
                                 {getDisplayName().charAt(0).toUpperCase()}
                             </Text>
                        ) : (
                            <Text style={styles.avatarLargeText}>
                                {getDisplayName().charAt(0).toUpperCase()}
                            </Text>
                        )}
                        <TouchableOpacity style={styles.editAvatarButton} onPress={openNameModal}>
                            <Feather name="edit-2" size={12} color={COLORS.textWhite} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.profileName}>{getDisplayName()}</Text>
                    <Text style={styles.profileLevel}>{getHskLevel()} – {stats?.current_streak || 0} ngày liên tiếp</Text>
                    
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.xp || 0}</Text>
                            <Text style={styles.statLabel}>XP</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.accuracy_percent ? Math.round(stats.accuracy_percent) : 0}%</Text>
                            <Text style={styles.statLabel}>Chính xác</Text>
                        </View>
                    </View>
                </View>

                {/* Achievements Section */}
                <Text style={styles.sectionTitle}>THÀNH TỰU</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={styles.achievementsContainer}
                >
                    {achievements.length > 0 ? achievements.map((ach) => (
                        <View key={ach.id} style={[styles.achievementCard, !ach.isUnlocked && styles.achievementLocked]}>
                            <View style={[styles.achievementIcon, { backgroundColor: ach.isUnlocked ? COLORS.primary + '15' : COLORS.border + '30' }]}>
                                <Feather 
                                    name={(ach.icon as any) || 'award'} 
                                    size={24} 
                                    color={ach.isUnlocked ? COLORS.primary : COLORS.textLight} 
                                />
                            </View>
                            <Text style={[styles.achievementTitle, !ach.isUnlocked && { color: COLORS.textLight }]}>{ach.title}</Text>
                        </View>
                    )) : (
                        <View style={styles.emptyAchievements}>
                            <Text style={styles.emptyText}>Chưa có thành tựu nào</Text>
                        </View>
                    )}
                </ScrollView>

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
                        subtitle={`${dailyGoal} phút mỗi ngày`}
                        onPress={() => setIsGoalModalVisible(true)}
                    />
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon="bell"
                        iconColor={COLORS.accent}
                        iconBgColor="#FFF8E1"
                        title="Thông báo"
                        showArrow={false}
                        rightElement={
                            <Switch
                                value={notifications}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.cardBackground}
                            />
                        }
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
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                thumbColor={COLORS.cardBackground}
                            />
                        }
                    />
                </Card>

                {/* Goal Selection Modal (Simple Implementation using a list of cards if shown below) */}
                {isGoalModalVisible && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Chọn mục tiêu của bạn</Text>
                            {goalOptions.map((opt) => (
                                <TouchableOpacity 
                                    key={opt.value} 
                                    style={[styles.goalOption, dailyGoal === opt.value && styles.goalOptionSelected]}
                                    onPress={() => saveGoal(opt.value)}
                                >
                                    <Text style={[styles.goalOptionText, dailyGoal === opt.value && styles.goalOptionTextSelected]}>
                                        {opt.label}
                                    </Text>
                                    {dailyGoal === opt.value && <Feather name="check" size={18} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                            <Button 
                                title="Đóng" 
                                variant="outline" 
                                onPress={() => setIsGoalModalVisible(false)} 
                                style={{ marginTop: SPACING.md }}
                            />
                        </View>
                    </View>
                )}

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
                    <View style={styles.settingDivider} />
                    <SettingItem
                        icon="refresh-cw"
                        iconColor={COLORS.primary}
                        iconBgColor={COLORS.primaryLight}
                        title="Đồng bộ dữ liệu"
                        subtitle={isSyncing ? "Đang đồng bộ..." : "Cập nhật nội dung bài học"}
                        onPress={handleManualSync}
                        rightElement={isSyncing ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
                        showArrow={!isSyncing}
                    />
                </Card>

                {/* Name Edit Modal */}
                {isNameModalVisible && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Đổi tên hiển thị</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="Nhập tên mới"
                                autoFocus
                            />
                            <View style={styles.modalButtons}>
                                <Button 
                                    title="Hủy" 
                                    variant="outline" 
                                    onPress={() => setIsNameModalVisible(false)} 
                                    style={styles.modalButton}
                                />
                                <Button 
                                    title="Lưu" 
                                    onPress={handleUpdateName} 
                                    style={styles.modalButton}
                                    loading={isUpdatingName}
                                    disabled={isUpdatingName}
                                />
                            </View>
                        </View>
                    </View>
                )}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
        marginBottom: SPACING.md,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.small,
    },
    statItem: {
        alignItems: 'center',
        minWidth: 80,
    },
    statValue: {
        fontSize: FONT_SIZES.h3,
        fontWeight: '700',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textLight,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.divider,
        marginHorizontal: SPACING.lg,
    },
    achievementsContainer: {
        paddingVertical: SPACING.sm,
    },
    achievementCard: {
        width: 100,
        alignItems: 'center',
        marginRight: SPACING.md,
        backgroundColor: COLORS.cardBackground,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        ...SHADOWS.small,
    },
    achievementLocked: {
        opacity: 0.6,
    },
    achievementIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xs,
    },
    achievementTitle: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    emptyAchievements: {
        padding: SPACING.md,
    },
    emptyText: {
        color: COLORS.textLight,
        fontStyle: 'italic',
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
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        ...SHADOWS.medium,
    },
    modalTitle: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
        textAlign: 'center',
    },
    goalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    goalOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    goalOptionText: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textPrimary,
    },
    goalOptionTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
    textInput: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.divider,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: FONT_SIZES.body,
        color: COLORS.textPrimary,
        marginBottom: SPACING.lg,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 0.48,
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
