import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card, Button, ProgressBar, QuickAction, ErrorState } from '../components';
import { mockDailyGoal } from '../constants/mockData';
import { getReviewStatus } from '../utils/api';
import { dbService } from '../services/database';

// Get API base URL from config
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

interface UserSummary {
    id: string;
    name: string;
    greeting: string;
    streakDays: number;
    avatarUrl: string | null;
}

interface CourseInfo {
    id: string;
    level: string;
}

interface LessonInfo {
    id: string;
    title: string;
    description: string | null;
}

interface ProgressInfo {
    completedPercent: number;
    lastUnitId: string | null;
}

interface ContinueLearning {
    course: CourseInfo;
    lesson: LessonInfo;
    progress: ProgressInfo;
}

interface VocabItem {
    id: number;
    word: string;
    pinyin: string;
    meaning: string;
    audio_url?: string;
}

interface GrammarPoint {
    id: number;
    title: string;
    explanation: string;
    lesson_id: number;
    lesson_title: string;
    examples: { id: number; example: string; translation: string }[];
}

interface HomeScreenProps {
    navigation?: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
    const [continueLearning, setContinueLearning] = useState<ContinueLearning | null>(null);
    const [reviewDueCount, setReviewDueCount] = useState(0);
    const [randomVocab, setRandomVocab] = useState<VocabItem[]>([]);
    const [featuredGrammar, setFeaturedGrammar] = useState<GrammarPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVocabLoading, setIsVocabLoading] = useState(false);
    const [isGrammarLoading, setIsGrammarLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollViewRef = React.useRef<ScrollView>(null);
    const vocabSectionRef = React.useRef<View>(null);
    const grammarSectionRef = React.useRef<View>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchUserSummary(),
            fetchContinueLearning(),
            fetchReviewStatus(),
            fetchRandomVocab(),
            fetchFeaturedGrammar()
        ]);
        setIsLoading(false);
    };

    const fetchUserSummary = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                setError('Chưa đăng nhập');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/me/summary`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: UserSummary = await response.json();
                setUserSummary(data);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Không thể tải thông tin');
            }
        } catch (err) {
            console.error('Error fetching user summary:', err);
            setError('Không thể kết nối đến server');
        }
    };

    const fetchReviewStatus = async () => {
        try {
            const status = await getReviewStatus();
            if (status) setReviewDueCount(status.due_count);
        } catch (err) {
            console.error('Error fetching review status:', err);
        }
    };

    const fetchContinueLearning = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/v1/learning/continue`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data: ContinueLearning = await response.json();
                setContinueLearning(data);
            }
        } catch (err) {
            console.error('Error fetching continue learning:', err);
        }
    };

    const fetchRandomVocab = async () => {
        try {
            setIsVocabLoading(true);

            // 1. Try SQLite first
            const localData = await dbService.getRandomVocabulary(10);
            if (localData && localData.length > 0) {
                const mappedData = localData.map((item: any) => ({
                    id: item.id,
                    word: item.word,
                    pinyin: item.pinyin,
                    meaning: item.meaning,
                    audio_url: item.audio_url
                }));
                setRandomVocab(mappedData);
                setIsVocabLoading(false);
                
                // Still refresh from API silently
                fetchRandomVocabFromAPI(true);
            } else {
                await fetchRandomVocabFromAPI(false);
            }
        } catch (err) {
            console.error('Error fetching random vocab:', err);
            await fetchRandomVocabFromAPI(false);
        } finally {
            setIsVocabLoading(false);
        }
    };

    const fetchRandomVocabFromAPI = async (silent = false) => {
        try {
            const response = await fetch(`${API_BASE_URL}/characters/random?limit=10`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const mappedData = data.map((item: any) => ({
                    id: item.id,
                    word: item.character || item.word,
                    pinyin: item.pinyin,
                    meaning: item.meaning,
                    audio_url: item.audio_url
                }));
                setRandomVocab(mappedData);
                // Cache it
                await AsyncStorage.setItem('cached_vocab', JSON.stringify(mappedData));
            } else if (!silent) {
                // Try to load from cache
                const cached = await AsyncStorage.getItem('cached_vocab');
                if (cached) setRandomVocab(JSON.parse(cached));
            }
        } catch (err) {
            if (!silent) {
                console.error('Error fetching random vocab API:', err);
                const cached = await AsyncStorage.getItem('cached_vocab');
                if (cached) setRandomVocab(JSON.parse(cached));
            }
        }
    };

    const fetchFeaturedGrammar = async () => {
        try {
            setIsGrammarLoading(true);
            
            // 1. Try SQLite first
            const localData = await dbService.getFeaturedGrammar(3);
            if (localData && localData.length > 0) {
                setFeaturedGrammar(localData);
                setIsGrammarLoading(false);
                
                // Still refresh from API silently
                fetchFeaturedGrammarFromAPI(true);
            } else {
                await fetchFeaturedGrammarFromAPI(false);
            }
        } catch (err) {
            console.error('Error fetching featured grammar:', err);
            await fetchFeaturedGrammarFromAPI(false);
        } finally {
            setIsGrammarLoading(false);
        }
    };

    const fetchFeaturedGrammarFromAPI = async (silent = false) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/lessons/grammar/featured?limit=3`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFeaturedGrammar(data);
            }
        } catch (err) {
            if (!silent) console.error('Error fetching featured grammar API:', err);
        }
    };

    const playAudio = (text: string) => {
        Speech.speak(text, {
            language: 'zh-CN',
            rate: 0.8,
        });
    };

    const handleContinueLearning = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) {
                console.error('No token found');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/learning/resume`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Resume learning response:', data);

                // Determine lesson ID and HSK level from different possible response structures
                let rawLessonId = data.lesson?.id || data.id || data.lesson_id;

                // Sanitize lessonId: remove "lesson_" prefix if it exists (e.g., "lesson_1" -> 1)
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
                } else {
                    alert('Không tìm thấy bài học đang học dở');
                }
            } else {
                const errorData = await response.json();
                console.error('Resume learning error:', errorData);
                alert(`Lỗi: ${errorData.detail || 'Không thể tiếp tục học'}`);
            }
        } catch (err) {
            console.error('Error resuming learning:', err);
        }
    };

    const getGreetingText = (): string => {
        if (userSummary?.greeting) {
            // API already returns full greeting like "Chào buổi tối"
            return userSummary.greeting.toUpperCase();
        }
        const hour = new Date().getHours();
        if (hour < 12) return 'CHÀO BUỔI SÁNG';
        if (hour < 18) return 'CHÀO BUỔI CHIỀU';
        return 'CHÀO BUỔI TỐI';
    };

    const progressPercentage = (mockDailyGoal.completedMinutes / mockDailyGoal.targetMinutes) * 100;
    const remainingMinutes = mockDailyGoal.targetMinutes - mockDailyGoal.completedMinutes;

    const userName = userSummary?.name || 'Bạn';
    const streakDays = userSummary?.streakDays || 0;
    const avatarInitial = userName.charAt(0).toUpperCase();

    if (!userSummary && !isLoading && error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ErrorState message={error} onRetry={fetchData} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarContainer}>
                            {userSummary?.avatarUrl ? (
                                <Image
                                    source={{ uri: userSummary.avatarUrl }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{avatarInitial}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.greetingContainer}>
                            {isLoading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <>
                                    <Text style={styles.greeting}>{getGreetingText()}</Text>
                                    <Text style={styles.userName}>{userName} 👋</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.streakBadge}>
                        <Feather name="zap" size={16} color={COLORS.accent} />
                        <Text style={styles.streakText}>{streakDays} ngày</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Lesson Card */}
                {continueLearning && (
                    <Card style={styles.lessonCard} variant="elevated">
                        <View style={styles.lessonCardContent}>
                            <View style={styles.lessonTextContent}>
                                <View style={styles.pinyinBadge}>
                                    <Text style={styles.pinyinBadgeText}>{continueLearning.course.level}</Text>
                                </View>
                                <Text style={styles.chineseText}>你好</Text>
                            </View>
                            <View style={styles.illustrationContainer}>
                                <View style={styles.illustration}>
                                    <Text style={styles.illustrationEmoji}>👩🏻</Text>
                                </View>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Review Alert badge if reviews are due */}
                {reviewDueCount > 0 && (
                    <TouchableOpacity
                        onPress={() => navigation?.navigate('Review')}
                        style={styles.reviewAlert}
                    >
                        <View style={styles.reviewAlertLeft}>
                            <View style={styles.reviewIconContainer}>
                                <Feather name="refresh-cw" size={20} color="white" />
                                <View style={styles.reviewBadge}>
                                    <Text style={styles.reviewBadgeText}>{reviewDueCount}</Text>
                                </View>
                            </View>
                            <View style={styles.reviewTextContainer}>
                                <Text style={styles.reviewAlertTitle}>Bạn có từ vựng cần ôn tập!</Text>
                                <Text style={styles.reviewAlertSubtitle}>Sử dụng SRS để nhớ lâu hơn</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                )}

                {/* Continue Learning Section */}
                {continueLearning && (
                    <View style={styles.continueSection}>
                        <Text style={styles.sectionLabel}>TIẾP TỤC HỌC</Text>
                        <Text style={styles.lessonTitle}>
                            {continueLearning.course.level} – {continueLearning.lesson.title}
                        </Text>
                        {continueLearning.lesson.description && (
                            <Text style={styles.lessonDescription}>
                                {continueLearning.lesson.description}
                            </Text>
                        )}
                        <ProgressBar
                            progress={continueLearning.progress.completedPercent}
                            height={6}
                            backgroundColor={COLORS.progressTrack}
                            progressColor={COLORS.primary}
                            style={styles.lessonProgressBar}
                        />
                        <Text style={styles.progressText}>
                            Hoàn thành {Math.round(continueLearning.progress.completedPercent)}%
                        </Text>
                        <Button
                            title="Tiếp tục học"
                            onPress={handleContinueLearning}
                            icon={<Feather name="play" size={16} color={COLORS.textWhite} />}
                            iconPosition="right"
                            fullWidth
                            style={styles.continueButton}
                        />
                    </View>
                )}

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
                            icon="play-circle"
                            title="Tiếp tục học"
                            onPress={handleContinueLearning}
                            iconColor={COLORS.primary}
                            iconBackgroundColor={COLORS.progressBackground}
                        />
                        <View style={styles.quickActionSpacer} />
                        <QuickAction
                            icon="refresh-cw"
                            title="Ôn tập (SRS)"
                            badge={reviewDueCount > 0 ? reviewDueCount : undefined}
                            onPress={() => navigation?.navigate('Review')}
                            iconColor={COLORS.secondary}
                            iconBackgroundColor="#EBF3FC"
                        />
                    </View>
                    <View style={[styles.quickActionsGrid, { marginTop: SPACING.md }]}>
                        <QuickAction
                            icon="zap"
                            title="Thử thách ngày"
                            onPress={() => navigation?.navigate('SpeakingPractice')}
                            iconColor="#FF9800"
                            iconBackgroundColor="#FFF3E0"
                        />
                        <View style={styles.quickActionSpacer} />
                        <QuickAction
                            icon="bar-chart-2"
                            title="Tiến độ học"
                            onPress={() => navigation?.navigate('MainTabs', { screen: 'Progress' })}
                            iconColor="#4CAF50"
                            iconBackgroundColor="#E8F5E9"
                        />
                    </View>
                </View>

                {/* Random Vocabulary Section */}
                <View style={styles.vocabSection} ref={vocabSectionRef}>
                    <View style={styles.quickActionsHeader}>
                        <Text style={styles.sectionTitle}>Gợi ý từ vựng hôm nay</Text>
                        <TouchableOpacity onPress={fetchRandomVocab} disabled={isVocabLoading}>
                            {isVocabLoading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {randomVocab.length > 0 ? (
                        <View style={styles.vocabList}>
                            {randomVocab.map((item) => (
                                <Card key={item.id} style={styles.vocabItemCard} variant="elevated">
                                    <View style={styles.vocabItemRow}>
                                        <View style={styles.vocabMainInfo}>
                                            <Text style={styles.vocabWord}>{item.word}</Text>
                                            <View style={styles.vocabDetails}>
                                                <Text style={styles.vocabPinyin}>{item.pinyin}</Text>
                                                <Text style={styles.vocabMeaning} numberOfLines={1}>
                                                    {item.meaning}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.vocabAudioButton}
                                            onPress={() => playAudio(item.word)}
                                        >
                                            <Ionicons name="volume-medium" size={24} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    ) : (
                        !isVocabLoading && <Text style={styles.emptyText}>Không có từ vựng nào được tìm thấy.</Text>
                    )}
                </View>

                {/* Featured Grammar Section */}
                <View style={styles.grammarSection} ref={grammarSectionRef}>
                    <View style={styles.quickActionsHeader}>
                        <Text style={styles.sectionTitle}>Ngữ pháp quan trọng</Text>
                        <TouchableOpacity onPress={fetchFeaturedGrammar} disabled={isGrammarLoading}>
                            {isGrammarLoading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {featuredGrammar.length > 0 ? (
                        <View style={styles.vocabList}>
                            {featuredGrammar.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => navigation?.navigate('LessonDetail', { lessonId: item.lesson_id })}
                                >
                                    <Card style={styles.grammarCard} variant="elevated">
                                        <View style={styles.grammarCardHeader}>
                                            <View style={styles.grammarBadge}>
                                                <Text style={styles.grammarBadgeText}>Cấu trúc</Text>
                                            </View>
                                            <Text style={styles.grammarLessonTitle}>{item.lesson_title}</Text>
                                        </View>
                                        <Text style={styles.grammarTitle}>{item.title}</Text>
                                        <Text style={styles.grammarExplanation} numberOfLines={2}>
                                            {item.explanation}
                                        </Text>
                                        {item.examples.length > 0 && (
                                            <View style={styles.grammarExampleContainer}>
                                                <Text style={styles.grammarExampleText}>
                                                    "{item.examples[0].example}"
                                                </Text>
                                            </View>
                                        )}
                                    </Card>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        !isGrammarLoading && <Text style={styles.emptyText}>Đang cập nhật thêm điểm ngữ pháp...</Text>
                    )}
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
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
    lessonProgressBar: {
        marginBottom: SPACING.xs,
    },
    progressText: {
        fontSize: FONT_SIZES.captionSmall,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
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
    reviewAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.progressBackground,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    reviewAlertLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reviewIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    reviewBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    reviewBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    reviewTextContainer: {},
    reviewAlertTitle: {
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    reviewAlertSubtitle: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textSecondary,
    },
    vocabSection: {
        marginBottom: SPACING.lg,
    },
    vocabList: {
        marginTop: SPACING.xs,
    },
    vocabItemCard: {
        marginBottom: SPACING.sm,
        padding: SPACING.md,
    },
    vocabItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    vocabMainInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    vocabWord: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginRight: SPACING.md,
        minWidth: 60,
    },
    vocabDetails: {
        flex: 1,
    },
    vocabPinyin: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 2,
    },
    vocabMeaning: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
    },
    vocabAudioButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: SPACING.sm,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: SPACING.lg,
    },
    grammarSection: {
        marginBottom: SPACING.lg,
    },
    grammarCard: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondary,
    },
    grammarCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    grammarBadge: {
        backgroundColor: COLORS.secondary + '20',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    grammarBadgeText: {
        color: COLORS.secondary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    grammarLessonTitle: {
        fontSize: 10,
        color: COLORS.textLight,
    },
    grammarTitle: {
        fontSize: FONT_SIZES.body,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    grammarExplanation: {
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: SPACING.sm,
    },
    grammarExampleContainer: {
        backgroundColor: COLORS.background,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
    },
    grammarExampleText: {
        fontSize: FONT_SIZES.caption,
        color: COLORS.textPrimary,
        fontStyle: 'italic',
    },
});

export default HomeScreen;
