import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import * as Speech from 'expo-speech';
import { trackLearningProgress } from '../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design System Colors
const COLORS = {
    primary: '#E53935',
    primaryLight: '#FDECEA',
    primaryDark: '#C62828',
    background: '#F8F9FA',
    cardBackground: '#FFFFFF',
    textPrimary: '#212121',
    textSecondary: '#757575',
    textMuted: '#9E9E9E',
    border: '#E0E0E0',
    star: '#FFB300',
    success: '#4CAF50',
    info: '#2196F3',
};

// Example sentence structure
interface ExampleSentence {
    id: number;
    chinese: string;
    pinyin: string;
    vietnamese: string;
}

// Vocabulary item with examples
interface VocabularyWithExamples {
    id: number;
    word: string;
    pinyin: string;
    meaning: string;
    examples: ExampleSentence[];
}

interface GrammarScreenProps {
    route?: any;
    navigation?: any;
}

const GrammarScreen: React.FC<GrammarScreenProps> = ({ route, navigation }) => {
    // Vocabulary items with examples
    const [vocabularyItems, setVocabularyItems] = useState<VocabularyWithExamples[]>([]);
    const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [masteredExamples, setMasteredExamples] = useState<Set<number>>(new Set());

    // Lesson metadata
    const [lessonInfo, setLessonInfo] = useState<{ hskLevel: number, title: string, lessonNumber: number } | null>(null);

    // Route params
    const lessonId = route?.params?.lessonId || 1;
    const hskLevel = route?.params?.hskLevel || 1;

    // Animation
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchVocabularyWithExamples();
    }, [lessonId]);

    // Track progress when viewing examples
    useEffect(() => {
        const currentVocab = vocabularyItems[currentVocabIndex];
        const currentExample = currentVocab?.examples?.[currentExampleIndex];

        if (currentExample) {
            const timer = setTimeout(() => {
                trackLearningProgress({
                    item_type: 'grammar_example',
                    item_id: currentExample.id,
                    completed: true,
                });
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [currentVocabIndex, currentExampleIndex, vocabularyItems]);

    const fetchVocabularyWithExamples = async () => {
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
                const vocabulary = data.vocabulary || [];

                // Filter vocabulary items that have examples
                const vocabWithExamples = vocabulary
                    .filter((v: any) => v.examples && v.examples.length > 0)
                    .map((v: any) => ({
                        id: v.id,
                        word: v.word,
                        pinyin: v.pinyin,
                        meaning: v.meaning,
                        examples: v.examples.map((ex: any, idx: number) => ({
                            id: ex.id || `${v.id}_${idx}`,
                            chinese: ex.chinese || ex.sentence,
                            pinyin: ex.pinyin || ex.sentence_pinyin,
                            vietnamese: ex.vietnamese || ex.translation,
                        })),
                    }));

                setVocabularyItems(vocabWithExamples.length > 0 ? vocabWithExamples : getMockData());

                setLessonInfo({
                    hskLevel: data.hsk_level || hskLevel,
                    title: data.title || `Bài ${lessonId}`,
                    lessonNumber: lessonId,
                });
            } else {
                setVocabularyItems(getMockData());
            }
        } catch (err) {
            console.error('Error fetching vocabulary:', err);
            setVocabularyItems(getMockData());
        } finally {
            setIsLoading(false);
        }
    };

    // Mock data with vocabulary and examples
    const getMockData = (): VocabularyWithExamples[] => [
        {
            id: 1,
            word: '喜欢',
            pinyin: 'xǐhuān',
            meaning: 'thích',
            examples: [
                { id: 101, chinese: '我喜欢喝茶。', pinyin: 'Wǒ xǐhuān hē chá.', vietnamese: 'Tôi thích uống trà.' },
                { id: 102, chinese: '她喜欢看电影。', pinyin: 'Tā xǐhuān kàn diànyǐng.', vietnamese: 'Cô ấy thích xem phim.' },
                { id: 103, chinese: '你喜欢什么颜色？', pinyin: 'Nǐ xǐhuān shénme yánsè?', vietnamese: 'Bạn thích màu gì?' },
            ],
        },
        {
            id: 2,
            word: '朋友',
            pinyin: 'péngyou',
            meaning: 'bạn bè',
            examples: [
                { id: 201, chinese: '他是我的朋友。', pinyin: 'Tā shì wǒ de péngyou.', vietnamese: 'Anh ấy là bạn của tôi.' },
                { id: 202, chinese: '我有很多朋友。', pinyin: 'Wǒ yǒu hěn duō péngyou.', vietnamese: 'Tôi có rất nhiều bạn.' },
            ],
        },
        {
            id: 3,
            word: '学习',
            pinyin: 'xuéxí',
            meaning: 'học tập',
            examples: [
                { id: 301, chinese: '我在学习中文。', pinyin: 'Wǒ zài xuéxí zhōngwén.', vietnamese: 'Tôi đang học tiếng Trung.' },
                { id: 302, chinese: '学习很重要。', pinyin: 'Xuéxí hěn zhòngyào.', vietnamese: 'Việc học rất quan trọng.' },
                { id: 303, chinese: '你每天学习几个小时？', pinyin: 'Nǐ měitiān xuéxí jǐ gè xiǎoshí?', vietnamese: 'Mỗi ngày bạn học mấy tiếng?' },
            ],
        },
        {
            id: 4,
            word: '吃饭',
            pinyin: 'chī fàn',
            meaning: 'ăn cơm',
            examples: [
                { id: 401, chinese: '我们去吃饭吧。', pinyin: 'Wǒmen qù chī fàn ba.', vietnamese: 'Chúng ta đi ăn cơm đi.' },
                { id: 402, chinese: '你吃饭了吗？', pinyin: 'Nǐ chī fàn le ma?', vietnamese: 'Bạn ăn cơm chưa?' },
            ],
        },
    ];

    const handleGoBack = () => {
        navigation?.goBack();
    };

    // Animation helper
    const animateTransition = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(30);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]).start();
        });
    };

    const handleNextExample = () => {
        const currentVocab = vocabularyItems[currentVocabIndex];
        if (!currentVocab) return;

        if (currentExampleIndex < currentVocab.examples.length - 1) {
            animateTransition(() => setCurrentExampleIndex(currentExampleIndex + 1));
        } else if (currentVocabIndex < vocabularyItems.length - 1) {
            // Move to next vocabulary word
            animateTransition(() => {
                setCurrentVocabIndex(currentVocabIndex + 1);
                setCurrentExampleIndex(0);
            });
        }
    };

    const handlePrevExample = () => {
        if (currentExampleIndex > 0) {
            animateTransition(() => setCurrentExampleIndex(currentExampleIndex - 1));
        } else if (currentVocabIndex > 0) {
            // Move to previous vocabulary word
            const prevVocab = vocabularyItems[currentVocabIndex - 1];
            animateTransition(() => {
                setCurrentVocabIndex(currentVocabIndex - 1);
                setCurrentExampleIndex(prevVocab.examples.length - 1);
            });
        }
    };

    const playAudio = useCallback((text?: string, rate: number = 0.75) => {
        const currentVocab = vocabularyItems[currentVocabIndex];
        const currentExample = currentVocab?.examples?.[currentExampleIndex];
        const textToSpeak = text || currentExample?.chinese;

        if (textToSpeak) {
            setIsSpeaking(true);
            Speech.speak(textToSpeak, {
                language: 'zh-CN',
                rate: rate,
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
            });
        }
    }, [vocabularyItems, currentVocabIndex, currentExampleIndex]);

    const toggleMastered = () => {
        const currentVocab = vocabularyItems[currentVocabIndex];
        const currentExample = currentVocab?.examples?.[currentExampleIndex];
        if (!currentExample) return;

        setMasteredExamples(prev => {
            const newSet = new Set(prev);
            if (newSet.has(currentExample.id)) {
                newSet.delete(currentExample.id);
            } else {
                newSet.add(currentExample.id);
            }
            return newSet;
        });
    };

    const handlePractice = () => {
        const currentVocab = vocabularyItems[currentVocabIndex];
        const currentExample = currentVocab?.examples?.[currentExampleIndex];
        console.log('Practice speaking:', currentExample?.chinese);
        // TODO: Navigate to speaking practice
    };

    // Calculate total progress
    const getTotalProgress = () => {
        let total = 0;
        let current = 0;
        vocabularyItems.forEach((item, vIndex) => {
            total += item.examples.length;
            if (vIndex < currentVocabIndex) {
                current += item.examples.length;
            } else if (vIndex === currentVocabIndex) {
                current += currentExampleIndex + 1;
            }
        });
        return { current, total };
    };

    // Highlight the vocabulary word in the sentence
    const renderHighlightedSentence = (sentence: string, word: string) => {
        if (!sentence.includes(word)) {
            return <Text style={styles.chineseText}>{sentence}</Text>;
        }

        const parts = sentence.split(word);
        return (
            <Text style={styles.chineseText}>
                {parts[0]}
                <Text style={styles.highlightedWord}>{word}</Text>
                {parts.slice(1).join(word)}
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

    const currentVocab = vocabularyItems[currentVocabIndex];
    const currentExample = currentVocab?.examples?.[currentExampleIndex];
    const { current: progressCurrent, total: progressTotal } = getTotalProgress();
    const progressPercent = progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0;
    const isMastered = currentExample ? masteredExamples.has(currentExample.id) : false;
    const isLastExample = currentVocabIndex === vocabularyItems.length - 1 &&
        currentExampleIndex === currentVocab?.examples?.length - 1;
    const isFirstExample = currentVocabIndex === 0 && currentExampleIndex === 0;

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
                <View style={styles.headerRight}>
                    <Text style={styles.progressText}>{progressCurrent}/{progressTotal}</Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>

            {/* Main Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Vocabulary Word Badge */}
                <View style={styles.vocabBadge}>
                    <TouchableOpacity
                        style={styles.vocabBadgeContent}
                        onPress={() => playAudio(currentVocab?.word, 0.6)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.vocabWord}>{currentVocab?.word}</Text>
                        <Text style={styles.vocabPinyin}>{currentVocab?.pinyin}</Text>
                        <Feather name="volume-2" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.vocabMeaning}>{currentVocab?.meaning}</Text>
                </View>

                {/* Example Card */}
                <Animated.View
                    style={[
                        styles.exampleCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateX: slideAnim }]
                        }
                    ]}
                >
                    {/* Chinese Sentence with highlighted word */}
                    <TouchableOpacity
                        onPress={() => playAudio()}
                        style={styles.sentenceContainer}
                        activeOpacity={0.7}
                    >
                        {renderHighlightedSentence(currentExample?.chinese || '', currentVocab?.word || '')}
                    </TouchableOpacity>

                    {/* Pinyin */}
                    <Text style={styles.pinyinText}>{currentExample?.pinyin}</Text>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Vietnamese Translation */}
                    <Text style={styles.vietnameseText}>{currentExample?.vietnamese}</Text>

                    {/* Example Navigation Dots */}
                    <View style={styles.exampleDotsContainer}>
                        {currentVocab?.examples.map((_, idx) => (
                            <View
                                key={idx}
                                style={[
                                    styles.exampleDot,
                                    idx === currentExampleIndex && styles.exampleDotActive,
                                    masteredExamples.has(currentVocab.examples[idx]?.id) && styles.exampleDotMastered,
                                ]}
                            />
                        ))}
                    </View>
                </Animated.View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, isSpeaking && styles.actionButtonActive]}
                        onPress={() => playAudio()}
                    >
                        <Feather name="volume-2" size={22} color={isSpeaking ? COLORS.cardBackground : COLORS.primary} />
                        <Text style={[styles.actionButtonText, isSpeaking && styles.actionButtonTextActive]}>Nghe</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => playAudio(undefined, 0.5)}
                    >
                        <Feather name="clock" size={22} color={COLORS.primary} />
                        <Text style={styles.actionButtonText}>Chậm</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, isMastered && styles.actionButtonMastered]}
                        onPress={toggleMastered}
                    >
                        <Feather name="check-circle" size={22} color={isMastered ? COLORS.cardBackground : COLORS.success} />
                        <Text style={[styles.actionButtonText, isMastered && styles.actionButtonTextActive]}>Đã nhớ</Text>
                    </TouchableOpacity>
                </View>

                {/* Instruction */}
                <Text style={styles.instructionText}>
                    Nhấn vào câu để nghe phát âm
                </Text>

                {/* Vocabulary Progress Indicator */}
                <View style={styles.vocabProgressContainer}>
                    <Text style={styles.vocabProgressText}>
                        Từ {currentVocabIndex + 1}/{vocabularyItems.length}
                    </Text>
                    <View style={styles.vocabProgressDots}>
                        {vocabularyItems.map((_, idx) => (
                            <View
                                key={idx}
                                style={[
                                    styles.vocabProgressDot,
                                    idx === currentVocabIndex && styles.vocabProgressDotActive,
                                    idx < currentVocabIndex && styles.vocabProgressDotCompleted,
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Section */}
            <View style={styles.bottomContainer}>
                {/* Navigation Row */}
                <View style={styles.navigationRow}>
                    <TouchableOpacity
                        style={[styles.navButton, styles.prevNavButton, isFirstExample && styles.navButtonDisabled]}
                        onPress={handlePrevExample}
                        disabled={isFirstExample}
                    >
                        <Feather name="chevron-left" size={20} color={isFirstExample ? COLORS.textMuted : COLORS.textSecondary} />
                        <Text style={[styles.navButtonText, isFirstExample && styles.navButtonTextDisabled]}>Trước</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.navButton, styles.nextNavButton, isLastExample && styles.navButtonDisabled]}
                        onPress={handleNextExample}
                        disabled={isLastExample}
                    >
                        <Text style={[styles.nextNavButtonText, isLastExample && styles.navButtonTextDisabled]}>
                            {currentExampleIndex === currentVocab?.examples?.length - 1 && currentVocabIndex < vocabularyItems.length - 1
                                ? 'Từ tiếp theo'
                                : 'Tiếp theo'
                            }
                        </Text>
                        <Feather name="chevron-right" size={20} color={isLastExample ? COLORS.textMuted : COLORS.cardBackground} />
                    </TouchableOpacity>
                </View>

                {/* Practice Button */}
                <TouchableOpacity style={styles.practiceButton} onPress={handlePractice}>
                    <Feather name="mic" size={20} color={COLORS.primary} />
                    <Text style={styles.practiceButtonText}>Luyện nói câu này</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 16,
        paddingBottom: 20,
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
        width: 50,
        alignItems: 'center',
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    progressBarContainer: {
        height: 3,
        backgroundColor: COLORS.border,
    },
    progressBar: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    vocabBadge: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    vocabBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    vocabWord: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.primary,
    },
    vocabPinyin: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    vocabMeaning: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    exampleCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 20,
        padding: 28,
        marginTop: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    sentenceContainer: {
        paddingHorizontal: 8,
    },
    chineseText: {
        fontSize: 26,
        fontWeight: '500',
        color: COLORS.textPrimary,
        textAlign: 'center',
        lineHeight: 38,
    },
    highlightedWord: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    pinyinText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
    },
    divider: {
        width: '60%',
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 20,
    },
    vietnameseText: {
        fontSize: 17,
        fontWeight: '500',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    exampleDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
    },
    exampleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    exampleDotActive: {
        backgroundColor: COLORS.primary,
        width: 24,
        borderRadius: 4,
    },
    exampleDotMastered: {
        backgroundColor: COLORS.success,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 20,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        minWidth: 80,
    },
    actionButtonActive: {
        backgroundColor: COLORS.primary,
    },
    actionButtonMastered: {
        backgroundColor: COLORS.success,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 4,
    },
    actionButtonTextActive: {
        color: COLORS.cardBackground,
    },
    instructionText: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 16,
    },
    vocabProgressContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    vocabProgressText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    vocabProgressDots: {
        flexDirection: 'row',
        gap: 6,
    },
    vocabProgressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    vocabProgressDotActive: {
        backgroundColor: COLORS.primary,
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    vocabProgressDotCompleted: {
        backgroundColor: COLORS.success,
    },
    bottomContainer: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 16,
        backgroundColor: COLORS.cardBackground,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    navigationRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    navButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        height: 52,
        gap: 6,
    },
    prevNavButton: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    nextNavButton: {
        backgroundColor: COLORS.primary,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    nextNavButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.cardBackground,
    },
    navButtonTextDisabled: {
        color: COLORS.textMuted,
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
});

export default GrammarScreen;
