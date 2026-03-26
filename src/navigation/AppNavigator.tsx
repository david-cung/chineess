import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, SHADOWS } from '../constants/theme';
import {
    HomeScreen,
    LessonsScreen,
    LessonDetailScreen,
    VocabularyScreen,
    GrammarScreen,
    PracticeScreen,
    ProgressScreen,
    ProfileScreen,
    LoginScreen,
    ReviewScreen,
    QuizScreen,
    SpeakingPracticeScreen,
    WritingPracticeScreen,
    RadioModeScreen,
    AIChatScreen,
    OnboardingScreen,
    OfflineReviewScreen,
} from '../screens';
import { RootTabParamList, RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

interface TabIconProps {
    focused: boolean;
    color: string;
    size: number;
}

const TabNavigator: React.FC = () => {
    const getTabBarIcon = (routeName: keyof RootTabParamList) => {
        return ({ focused, color }: TabIconProps) => {
            let iconName: keyof typeof Feather.glyphMap = 'home';

            switch (routeName) {
                case 'Home':
                    iconName = 'home';
                    break;
                case 'Lessons':
                    iconName = 'book';
                    break;
                case 'Practice':
                    iconName = 'edit-3';
                    break;
                case 'Progress':
                    iconName = 'bar-chart-2';
                    break;
                case 'Profile':
                    iconName = 'user';
                    break;
            }

            return (
                <View style={[styles.tabIconContainer, focused && styles.tabIconContainerActive]}>
                    <Feather name={iconName} size={22} color={color} />
                    {focused && <View style={styles.activeIndicator} />}
                </View>
            );
        };
    };

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarItemStyle: styles.tabBarItem,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Trang chủ',
                    tabBarIcon: getTabBarIcon('Home'),
                }}
            />
            <Tab.Screen
                name="Lessons"
                component={LessonsScreen}
                options={{
                    tabBarLabel: 'Học tập',
                    tabBarIcon: getTabBarIcon('Lessons'),
                }}
            />
            <Tab.Screen
                name="Practice"
                component={PracticeScreen}
                options={{
                    tabBarLabel: 'Luyện tập',
                    tabBarIcon: getTabBarIcon('Practice'),
                }}
            />
            <Tab.Screen
                name="Progress"
                component={ProgressScreen}
                options={{
                    tabBarLabel: 'Tiến độ',
                    tabBarIcon: getTabBarIcon('Progress'),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Cá nhân',
                    tabBarIcon: getTabBarIcon('Profile'),
                }}
            />
        </Tab.Navigator>
    );
};

import { SyncService } from '../services/syncService';
import { dbService } from '../services/database';

const AppNavigator: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const hasSeen = await AsyncStorage.getItem('has_seen_onboarding');
                const token = await AsyncStorage.getItem('access_token');
                
                setShowOnboarding(hasSeen !== 'true');
                setIsLoggedIn(!!token);

                if (token) {
                    // Initialize database and trigger sync in background
                    await dbService.init();
                    if (await SyncService.shouldSync()) {
                        SyncService.performFullSync(); // Background sync
                    }
                }
            } catch (err) {
                setShowOnboarding(true);
            }
        };
        checkStatus();
    }, []);

    if (showOnboarding === null) {
        return null; // Or a splash screen
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={showOnboarding ? "Onboarding" : (isLoggedIn ? "MainTabs" : "Login")}
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{
                        animation: 'fade',
                    }}
                />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen
                    name="LessonDetail"
                    component={LessonDetailScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="Vocabulary"
                    component={VocabularyScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="Grammar"
                    component={GrammarScreen}
                    options={{
                        animation: 'slide_from_right',
                    }}
                />
                <Stack.Screen
                    name="Review"
                    component={ReviewScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                    name="Quiz"
                    component={QuizScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="SpeakingPractice"
                    component={SpeakingPracticeScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="WritingPractice"
                    component={WritingPracticeScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="RadioMode"
                    component={RadioModeScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="AIChat"
                    component={AIChatScreen}
                    options={{ animation: 'slide_from_right' }}
                />
                <Stack.Screen
                    name="OfflineReview"
                    component={OfflineReviewScreen}
                    options={{ animation: 'slide_from_bottom' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.cardBackground,
        borderTopWidth: 0,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingTop: SPACING.sm,
        paddingBottom: Platform.OS === 'ios' ? 24 : SPACING.sm,
        ...SHADOWS.medium,
    },
    tabBarLabel: {
        fontSize: FONT_SIZES.captionSmall,
        fontWeight: '500',
        marginTop: 4,
    },
    tabBarItem: {
        paddingVertical: SPACING.xs,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 32,
    },
    tabIconContainerActive: {},
    activeIndicator: {
        position: 'absolute',
        bottom: -4,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },
});

export default AppNavigator;
