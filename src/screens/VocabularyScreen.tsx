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
    PanResponder,
    Modal,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { trackLearningProgress } from '../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
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

// Example sentence structure
interface ExampleSentence {
    id: number;
    chinese: string;
    pinyin: string;
    vietnamese: string;
}

interface VocabularyItem {
    id: number;
    word: string;
    pinyin: string;
    meaning: string;
    audio_url?: string;
    examples?: ExampleSentence[];
}

interface VocabularyScreenProps {
    route?: any;
    navigation?: any;
}

const VocabularyScreen: React.FC<VocabularyScreenProps> = ({ route, navigation }) => {
    const [vocabularyList, setVocabularyList] = useState<VocabularyItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [remembered, setRemembered] = useState<Set<number>>(new Set());

    // Lesson metadata from API
    const [lessonInfo, setLessonInfo] = useState<{ hskLevel: number, title: string } | null>(null);

    // Writing practice states
    const [isWritingMode, setIsWritingMode] = useState(false);
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [isDrawing, setIsDrawing] = useState(false);
    const activePathRef = useRef<string>('');

    // Examples modal states
    const [showExamplesModal, setShowExamplesModal] = useState(false);
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

    // Get lesson ID and HSK level from route params
    const lessonId = route?.params?.lessonId || 1;
    const hskLevel = route?.params?.hskLevel || 1;
    const lessonNumber = route?.params?.lessonNumber || 6;

    // Animation for card swipe
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchVocabulary();
    }, [lessonId]);

    const fetchVocabulary = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('access_token');

            // Fetch vocabulary from lesson detail API
            const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });

            if (response.ok) {
                const data = await response.json();

                // Set lesson metadata
                setLessonInfo({
                    hskLevel: data.hsk_level,
                    title: data.title,
                });

                // Map vocabulary data with examples
                const vocab = data.vocabulary?.map((v: any, index: number) => ({
                    id: v.id || index,
                    word: v.word || v.character || '你好',
                    pinyin: v.pinyin || 'nǐ hǎo',
                    meaning: v.meaning || v.translation || 'Xin chào',
                    audio_url: v.audio_url,
                    examples: v.examples?.map((ex: any, idx: number) => ({
                        id: ex.id || `${v.id}_${idx}`,
                        chinese: ex.chinese || ex.sentence || '',
                        pinyin: ex.pinyin || ex.sentence_pinyin || '',
                        vietnamese: ex.vietnamese || ex.translation || '',
                    })) || [],
                })) || getMockVocabulary();

                setVocabularyList(vocab);
            } else {
                // Use mock data if API fails
                setVocabularyList(getMockVocabulary());
            }
        } catch (err) {
            console.error('Error fetching vocabulary:', err);
            setVocabularyList(getMockVocabulary());
        } finally {
            setIsLoading(false);
        }
    };

    // Track progress when current index changes
    useEffect(() => {
        if (vocabularyList.length > 0 && vocabularyList[currentIndex]) {
            const word = vocabularyList[currentIndex];
            const timer = setTimeout(() => {
                trackLearningProgress({
                    item_type: 'vocabulary',
                    item_id: word.id,
                    completed: true,
                });
            }, 500); // Track after 500ms of viewing
            return () => clearTimeout(timer);
        }
    }, [currentIndex, vocabularyList]);

    const getMockVocabulary = (): VocabularyItem[] => [
        {
            id: 1, word: '你好', pinyin: 'nǐ hǎo', meaning: 'Chào bạn', examples: [
                { id: 101, chinese: '你好，我是小明。', pinyin: 'Nǐ hǎo, wǒ shì Xiǎo Míng.', vietnamese: 'Xin chào, tôi là Tiểu Minh.' },
                { id: 102, chinese: '你好吗？', pinyin: 'Nǐ hǎo ma?', vietnamese: 'Bạn khỏe không?' },
            ]
        },
        {
            id: 2, word: '谢谢', pinyin: 'xiè xiè', meaning: 'Cảm ơn', examples: [
                { id: 201, chinese: '谢谢你的帮助。', pinyin: 'Xièxiè nǐ de bāngzhù.', vietnamese: 'Cảm ơn sự giúp đỡ của bạn.' },
                { id: 202, chinese: '非常谢谢！', pinyin: 'Fēicháng xièxiè!', vietnamese: 'Cảm ơn rất nhiều!' },
            ]
        },
        {
            id: 3, word: '再见', pinyin: 'zài jiàn', meaning: 'Tạm biệt', examples: [
                { id: 301, chinese: '再见，明天见！', pinyin: 'Zàijiàn, míngtiān jiàn!', vietnamese: 'Tạm biệt, mai gặp lại!' },
            ]
        },
        {
            id: 4, word: '对不起', pinyin: 'duì bù qǐ', meaning: 'Xin lỗi', examples: [
                { id: 401, chinese: '对不起，我迟到了。', pinyin: 'Duìbùqǐ, wǒ chídào le.', vietnamese: 'Xin lỗi, tôi đến muộn.' },
            ]
        },
        {
            id: 5, word: '没关系', pinyin: 'méi guān xì', meaning: 'Không sao', examples: [
                { id: 501, chinese: '没关系，不要担心。', pinyin: 'Méi guānxi, bùyào dānxīn.', vietnamese: 'Không sao, đừng lo lắng.' },
            ]
        },
        {
            id: 6, word: '请', pinyin: 'qǐng', meaning: 'Xin vui lòng', examples: [
                { id: 601, chinese: '请坐。', pinyin: 'Qǐng zuò.', vietnamese: 'Xin mời ngồi.' },
                { id: 602, chinese: '请问，这是什么？', pinyin: 'Qǐngwèn, zhè shì shénme?', vietnamese: 'Xin hỏi, đây là gì?' },
            ]
        },
        {
            id: 7, word: '是', pinyin: 'shì', meaning: 'Là / Đúng', examples: [
                { id: 701, chinese: '我是学生。', pinyin: 'Wǒ shì xuéshēng.', vietnamese: 'Tôi là học sinh.' },
            ]
        },
        {
            id: 8, word: '不', pinyin: 'bù', meaning: 'Không', examples: [
                { id: 801, chinese: '我不喜欢。', pinyin: 'Wǒ bù xǐhuān.', vietnamese: 'Tôi không thích.' },
            ]
        },
        {
            id: 9, word: '好', pinyin: 'hǎo', meaning: 'Tốt', examples: [
                { id: 901, chinese: '这个很好！', pinyin: 'Zhège hěn hǎo!', vietnamese: 'Cái này rất tốt!' },
            ]
        },
        {
            id: 10, word: '我', pinyin: 'wǒ', meaning: 'Tôi', examples: [
                { id: 1001, chinese: '我叫小明。', pinyin: 'Wǒ jiào Xiǎo Míng.', vietnamese: 'Tôi tên là Tiểu Minh.' },
            ]
        },
        {
            id: 11, word: '你', pinyin: 'nǐ', meaning: 'Bạn', examples: [
                { id: 1101, chinese: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', vietnamese: 'Bạn tên là gì?' },
            ]
        },
        {
            id: 12, word: '他', pinyin: 'tā', meaning: 'Anh ấy', examples: [
                { id: 1201, chinese: '他是我的老师。', pinyin: 'Tā shì wǒ de lǎoshī.', vietnamese: 'Anh ấy là thầy giáo của tôi.' },
            ]
        },
    ];

    const handleGoBack = () => {
        navigation?.goBack();
    };

    const handleNext = () => {
        if (currentIndex < vocabularyList.length - 1) {
            // Animate swipe left
            Animated.timing(translateX, {
                toValue: -SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                translateX.setValue(0);
                setCurrentIndex(currentIndex + 1);
                clearWriting(); // Clear writing when moving to next word
            });
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            // Animate swipe right
            Animated.timing(translateX, {
                toValue: SCREEN_WIDTH,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                translateX.setValue(0);
                setCurrentIndex(currentIndex - 1);
                clearWriting(); // Clear writing when moving to previous word
            });
        }
    };

    const toggleFavorite = () => {
        const currentWord = vocabularyList[currentIndex];
        if (currentWord) {
            setFavorites(prev => {
                const newFavorites = new Set(prev);
                if (newFavorites.has(currentWord.id)) {
                    newFavorites.delete(currentWord.id);
                } else {
                    newFavorites.add(currentWord.id);
                }
                return newFavorites;
            });
        }
    };

    const toggleRemembered = () => {
        const currentWord = vocabularyList[currentIndex];
        if (currentWord) {
            setRemembered(prev => {
                const newRemembered = new Set(prev);
                if (newRemembered.has(currentWord.id)) {
                    newRemembered.delete(currentWord.id);
                } else {
                    newRemembered.add(currentWord.id);
                }
                return newRemembered;
            });
        }
    };

    const playAudio = () => {
        if (currentWord) {
            Speech.speak(currentWord.word, {
                language: 'zh-CN', // Chinese (China)
                rate: 0.8,         // Slightly slower for learning
                pitch: 1.0,
            });
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                setIsDrawing(true);
                const { locationX, locationY } = evt.nativeEvent;
                const path = `M${locationX},${locationY}`;
                activePathRef.current = path;
                setCurrentPath(path);
            },
            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const newPath = `${activePathRef.current} L${locationX},${locationY}`;
                activePathRef.current = newPath;
                setCurrentPath(newPath);
            },
            onPanResponderRelease: () => {
                setIsDrawing(false);
                if (activePathRef.current) {
                    const finalPath = activePathRef.current;
                    setPaths((prev) => [...prev, finalPath]);
                    activePathRef.current = '';
                    setCurrentPath('');
                }
            },
            onPanResponderTerminate: () => {
                setIsDrawing(false);
            },
        })
    ).current;

    const clearWriting = () => {
        setPaths([]);
        setCurrentPath('');
        activePathRef.current = '';
    };

    const handleWritingPractice = () => {
        setIsWritingMode(!isWritingMode);
        if (!isWritingMode) {
            clearWriting();
        }
    };

    const handleExamples = () => {
        const currentWord = vocabularyList[currentIndex];
        if (currentWord?.examples && currentWord.examples.length > 0) {
            setCurrentExampleIndex(0);
            setShowExamplesModal(true);
        }
    };

    const playExampleAudio = (text: string, rate: number = 0.75) => {
        Speech.speak(text, {
            language: 'zh-CN',
            rate: rate,
        });
    };

    const handleNextExample = () => {
        const currentWord = vocabularyList[currentIndex];
        if (currentWord?.examples && currentExampleIndex < currentWord.examples.length - 1) {
            setCurrentExampleIndex(currentExampleIndex + 1);
        }
    };

    const handlePrevExample = () => {
        if (currentExampleIndex > 0) {
            setCurrentExampleIndex(currentExampleIndex - 1);
        }
    };

    const handleShare = () => {
        // TODO: Implement share functionality
        console.log('Share vocabulary');
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải từ vựng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentWord = vocabularyList[currentIndex];
    const isFavorite = currentWord ? favorites.has(currentWord.id) : false;
    const isRemembered = currentWord ? remembered.has(currentWord.id) : false;

    const renderGrid = () => (
        <Svg style={StyleSheet.absoluteFill}>
            {/* Outline box */}
            <Path
                d="M1,1 L199,1 L199,199 L1,199 Z"
                stroke={COLORS.border}
                strokeWidth={1}
                fill="none"
            />
            {/* Vertical midline */}
            <Path
                d="M100,0 L100,200"
                stroke={COLORS.border}
                strokeWidth={1}
                strokeDasharray="5,5"
            />
            {/* Horizontal midline */}
            <Path
                d="M0,100 L200,100"
                stroke={COLORS.border}
                strokeWidth={1}
                strokeDasharray="5,5"
            />
            {/* Diagonal lines */}
            <Path
                d="M0,0 L200,200 M200,0 L0,200"
                stroke={COLORS.border}
                strokeWidth={0.5}
                strokeDasharray="5,5"
            />
        </Svg>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                        HSK {lessonInfo?.hskLevel || hskLevel} – {lessonInfo?.title || `Bài ${lessonNumber}`}
                    </Text>
                    <Text style={styles.headerSubtitle}>Học từ mới</Text>
                </View>
                <View style={styles.progressBadge}>
                    <Text style={styles.progressText}>
                        {currentIndex + 1}/{vocabularyList.length}
                    </Text>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    scrollEnabled={!isDrawing}
                >
                    {/* Vocabulary Card */}
                    <Animated.View
                        style={[
                            styles.vocabularyCard,
                            { transform: [{ translateX }] }
                        ]}
                    >
                        {/* Card Header */}
                        <View style={styles.cardHeader}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={toggleFavorite}
                            >
                                <Feather
                                    name="star"
                                    size={24}
                                    color={isFavorite ? COLORS.star : COLORS.textMuted}
                                    fill={isFavorite ? COLORS.star : 'none'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconButton, styles.audioButton]}
                                onPress={playAudio}
                            >
                                <Feather name="volume-2" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Chinese Character */}
                        <View style={styles.characterContainer}>
                            <Text style={styles.chineseCharacter}>{currentWord?.word}</Text>
                            <Text style={styles.pinyin}>{currentWord?.pinyin}</Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Vietnamese Meaning */}
                        <Text style={styles.meaning}>{currentWord?.meaning}</Text>

                        {/* Dots Indicator */}
                        <View style={styles.dotsContainer}>
                            {vocabularyList.slice(
                                Math.max(0, currentIndex - 1),
                                Math.min(vocabularyList.length, currentIndex + 3)
                            ).map((_, index) => {
                                const actualIndex = Math.max(0, currentIndex - 1) + index;
                                return (
                                    <View
                                        key={actualIndex}
                                        style={[
                                            styles.dot,
                                            actualIndex === currentIndex && styles.dotActive,
                                        ]}
                                    />
                                );
                            })}
                        </View>
                    </Animated.View>

                    {/* Writing Practice Frame */}
                    {isWritingMode && (
                        <View style={styles.writingContainer}>
                            <View style={styles.writingHeader}>
                                <Text style={styles.writingTitle}>Tập viết bên dưới</Text>
                                <TouchableOpacity onPress={clearWriting} style={styles.clearButton}>
                                    <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                                    <Text style={styles.clearText}>Xóa</Text>
                                </TouchableOpacity>
                            </View>
                            <View
                                style={styles.canvas}
                                {...panResponder.panHandlers}
                            >
                                {renderGrid()}
                                <Svg style={StyleSheet.absoluteFill}>
                                    {paths.map((path, index) => (
                                        <Path
                                            key={index}
                                            d={path}
                                            stroke={COLORS.textPrimary}
                                            strokeWidth={4}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ))}
                                    {currentPath ? (
                                        <Path
                                            d={currentPath}
                                            stroke={COLORS.textPrimary}
                                            strokeWidth={4}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ) : null}
                                </Svg>
                            </View>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleWritingPractice}
                        >
                            <View style={[
                                styles.actionIconContainer,
                                isWritingMode && { backgroundColor: COLORS.primaryLight }
                            ]}>
                                <MaterialIcons
                                    name="edit"
                                    size={24}
                                    color={isWritingMode ? COLORS.primary : COLORS.textSecondary}
                                />
                            </View>
                            <Text style={[
                                styles.actionButtonText,
                                isWritingMode && { color: COLORS.primary, fontWeight: '700' }
                            ]}>Tập viết</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleExamples}
                        >
                            <View style={styles.actionIconContainer}>
                                <Text style={styles.exampleIcon}>文A</Text>
                            </View>
                            <Text style={styles.actionButtonText}>Ví dụ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleShare}
                        >
                            <View style={styles.actionIconContainer}>
                                <Feather name="share-2" size={24} color={COLORS.textSecondary} />
                            </View>
                            <Text style={styles.actionButtonText}>Chia sẻ</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomContainer}>
                {/* Navigation Buttons Row */}
                <View style={styles.navigationButtonsRow}>
                    {/* Previous Button */}
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            styles.prevButton,
                            currentIndex <= 0 && styles.navButtonDisabled,
                        ]}
                        onPress={handlePrevious}
                        disabled={currentIndex <= 0}
                    >
                        <Feather name="chevron-left" size={20} color={currentIndex <= 0 ? COLORS.textMuted : COLORS.textSecondary} />
                        <Text style={[
                            styles.navButtonText,
                            currentIndex <= 0 && styles.navButtonTextDisabled,
                        ]}>Quay lại</Text>
                    </TouchableOpacity>

                    {/* Next Button */}
                    <TouchableOpacity
                        style={[
                            styles.navButton,
                            styles.nextButton,
                            currentIndex >= vocabularyList.length - 1 && styles.navButtonDisabled,
                        ]}
                        onPress={handleNext}
                        disabled={currentIndex >= vocabularyList.length - 1}
                    >
                        <Text style={[
                            styles.navButtonText,
                            styles.nextButtonText,
                            currentIndex >= vocabularyList.length - 1 && styles.navButtonTextDisabled,
                        ]}>Tiếp theo</Text>
                        <Feather name="chevron-right" size={20} color={currentIndex >= vocabularyList.length - 1 ? COLORS.textMuted : COLORS.cardBackground} />
                    </TouchableOpacity>
                </View>

                {/* Remember Checkbox */}
                <TouchableOpacity
                    style={styles.rememberContainer}
                    onPress={toggleRemembered}
                >
                    <View style={[
                        styles.checkbox,
                        isRemembered && styles.checkboxChecked,
                    ]}>
                        {isRemembered && (
                            <Feather name="check" size={14} color={COLORS.cardBackground} />
                        )}
                    </View>
                    <Text style={styles.rememberText}>Đã nhớ từ này</Text>
                </TouchableOpacity>
            </View>

            {/* Examples Modal */}
            <Modal
                visible={showExamplesModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowExamplesModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <Text style={styles.modalVocabWord}>{currentWord?.word}</Text>
                                <Text style={styles.modalVocabPinyin}>{currentWord?.pinyin}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowExamplesModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <Feather name="x" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Title */}
                        <Text style={styles.modalTitle}>Câu ví dụ</Text>

                        {/* Example Card */}
                        {currentWord?.examples && currentWord.examples.length > 0 && (
                            <View style={styles.exampleCard}>
                                {/* Chinese Sentence */}
                                <TouchableOpacity
                                    onPress={() => playExampleAudio(currentWord.examples![currentExampleIndex].chinese)}
                                    style={styles.exampleSentenceContainer}
                                >
                                    <Text style={styles.exampleChinese}>
                                        {currentWord.examples[currentExampleIndex].chinese}
                                    </Text>
                                    <Feather name="volume-2" size={18} color={COLORS.primary} />
                                </TouchableOpacity>

                                {/* Pinyin */}
                                <Text style={styles.examplePinyin}>
                                    {currentWord.examples[currentExampleIndex].pinyin}
                                </Text>

                                {/* Divider */}
                                <View style={styles.exampleDivider} />

                                {/* Vietnamese */}
                                <Text style={styles.exampleVietnamese}>
                                    {currentWord.examples[currentExampleIndex].vietnamese}
                                </Text>

                                {/* Dots Indicator */}
                                <View style={styles.exampleDotsContainer}>
                                    {currentWord.examples.map((_, idx) => (
                                        <View
                                            key={idx}
                                            style={[
                                                styles.exampleDot,
                                                idx === currentExampleIndex && styles.exampleDotActive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.exampleActionButtons}>
                            <TouchableOpacity
                                style={styles.exampleActionButton}
                                onPress={() => playExampleAudio(currentWord?.examples?.[currentExampleIndex]?.chinese || '')}
                            >
                                <Feather name="volume-2" size={20} color={COLORS.primary} />
                                <Text style={styles.exampleActionText}>Nghe</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.exampleActionButton}
                                onPress={() => playExampleAudio(currentWord?.examples?.[currentExampleIndex]?.chinese || '', 0.5)}
                            >
                                <Feather name="clock" size={20} color={COLORS.primary} />
                                <Text style={styles.exampleActionText}>Chậm</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Navigation */}
                        <View style={styles.exampleNavRow}>
                            <TouchableOpacity
                                style={[
                                    styles.exampleNavButton,
                                    styles.examplePrevButton,
                                    currentExampleIndex === 0 && styles.exampleNavButtonDisabled,
                                ]}
                                onPress={handlePrevExample}
                                disabled={currentExampleIndex === 0}
                            >
                                <Feather name="chevron-left" size={20} color={currentExampleIndex === 0 ? COLORS.textMuted : COLORS.textSecondary} />
                                <Text style={[
                                    styles.exampleNavButtonText,
                                    currentExampleIndex === 0 && styles.exampleNavButtonTextDisabled,
                                ]}>Trước</Text>
                            </TouchableOpacity>

                            <Text style={styles.exampleCounter}>
                                {currentExampleIndex + 1} / {currentWord?.examples?.length || 0}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.exampleNavButton,
                                    styles.exampleNextButton,
                                    currentExampleIndex >= (currentWord?.examples?.length || 0) - 1 && styles.exampleNavButtonDisabled,
                                ]}
                                onPress={handleNextExample}
                                disabled={currentExampleIndex >= (currentWord?.examples?.length || 0) - 1}
                            >
                                <Text style={[
                                    styles.exampleNextButtonText,
                                    currentExampleIndex >= (currentWord?.examples?.length || 0) - 1 && styles.exampleNavButtonTextDisabled,
                                ]}>Tiếp</Text>
                                <Feather name="chevron-right" size={20} color={currentExampleIndex >= (currentWord?.examples?.length || 0) - 1 ? COLORS.textMuted : COLORS.cardBackground} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    progressBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        color: COLORS.cardBackground,
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    vocabularyCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    iconButton: {
        padding: 8,
    },
    audioButton: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
        padding: 10,
    },
    characterContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    chineseCharacter: {
        fontSize: 72,
        fontWeight: '400',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    pinyin: {
        fontSize: 20,
        fontWeight: '400',
        color: COLORS.primary,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 40,
        marginBottom: 24,
    },
    meaning: {
        fontSize: 24,
        fontWeight: '500',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    dotActive: {
        backgroundColor: COLORS.textPrimary,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginTop: 32,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.cardBackground,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: 8,
    },
    exampleIcon: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    bottomContainer: {
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 16,
    },
    navigationButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 16,
    },
    navButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        height: 56,
        gap: 8,
    },
    prevButton: {
        backgroundColor: COLORS.cardBackground,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    nextButton: {
        backgroundColor: COLORS.primary,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    nextButtonText: {
        color: COLORS.cardBackground,
        fontWeight: '700',
    },
    navButtonTextDisabled: {
        color: COLORS.textMuted,
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    checkboxChecked: {
        backgroundColor: COLORS.success,
        borderColor: COLORS.success,
    },
    rememberText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    writingContainer: {
        marginTop: 20,
        backgroundColor: COLORS.cardBackground,
        borderRadius: 24,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    writingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    writingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    clearText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    canvas: {
        height: 200,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    // Examples Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.cardBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalVocabWord: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.primary,
    },
    modalVocabPinyin: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    modalCloseButton: {
        padding: 8,
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    exampleCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    exampleSentenceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    exampleChinese: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    examplePinyin: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    exampleDivider: {
        width: '60%',
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    exampleVietnamese: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    exampleDotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 16,
    },
    exampleDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.border,
    },
    exampleDotActive: {
        backgroundColor: COLORS.primary,
        width: 18,
        borderRadius: 3,
    },
    exampleActionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 20,
    },
    exampleActionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
        minWidth: 80,
    },
    exampleActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 4,
    },
    exampleNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        gap: 12,
    },
    exampleNavButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        height: 48,
        gap: 4,
    },
    examplePrevButton: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    exampleNextButton: {
        backgroundColor: COLORS.primary,
    },
    exampleNavButtonDisabled: {
        opacity: 0.5,
    },
    exampleNavButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    exampleNextButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.cardBackground,
    },
    exampleNavButtonTextDisabled: {
        color: COLORS.textMuted,
    },
    exampleCounter: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
});

export default VocabularyScreen;
