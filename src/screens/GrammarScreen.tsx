import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    Animated,
    Image,
} from 'react-native';
import * as Speech from 'expo-speech';
import { trackLearningProgress } from '../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design System Colors
const COLORS = {
    primary: '#E53935',
    primaryLight: '#FDECEA',
    background: '#F8F9FA',
    cardBackground: '#FFFFFF',
    textPrimary: '#212121',
    textSecondary: '#757575',
    textMuted: '#9E9E9E',
    border: '#E0E0E0',
    star: '#FFB300',
    success: '#4CAF50',
};

interface GrammarExample {
    id: number;
    chinese: string;
    pinyin: string;
    vietnamese: string;
    grammar_point?: string;
    image_url?: string;
    keyword?: string;
    keyword_pinyin?: string;
}

interface GrammarScreenProps {
    route?: any;
    navigation?: any;
}

const GrammarScreen: React.FC<GrammarScreenProps> = ({ route, navigation }) => {
    const [grammarList, setGrammarList] = useState<GrammarExample[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Lesson metadata from API
    const [lessonInfo, setLessonInfo] = useState<{ hskLevel: number, title: string, lessonNumber: number } | null>(null);

    // Get lesson ID and HSK level from route params
    const lessonId = route?.params?.lessonId || 1;
    const hskLevel = route?.params?.hskLevel || 1;

    // Animation for card swipe
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchGrammar();
    }, [lessonId]);

    // Track progress when current index changes
    useEffect(() => {
        if (grammarList.length > 0 && grammarList[currentIndex]) {
            const example = grammarList[currentIndex];
            const timer = setTimeout(() => {
                trackLearningProgress({
                    item_type: 'grammar_example',
                    item_id: example.id,
                    completed: true,
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, grammarList]);

    const fetchGrammar = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('access_token');

            const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });

            if (response.ok) {
                const data = await response.json();
                const grammar = data.grammar || [];
                setGrammarList(grammar.length > 0 ? grammar : getMockGrammar());

                setLessonInfo({
                    hskLevel: data.hsk_level || hskLevel,
                    title: data.title || `Bài ${lessonId}`,
                    lessonNumber: lessonId,
                });
            } else {
                setGrammarList(getMockGrammar());
            }
        } catch (err) {
            console.error('Error fetching grammar:', err);
            setGrammarList(getMockGrammar());
        } finally {
            setIsLoading(false);
        }
    };

    const getMockGrammar = (): GrammarExample[] => [
        {
            id: 1,
            chinese: '我喜欢喝茶。',
            pinyin: 'Wǒ xǐhuān hē chá.',
            vietnamese: 'Tôi thích uống trà.',
            keyword: '喜欢',
            keyword_pinyin: 'xǐhuān',
            image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400',
        },
        {
            id: 2,
            chinese: '他是我的朋友。',
            pinyin: 'Tā shì wǒ de péngyou.',
            vietnamese: 'Anh ấy là bạn của tôi.',
            keyword: '朋友',
            keyword_pinyin: 'péngyou',
            image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
        },
        {
            id: 3,
            chinese: '今天天气很好。',
            pinyin: 'Jīntiān tiānqì hěn hǎo.',
            vietnamese: 'Hôm nay thời tiết rất đẹp.',
            keyword: '天气',
            keyword_pinyin: 'tiānqì',
            image_url: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=400',
        },
        {
            id: 4,
            chinese: '我想吃苹果。',
            pinyin: 'Wǒ xiǎng chī píngguǒ.',
            vietnamese: 'Tôi muốn ăn táo.',
            keyword: '苹果',
            keyword_pinyin: 'píngguǒ',
            image_url: 'https://images.unsplash.com/photo-1568702846914-96b305d2uj8e?w=400',
        },
        {
            id: 5,
            chinese: '她会说中文。',
            pinyin: 'Tā huì shuō zhōngwén.',
            vietnamese: 'Cô ấy biết nói tiếng Trung.',
            keyword: '中文',
            keyword_pinyin: 'zhōngwén',
            image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
        },
    ];

    const handleGoBack = () => {
        navigation?.goBack();
    };

    const handleNext = () => {
        if (currentIndex < grammarList.length - 1) {
            Animated.timing(translateX, {
                toValue: -SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                translateX.setValue(0);
                setCurrentIndex(currentIndex + 1);
            });
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            Animated.timing(translateX, {
                toValue: SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                translateX.setValue(0);
                setCurrentIndex(currentIndex - 1);
            });
        }
    };

    const playAudio = () => {
        const currentExample = grammarList[currentIndex];
        if (currentExample) {
            setIsSpeaking(true);
            Speech.speak(currentExample.chinese, {
                language: 'zh-CN',
                rate: 0.8,
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
            });
        }
    };

    const handleRepeat = () => {
        playAudio();
    };

    const handlePractice = () => {
        // TODO: Navigate to speaking practice with this sentence
        console.log('Practice speaking:', grammarList[currentIndex]?.chinese);
    };

    // Render highlighted text with keyword in red
    const renderHighlightedText = (text: string, keyword?: string, isLarge: boolean = false) => {
        if (!keyword) {
            return (
                <Text style={isLarge ? styles.chineseText : styles.pinyinText}>
                    {text}
                </Text>
            );
        }

        const parts = text.split(keyword);
        if (parts.length === 1) {
            return (
                <Text style={isLarge ? styles.chineseText : styles.pinyinText}>
                    {text}
                </Text>
            );
        }

        return (
            <Text style={isLarge ? styles.chineseText : styles.pinyinText}>
                {parts[0]}
                <Text style={styles.highlightedText}>{keyword}</Text>
                {parts[1]}
            </Text>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải câu mẫu...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentExample = grammarList[currentIndex];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <Feather name="chevron-left" size={28} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        HSK {lessonInfo?.hskLevel || hskLevel} - Bài {lessonInfo?.lessonNumber || lessonId}
                    </Text>
                    <Text style={styles.headerSubtitle}>HỌC MẪU CÂU</Text>
                </View>
                <View style={styles.headerRight} />
            </View>

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.cardContainer,
                        { transform: [{ translateX }] }
                    ]}
                >
                    {/* Image Section */}
                    <View style={styles.imageSection}>
                        {currentExample?.image_url ? (
                            <Image
                                source={{ uri: currentExample.image_url }}
                                style={styles.exampleImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <Feather name="image" size={48} color={COLORS.textMuted} />
                            </View>
                        )}
                    </View>

                    {/* Content Card */}
                    <View style={styles.contentCard}>
                        {/* Chinese Sentence */}
                        <View style={styles.sentenceContainer}>
                            {renderHighlightedText(
                                currentExample?.chinese || '',
                                currentExample?.keyword,
                                true
                            )}
                        </View>

                        {/* Pinyin */}
                        <View style={styles.pinyinContainer}>
                            {renderHighlightedText(
                                currentExample?.pinyin || '',
                                currentExample?.keyword_pinyin,
                                false
                            )}
                        </View>

                        {/* Vietnamese Translation */}
                        <Text style={styles.vietnameseText}>
                            {currentExample?.vietnamese || ''}
                        </Text>

                        {/* Action Buttons */}
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={[styles.circleButton, isSpeaking && styles.circleButtonActive]}
                                onPress={playAudio}
                            >
                                <Feather
                                    name="volume-2"
                                    size={24}
                                    color={isSpeaking ? COLORS.cardBackground : COLORS.primary}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.circleButton}
                                onPress={handleRepeat}
                            >
                                <Feather name="rotate-cw" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Instruction Text */}
                        <Text style={styles.instructionText}>
                            Nhấn để nghe và đọc theo
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {/* Bottom Section */}
            <View style={styles.bottomContainer}>
                {/* Progress indicator */}
                <Text style={styles.progressIndicator}>
                    {currentIndex + 1} / {grammarList.length}
                </Text>

                {/* Next Button */}
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        currentIndex >= grammarList.length - 1 && styles.nextButtonDisabled,
                    ]}
                    onPress={handleNext}
                    disabled={currentIndex >= grammarList.length - 1}
                >
                    <Text style={styles.nextButtonText}>Tiếp theo</Text>
                    <Feather name="arrow-right" size={20} color={COLORS.cardBackground} />
                </TouchableOpacity>

                {/* Practice Button */}
                <TouchableOpacity
                    style={styles.practiceButton}
                    onPress={handlePractice}
                >
                    <Feather name="mic" size={20} color={COLORS.primary} />
                    <Text style={styles.practiceButtonText}>Luyện nói câu này</Text>
                </TouchableOpacity>

                {/* Previous Button (smaller, at bottom) */}
                {currentIndex > 0 && (
                    <TouchableOpacity
                        style={styles.prevButton}
                        onPress={handlePrevious}
                    >
                        <Feather name="chevron-left" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.prevButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        backgroundColor: COLORS.cardBackground,
    },
    backButton: {
        padding: 8,
        width: 44,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textSecondary,
        marginTop: 2,
        letterSpacing: 0.5,
    },
    headerRight: {
        width: 44,
    },
    cardContainer: {
        flex: 1,
    },
    imageSection: {
        width: '100%',
        height: 180,
        backgroundColor: COLORS.primaryLight,
        overflow: 'hidden',
    },
    exampleImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
    },
    contentCard: {
        backgroundColor: COLORS.cardBackground,
        marginHorizontal: 16,
        marginTop: -20,
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    sentenceContainer: {
        marginBottom: 12,
    },
    chineseText: {
        fontSize: 28,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
        lineHeight: 40,
    },
    highlightedText: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    pinyinContainer: {
        marginBottom: 12,
    },
    pinyinText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    vietnameseText: {
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 24,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 16,
    },
    circleButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleButtonActive: {
        backgroundColor: COLORS.primary,
    },
    instructionText: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
    bottomContainer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 12,
        backgroundColor: COLORS.cardBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
    },
    progressIndicator: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 12,
    },
    nextButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 12,
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.cardBackground,
    },
    practiceButton: {
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderRadius: 16,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    practiceButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    prevButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        gap: 4,
    },
    prevButtonText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});

export default GrammarScreen;
