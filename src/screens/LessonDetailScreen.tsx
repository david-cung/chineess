import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Image,
    Modal,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { ProgressBar } from '../components';
import { trackLearningProgress, analyzePronunciation, PronunciationResult } from '../utils/api';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Design System Colors
const LESSON_COLORS = {
    primary: '#E53935',
    secondaryPink: '#FDECEA',
    secondaryOrange: '#FFF3E0',
    disabledBg: '#F5F5F5',
    disabledIcon: '#BDBDBD',
    background: '#F8F9FA',
    cardBackground: '#FFFFFF',
    textPrimary: '#212121',
    textSecondary: '#757575',
    success: '#4CAF50',
    successLight: '#E8F5E9',
};

interface LearningItem {
    id: number;
    word?: string;
    character?: string;
    pinyin: string;
    meaning?: string;
    translation?: string;
    completed?: boolean;
    stroke_count?: number;
    examples?: any[];
}

interface LessonDetail {
    id: number;
    title: string;
    description: string | null;
    hsk_level: number;
    order: number;
    estimated_time: number;
    vocabCount: number;
    durationMinutes: number;
    status: 'completed' | 'in_progress' | 'available' | 'locked';
    progressPercent: number;
    // Learned counts from API
    learnedVocabCount: number;
    learnedGrammarCount: number;
    learnedListeningCount: number;
    learnedSpeakingCount: number;
    // Content arrays
    characters: LearningItem[];
    vocabulary: LearningItem[];
    objectives: any[];
    grammar: any[];
    exercises: any[];
}

interface Activity {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    iconBg: string;
    status: 'completed' | 'in_progress' | 'available' | 'locked';
}

interface LessonDetailScreenProps {
    route?: any;
    navigation?: any;
}

const LessonDetailScreen: React.FC<LessonDetailScreenProps> = ({ route, navigation }) => {
    const [lesson, setLesson] = useState<LessonDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Vocabulary Learning Mode states
    const [isLearningMode, setIsLearningMode] = useState(false);
    const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
    const [learnedWords, setLearnedWords] = useState<Set<number>>(new Set());
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [activeView, setActiveView] = useState<'card' | 'examples' | 'writing' | 'pronunciation'>('card');

    // Recording states for pronunciation practice
    const [isRecording, setIsRecording] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [recordingUri, setRecordingUri] = useState<string | null>(null);
    const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Get lesson ID from route params or default to 1
    const rawLessonId = route?.params?.lessonId || 1;
    const lessonId = typeof rawLessonId === 'string' && rawLessonId.startsWith('lesson_')
        ? parseInt(rawLessonId.replace('lesson_', ''), 10)
        : rawLessonId;

    // Lesson Progress state
    const [progress, setProgress] = useState({
        percent: 0,
        vocabLearned: 0,
        vocabTotal: 0,
        grammarLearned: 0,
        grammarTotal: 0,
        listeningLearned: 0,
        speakingLearned: 0,
        activitiesCompleted: 0,
        activitiesTotal: 5,
        status: 'available' as LessonDetail['status'],
    });

    useEffect(() => {
        fetchLessonDetail();
    }, [lessonId]);

    const fetchLessonDetail = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('access_token');

            const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
            });

            if (response.ok) {
                const data: LessonDetail = await response.json();
                setLesson(data);

                // Map API fields to state
                setProgress({
                    percent: data.progressPercent || 0,
                    vocabLearned: data.learnedVocabCount || 0,
                    vocabTotal: data.vocabCount || data.vocabulary?.length || 0,
                    grammarLearned: data.learnedGrammarCount || 0,
                    grammarTotal: (data.grammar || []).length,
                    listeningLearned: data.learnedListeningCount || 0,
                    speakingLearned: data.learnedSpeakingCount || 0,
                    activitiesCompleted: data.status === 'completed' ? 5 : (data.progressPercent > 0 ? 1 : 0),
                    activitiesTotal: 5,
                    status: data.status || 'available',
                });

                // Initialize learned words set if available
                if (data.vocabulary) {
                    const completedIds = data.vocabulary
                        .filter(v => v.completed)
                        .map(v => v.id);
                    setLearnedWords(new Set(completedIds));
                }
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Không thể tải bài học');
            }
        } catch (err) {
            console.error('Error fetching lesson detail:', err);
            setError('Không thể kết nối đến server');
        } finally {
            setIsLoading(false);
        }
    };

    const getActivities = (): Activity[] => {
        const isCompleted = progress.status === 'completed' || progress.percent === 100;

        return [
            {
                id: 'vocabulary',
                title: 'Từ vựng',
                subtitle: isCompleted ? 'Hoàn thành' : `Đã học ${progress.vocabLearned}/${progress.vocabTotal} từ`,
                icon: 'book-open',
                iconBg: LESSON_COLORS.secondaryPink,
                status: isCompleted ? 'completed' : (progress.vocabLearned > 0 ? 'in_progress' : 'available'),
            },
            {
                id: 'sentences',
                title: 'Câu mẫu',
                subtitle: isCompleted ? 'Hoàn thành' : (progress.grammarLearned > 0 ? `Đã học ${progress.grammarLearned}/${progress.grammarTotal} câu` : 'Chưa học'),
                icon: 'message-square',
                iconBg: LESSON_COLORS.secondaryOrange,
                status: isCompleted ? 'completed' : (progress.grammarLearned > 0 ? 'in_progress' : 'available'),
            },
            {
                id: 'speaking',
                title: 'Luyện nói',
                subtitle: isCompleted ? 'Hoàn thành' : (progress.speakingLearned > 0 ? `Đã hoàn thành ${progress.speakingLearned} bài` : 'Chưa học'),
                icon: 'mic',
                iconBg: LESSON_COLORS.secondaryOrange,
                status: isCompleted ? 'completed' : (progress.speakingLearned > 0 ? 'in_progress' : 'available'),
            },
            {
                id: 'writing',
                title: 'Viết chữ Hán',
                subtitle: isCompleted ? 'Hoàn thành' : 'Chưa học',
                icon: 'edit-3',
                iconBg: LESSON_COLORS.secondaryOrange,
                status: isCompleted ? 'completed' : 'available',
            },
        ];
    };

    const getButtonText = (): string => {
        if (progress.status === 'completed' || progress.percent === 100) return 'Ôn lại bài học';
        if (progress.status === 'in_progress' || progress.percent > 0) return 'Tiếp tục bài học';
        return 'Bắt đầu học';
    };

    const getProgressColor = (): string => {
        return progress.percent === 100 ? LESSON_COLORS.success : LESSON_COLORS.primary;
    };

    const handleGoBack = () => {
        navigation?.goBack();
    };

    const handleActivityPress = (activity: Activity) => {
        if (activity.status === 'locked') return;

        // Note: Progress tracking is done within each activity screen (e.g., VocabularyScreen)
        // using the specific item_id from the API response

        if (activity.id === 'vocabulary') {
            navigation?.navigate('Vocabulary', {
                lessonId: lessonId,
                hskLevel: lesson?.hsk_level || 1,
                lessonNumber: lessonId,
            });
        } else if (activity.id === 'sentences') {
            navigation?.navigate('Grammar', {
                lessonId: lessonId,
                hskLevel: lesson?.hsk_level || 1,
            });
        } else {
            console.log('Activity pressed:', activity.id);
            // TODO: Navigate to other activity screens
        }
    };

    // Vocabulary Learning Functions
    const vocabularyList = lesson?.vocabulary || [];
    const currentWord = vocabularyList[currentVocabIndex];

    const handleMainButton = () => {
        if (vocabularyList.length > 0) {
            setIsLearningMode(true);
            setCurrentVocabIndex(0);
        }
    };

    const closeLearningMode = () => {
        setIsLearningMode(false);
        // Refresh lesson data to get updated progress
        fetchLessonDetail();
    };

    const handleNextVocab = async () => {
        if (currentVocabIndex < vocabularyList.length - 1) {
            // Mark current word as learned
            if (currentWord) {
                setLearnedWords(prev => new Set(prev).add(currentWord.id));
                // Track progress to API
                await trackLearningProgress({
                    item_type: 'vocabulary',
                    item_id: currentWord.id,
                    completed: true,
                });
                // Refresh progress percentage from backend
                await fetchLessonDetail();
            }
            setCurrentVocabIndex(currentVocabIndex + 1);
        }
    };

    const handlePrevVocab = () => {
        if (currentVocabIndex > 0) {
            setCurrentVocabIndex(currentVocabIndex - 1);
        }
    };

    const completeLearningMode = async () => {
        if (currentWord) {
            setLearnedWords(prev => new Set(prev).add(currentWord.id));
            await trackLearningProgress({
                item_type: 'vocabulary',
                item_id: currentWord.id,
                completed: true,
            });
        }
        setIsLearningMode(false);
        // Refresh lesson detail before going back (optional, but ensures state is accurate)
        await fetchLessonDetail();
        // Go back to Lessons screen
        navigation?.navigate('Lessons', { hskLevel: lesson?.hsk_level || 1 });
    };

    const speakWord = (text: string) => {
        if (!text) return;

        if (isSpeaking) {
            // Stop current speech
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            } else {
                Speech.stop();
            }
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);

            // Use Web Speech API for web platform
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'zh-CN';
                utterance.rate = 0.8;
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
            } else {
                // Use expo-speech for native platforms
                Speech.speak(text, {
                    language: 'zh-CN',
                    rate: 0.8,
                    onDone: () => setIsSpeaking(false),
                    onError: () => setIsSpeaking(false),
                });
            }
        }
    };

    const toggleFavorite = () => {
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

    const isFavorite = currentWord ? favorites.has(currentWord.id) : false;

    // Recording Functions for Pronunciation Practice
    const startRecording = async () => {
        try {
            // Reset previous result
            setPronunciationResult(null);
            setRecordingUri(null);

            // Request permissions
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                console.log('Permission to access microphone was denied');
                return;
            }

            // Set audio mode for recording
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            // Start recording
            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(newRecording);
            setIsRecording(true);
            console.log('Recording started');
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    };

    const stopRecording = async () => {
        console.log('Stopping recording...');
        if (!recording) return;

        try {
            setIsRecording(false);
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
            const uri = recording.getURI();
            setRecording(null);
            setRecordingUri(uri);
            console.log('Recording stopped and stored at', uri);

            // Start analyzing
            if (uri && currentWord) {
                setIsAnalyzing(true);
                const result = await analyzePronunciation(
                    uri,
                    currentWord.word || currentWord.character || '',
                    currentWord.pinyin || ''
                );
                setPronunciationResult(result);
                setIsAnalyzing(false);
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            setIsRecording(false);
            setIsAnalyzing(false);
        }
    };

    const resetRecording = () => {
        setPronunciationResult(null);
        setRecordingUri(null);
    };

    const renderActivityItem = (activity: Activity) => {
        const isLocked = activity.status === 'locked';
        const isCompleted = activity.status === 'completed';
        const isInProgress = activity.status === 'in_progress';

        return (
            <TouchableOpacity
                key={activity.id}
                style={styles.activityItem}
                onPress={() => handleActivityPress(activity)}
                disabled={isLocked}
                activeOpacity={isLocked ? 1 : 0.7}
            >
                <View style={styles.activityLeft}>
                    <View style={[
                        styles.activityIcon,
                        { backgroundColor: isLocked ? LESSON_COLORS.disabledBg : activity.iconBg },
                    ]}>
                        {isCompleted ? (
                            <Feather name="check" size={20} color={LESSON_COLORS.success} />
                        ) : isLocked ? (
                            <Feather name="lock" size={18} color={LESSON_COLORS.disabledIcon} />
                        ) : (
                            <Feather
                                name={activity.icon as any}
                                size={20}
                                color={isLocked ? LESSON_COLORS.disabledIcon : LESSON_COLORS.primary}
                            />
                        )}
                    </View>
                    <View style={styles.activityInfo}>
                        <Text style={[
                            styles.activityTitle,
                            isLocked && styles.activityTitleLocked,
                        ]}>
                            {activity.title}
                        </Text>
                        <Text style={[
                            styles.activitySubtitle,
                            isLocked && styles.activitySubtitleLocked,
                        ]}>
                            {activity.subtitle}
                        </Text>
                    </View>
                </View>
                <View style={styles.activityRight}>
                    {isCompleted && (
                        <View style={styles.completedBadge}>
                            <Feather name="check-circle" size={20} color={LESSON_COLORS.success} />
                        </View>
                    )}
                    {isInProgress && (
                        <TouchableOpacity style={styles.continueButton}>
                            <Text style={styles.continueButtonText}>Tiếp tục</Text>
                        </TouchableOpacity>
                    )}
                    {!isLocked && !isCompleted && !isInProgress && (
                        <TouchableOpacity style={styles.startButton}>
                            <Text style={styles.startButtonText}>Bắt đầu</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={LESSON_COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color={LESSON_COLORS.disabledIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchLessonDetail}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={LESSON_COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                    <Feather name="chevron-left" size={24} color={LESSON_COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>HSK {lesson?.hsk_level || 1}</Text>
                    <Text style={styles.headerSubtitle}>{lesson?.title || 'Đang tải...'}</Text>
                </View>
                <TouchableOpacity style={styles.menuButton}>
                    <Feather name="more-horizontal" size={24} color={LESSON_COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>{progress.percent}% hoàn thành</Text>
                        <Text style={styles.progressPercent}>{progress.percent}%</Text>
                    </View>
                    <ProgressBar
                        progress={progress.percent}
                        height={8}
                        backgroundColor="#E0E0E0"
                        progressColor={getProgressColor()}
                        style={styles.progressBar}
                    />
                    <Text style={styles.progressSubtext}>
                        Đã học {progress.vocabLearned} / {progress.vocabTotal} từ vựng
                    </Text>
                </View>

                {/* Lesson Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>THÔNG TIN BÀI HỌC</Text>
                    <Text style={styles.infoTitle}>
                        {lesson?.description || 'Giao tiếp cơ bản về gia đình'}
                    </Text>
                    <View style={styles.infoMeta}>
                        <View style={styles.infoItem}>
                            <Feather name="book" size={14} color={LESSON_COLORS.textSecondary} />
                            <Text style={styles.infoText}>{lesson?.vocabCount || lesson?.vocabulary.length || 0} từ vựng</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Feather name="clock" size={14} color={LESSON_COLORS.textSecondary} />
                            <Text style={styles.infoText}>{lesson?.durationMinutes || lesson?.estimated_time || 0} phút</Text>
                        </View>
                    </View>
                    {/* Family illustration placeholder */}
                    <View style={styles.illustrationContainer}>
                        <Text style={styles.illustrationEmoji}>👨‍👩‍👧‍👦</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Sticky Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.mainButton,
                        progress.percent === 100 && styles.mainButtonCompleted,
                    ]}
                    onPress={handleMainButton}
                >
                    <Feather name="play-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.mainButtonText}>{getButtonText()}</Text>
                </TouchableOpacity>
            </View>

            {/* Vocabulary Learning Modal */}
            <Modal
                visible={isLearningMode}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={closeLearningMode}
            >
                <SafeAreaView style={styles.learningModal} edges={['top', 'bottom']}>
                    {/* Learning Modal Header */}
                    <View style={styles.learningHeader}>
                        <TouchableOpacity onPress={closeLearningMode} style={styles.closeButton}>
                            <Feather name="x" size={24} color={LESSON_COLORS.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.learningHeaderCenter}>
                            <Text style={styles.learningHeaderTitle}>
                                Bài {lesson?.order || lessonId} - Từ vựng
                            </Text>
                            <Text style={styles.learningProgress}>
                                {learnedWords.size} / {vocabularyList.length} đã học
                            </Text>
                        </View>
                        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
                            <Feather
                                name={isFavorite ? "heart" : "heart"}
                                size={24}
                                color={isFavorite ? LESSON_COLORS.primary : LESSON_COLORS.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.learningProgressBar}>
                        <ProgressBar
                            progress={(currentVocabIndex + 1) / vocabularyList.length * 100}
                            height={4}
                            backgroundColor="#E0E0E0"
                            progressColor={LESSON_COLORS.primary}
                        />
                    </View>

                    {/* Vocabulary Card */}
                    <ScrollView style={styles.vocabCardScroll} contentContainerStyle={styles.vocabCardScrollContent}>
                        <View style={styles.vocabCard}>
                            {currentWord && activeView === 'card' && (
                                <>
                                    {/* Chinese Character */}
                                    <Text style={styles.vocabCharacter}>
                                        {currentWord.word || currentWord.character || ""}
                                    </Text>

                                    {/* Pinyin */}
                                    <TouchableOpacity
                                        onPress={() => speakWord(currentWord.word || currentWord.character || "")}
                                        style={styles.pinyinContainer}
                                    >
                                        <Text style={styles.vocabPinyin}>{currentWord.pinyin}</Text>
                                        <Feather
                                            name={isSpeaking ? "volume-2" : "volume-2"}
                                            size={24}
                                            color={isSpeaking ? LESSON_COLORS.primary : LESSON_COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>

                                    {/* Divider */}
                                    <View style={styles.vocabDivider} />

                                    {/* Vietnamese Meaning */}
                                    <Text style={styles.vocabMeaning}>
                                        {currentWord.meaning || currentWord.translation}
                                    </Text>
                                </>
                            )}

                            {/* Writing Practice View */}
                            {currentWord && activeView === 'writing' && (
                                <View style={styles.writingView}>
                                    {/* Word Header */}
                                    <View style={styles.viewHeader}>
                                        <Text style={styles.viewHeaderWord}>
                                            {currentWord.word || currentWord.character || ""}
                                        </Text>
                                        <Text style={styles.viewHeaderPinyin}>{currentWord.pinyin}</Text>
                                        <Text style={styles.viewHeaderMeaning}>
                                            {currentWord.meaning || currentWord.translation}
                                        </Text>
                                    </View>

                                    <Text style={styles.writingInstruction}>
                                        Tập viết nét chữ theo thứ tự
                                    </Text>

                                    {/* Writing Canvas */}
                                    <View style={styles.writingCanvas}>
                                        <View style={styles.writingGuide}>
                                            <Text style={styles.writingGuideText}>
                                                {currentWord.word || currentWord.character || ""}
                                            </Text>
                                        </View>
                                        <Text style={styles.writingHint}>
                                            Dùng ngón tay vẽ theo nét chữ
                                        </Text>
                                    </View>

                                    {/* Stroke Info */}
                                    <View style={styles.strokeInfo}>
                                        <Feather name="edit-3" size={20} color={LESSON_COLORS.primary} />
                                        <Text style={styles.strokeText}>
                                            Số nét: {currentWord.stroke_count || '—'}
                                        </Text>
                                    </View>

                                    {/* Clear Button */}
                                    <TouchableOpacity style={styles.clearButton}>
                                        <Feather name="trash-2" size={20} color={LESSON_COLORS.textSecondary} />
                                        <Text style={styles.clearButtonText}>Xóa và viết lại</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Examples View */}
                            {currentWord && activeView === 'examples' && (
                                <View style={styles.examplesView}>
                                    {/* Word Header */}
                                    <View style={styles.viewHeader}>
                                        <TouchableOpacity
                                            style={styles.wordWithSpeaker}
                                            onPress={() => speakWord(currentWord.word || currentWord.character || "")}
                                        >
                                            <Text style={styles.viewHeaderWord}>
                                                {currentWord.word || currentWord.character || ""}
                                            </Text>
                                            <Feather
                                                name="volume-2"
                                                size={24}
                                                color={isSpeaking ? LESSON_COLORS.primary : LESSON_COLORS.textSecondary}
                                            />
                                        </TouchableOpacity>
                                        <Text style={styles.viewHeaderPinyin}>{currentWord.pinyin}</Text>
                                        <Text style={styles.viewHeaderMeaning}>
                                            {currentWord.meaning || currentWord.translation}
                                        </Text>
                                    </View>

                                    <Text style={styles.examplesTitle}>Câu ví dụ ({currentWord.examples?.length || 0})</Text>

                                    {currentWord.examples && currentWord.examples.length > 0 ? (
                                        currentWord.examples.map((example: any, index: number) => (
                                            <View key={index} style={styles.exampleCard}>
                                                {/* Chinese Sentence with Speaker */}
                                                <TouchableOpacity
                                                    style={styles.exampleSentenceRow}
                                                    onPress={() => speakWord(example.sentence || example.chinese)}
                                                >
                                                    <Text style={styles.exampleChineseText}>{example.sentence || example.chinese}</Text>
                                                    <View style={styles.exampleSpeakerBtn}>
                                                        <Feather name="volume-2" size={20} color={LESSON_COLORS.primary} />
                                                    </View>
                                                </TouchableOpacity>

                                                {/* Pinyin */}
                                                {example.pinyin && (
                                                    <Text style={styles.examplePinyinText}>{example.pinyin}</Text>
                                                )}

                                                {/* Divider */}
                                                <View style={styles.exampleDivider} />

                                                {/* Vietnamese Translation */}
                                                <Text style={styles.exampleVietnameseText}>{example.translation || example.vietnamese}</Text>
                                            </View>
                                        ))
                                    ) : (
                                        <View style={styles.noExamples}>
                                            <Feather name="info" size={40} color={LESSON_COLORS.textSecondary} />
                                            <Text style={styles.noExamplesText}>
                                                Chưa có ví dụ cho từ "{currentWord.word || currentWord.character || ""}"
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Pronunciation Practice View */}
                            {currentWord && activeView === 'pronunciation' && (
                                <View style={styles.pronunciationView}>
                                    {/* Word Header */}
                                    <View style={styles.viewHeader}>
                                        <Text style={styles.pronunciationCharacter}>
                                            {currentWord.word || currentWord.character || ""}
                                        </Text>
                                        <Text style={styles.pronunciationPinyin}>{currentWord.pinyin}</Text>
                                        <Text style={styles.viewHeaderMeaning}>
                                            {currentWord.meaning || currentWord.translation}
                                        </Text>
                                    </View>

                                    {/* Listen Button */}
                                    <TouchableOpacity
                                        style={[styles.listenButton, isSpeaking && styles.listenButtonActive]}
                                        onPress={() => speakWord(currentWord.word || currentWord.character || "")}
                                    >
                                        <Feather
                                            name="volume-2"
                                            size={24}
                                            color={isSpeaking ? '#FFFFFF' : LESSON_COLORS.primary}
                                        />
                                        <Text style={[styles.listenButtonText, isSpeaking && styles.listenButtonTextActive]}>
                                            {isSpeaking ? 'Đang phát...' : 'Nghe mẫu'}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Record Section */}
                                    <View style={styles.recordSection}>
                                        <Text style={styles.recordSectionTitle}>Luyện phát âm</Text>

                                        {/* Recording Button */}
                                        <TouchableOpacity
                                            style={[
                                                styles.recordButton,
                                                isRecording && styles.recordButtonActive
                                            ]}
                                            onPress={isRecording ? stopRecording : startRecording}
                                            disabled={isAnalyzing}
                                        >
                                            {isAnalyzing ? (
                                                <ActivityIndicator size="large" color="#FFFFFF" />
                                            ) : (
                                                <Feather
                                                    name={isRecording ? "stop-circle" : "mic"}
                                                    size={32}
                                                    color="#FFFFFF"
                                                />
                                            )}
                                        </TouchableOpacity>

                                        <Text style={styles.recordHint}>
                                            {isRecording
                                                ? '🔴 Đang ghi âm... Nhấn để dừng'
                                                : isAnalyzing
                                                    ? 'Đang phân tích phát âm...'
                                                    : 'Nhấn để ghi âm phát âm của bạn'}
                                        </Text>

                                        {/* Pronunciation Result */}
                                        {pronunciationResult && (
                                            <View style={styles.resultContainer}>
                                                <View style={styles.scoreContainer}>
                                                    <Text style={styles.scoreLabel}>Điểm phát âm</Text>
                                                    <Text style={[
                                                        styles.scoreValue,
                                                        pronunciationResult.score >= 80 ? styles.scoreGood :
                                                            pronunciationResult.score >= 60 ? styles.scoreOk :
                                                                styles.scoreBad
                                                    ]}>
                                                        {pronunciationResult.score}/100
                                                    </Text>
                                                </View>

                                                {pronunciationResult.detected_text && (
                                                    <View style={styles.detectedTextContainer}>
                                                        <Text style={styles.detectedTextLabel}>Phát hiện:</Text>
                                                        <Text style={styles.detectedTextValue}>
                                                            {pronunciationResult.detected_text}
                                                        </Text>
                                                    </View>
                                                )}

                                                {pronunciationResult.feedback && (
                                                    <View style={styles.feedbackContainer}>
                                                        <Text style={styles.feedbackLabel}>Nhận xét:</Text>
                                                        <Text style={styles.feedbackText}>
                                                            {pronunciationResult.feedback}
                                                        </Text>
                                                    </View>
                                                )}

                                                {pronunciationResult.pronunciation_issues && pronunciationResult.pronunciation_issues.length > 0 && (
                                                    <View style={styles.issuesContainer}>
                                                        <Text style={styles.issuesLabel}>Cần cải thiện:</Text>
                                                        {pronunciationResult.pronunciation_issues.map((issue, index) => (
                                                            <Text key={index} style={styles.issueItem}>• {issue}</Text>
                                                        ))}
                                                    </View>
                                                )}

                                                <TouchableOpacity
                                                    style={styles.pronunciationRetryButton}
                                                    onPress={resetRecording}
                                                >
                                                    <Feather name="refresh-cw" size={18} color={LESSON_COLORS.primary} />
                                                    <Text style={styles.pronunciationRetryButtonText}>Thử lại</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>

                    {/* Action Buttons - Always visible (outside ScrollView) */}
                    {currentWord && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => speakWord(currentWord.word || currentWord.character || "")}
                            >
                                <View style={[styles.actionIconContainer, isSpeaking && styles.actionIconActive]}>
                                    <Feather name="volume-2" size={24} color={isSpeaking ? LESSON_COLORS.primary : LESSON_COLORS.textSecondary} />
                                </View>
                                <Text style={styles.actionButtonText}>Phát âm</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setActiveView(activeView === 'writing' ? 'card' : 'writing')}
                            >
                                <View style={[styles.actionIconContainer, activeView === 'writing' && styles.actionIconActive]}>
                                    <MaterialIcons name="draw" size={24} color={activeView === 'writing' ? LESSON_COLORS.primary : LESSON_COLORS.textSecondary} />
                                </View>
                                <Text style={[styles.actionButtonText, activeView === 'writing' && styles.actionButtonTextActive]}>Tập viết</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setActiveView(activeView === 'examples' ? 'card' : 'examples')}
                            >
                                <View style={[styles.actionIconContainer, activeView === 'examples' && styles.actionIconActive]}>
                                    <Text style={[styles.exampleIcon, activeView === 'examples' && { color: LESSON_COLORS.primary }]}>文A</Text>
                                </View>
                                <Text style={[styles.actionButtonText, activeView === 'examples' && styles.actionButtonTextActive]}>Ví dụ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setActiveView(activeView === 'pronunciation' ? 'card' : 'pronunciation')}
                            >
                                <View style={[styles.actionIconContainer, activeView === 'pronunciation' && styles.actionIconActive]}>
                                    <Feather name="mic" size={24} color={activeView === 'pronunciation' ? LESSON_COLORS.primary : LESSON_COLORS.textSecondary} />
                                </View>
                                <Text style={[styles.actionButtonText, activeView === 'pronunciation' && styles.actionButtonTextActive]}>Đọc</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Navigation Controls */}
                    <View style={styles.learningNavigation}>
                        <TouchableOpacity
                            style={[
                                styles.navButton,
                                styles.prevButton,
                                currentVocabIndex === 0 && styles.navButtonDisabled,
                            ]}
                            onPress={handlePrevVocab}
                            disabled={currentVocabIndex === 0}
                        >
                            <Feather name="chevron-left" size={24} color={currentVocabIndex === 0 ? LESSON_COLORS.textSecondary : LESSON_COLORS.textPrimary} />
                            <Text style={[
                                styles.navButtonText,
                                currentVocabIndex === 0 && styles.navButtonTextDisabled
                            ]}>Trước</Text>
                        </TouchableOpacity>

                        {currentVocabIndex < vocabularyList.length - 1 ? (
                            <TouchableOpacity
                                style={[styles.navButton, styles.nextButton]}
                                onPress={handleNextVocab}
                            >
                                <Text style={styles.nextButtonText}>Tiếp theo</Text>
                                <Feather name="chevron-right" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.navButton, styles.completeButton]}
                                onPress={completeLearningMode}
                            >
                                <Feather name="check" size={20} color="#FFFFFF" />
                                <Text style={styles.nextButtonText}>Hoàn thành</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LESSON_COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        marginTop: 16,
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: LESSON_COLORS.primary,
        borderRadius: 16,
    },
    retryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: LESSON_COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: LESSON_COLORS.primary,
        marginTop: 2,
    },
    menuButton: {
        padding: 8,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    progressCard: {
        backgroundColor: LESSON_COLORS.cardBackground,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
    },
    progressPercent: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.primary,
    },
    progressBar: {
        marginBottom: 12,
    },
    progressSubtext: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    infoCard: {
        backgroundColor: LESSON_COLORS.cardBackground,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: LESSON_COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: 8,
    },
    infoTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 12,
    },
    infoMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    infoText: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        marginLeft: 6,
    },
    illustrationContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    illustrationEmoji: {
        fontSize: 48,
    },
    activitiesSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: LESSON_COLORS.cardBackground,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    activityIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 2,
    },
    activityTitleLocked: {
        color: LESSON_COLORS.disabledIcon,
    },
    activitySubtitle: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    activitySubtitleLocked: {
        color: LESSON_COLORS.disabledIcon,
    },
    activityRight: {
        marginLeft: 12,
    },
    completedBadge: {
        padding: 4,
    },
    continueButton: {
        backgroundColor: LESSON_COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    continueButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    startButton: {
        backgroundColor: LESSON_COLORS.secondaryPink,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    startButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: LESSON_COLORS.primary,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: LESSON_COLORS.cardBackground,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 5,
    },
    mainButton: {
        backgroundColor: LESSON_COLORS.primary,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonCompleted: {
        backgroundColor: LESSON_COLORS.success,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Vocabulary Learning Modal Styles
    learningModal: {
        flex: 1,
        backgroundColor: LESSON_COLORS.background,
    },
    learningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: LESSON_COLORS.cardBackground,
    },
    closeButton: {
        padding: 8,
    },
    learningHeaderCenter: {
        alignItems: 'center',
    },
    learningHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
    },
    learningProgress: {
        fontSize: 14,
        color: LESSON_COLORS.primary,
        fontWeight: '500',
        marginTop: 2,
    },
    favoriteButton: {
        padding: 8,
    },
    learningProgressBar: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: LESSON_COLORS.cardBackground,
    },
    vocabCard: {
        flex: 1,
        backgroundColor: LESSON_COLORS.cardBackground,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    vocabCharacter: {
        fontSize: 72,
        fontWeight: '300',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 16,
    },
    pinyinContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    vocabPinyin: {
        fontSize: 24,
        color: LESSON_COLORS.primary,
        fontWeight: '500',
    },
    vocabDivider: {
        width: 60,
        height: 2,
        backgroundColor: LESSON_COLORS.primary,
        marginVertical: 20,
    },
    vocabMeaning: {
        fontSize: 24,
        fontWeight: '500',
        color: LESSON_COLORS.textSecondary,
        textAlign: 'center',
    },
    exampleContainer: {
        marginTop: 24,
        padding: 16,
        backgroundColor: LESSON_COLORS.secondaryPink,
        borderRadius: 12,
        width: '100%',
    },
    exampleLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: LESSON_COLORS.primary,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    exampleChinese: {
        fontSize: 18,
        color: LESSON_COLORS.textPrimary,
        marginBottom: 4,
    },
    exampleVietnamese: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    learningNavigation: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        backgroundColor: LESSON_COLORS.cardBackground,
    },
    navButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    prevButton: {
        backgroundColor: LESSON_COLORS.background,
        borderWidth: 1,
        borderColor: LESSON_COLORS.disabledIcon,
    },
    nextButton: {
        backgroundColor: LESSON_COLORS.primary,
    },
    completeButton: {
        backgroundColor: LESSON_COLORS.success,
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
    },
    navButtonTextDisabled: {
        color: LESSON_COLORS.textSecondary,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Action buttons styles
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 32,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: LESSON_COLORS.secondaryPink,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionIconActive: {
        backgroundColor: LESSON_COLORS.secondaryPink,
        borderWidth: 2,
        borderColor: LESSON_COLORS.primary,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
        color: LESSON_COLORS.textSecondary,
    },
    exampleIcon: {
        fontSize: 16,
        fontWeight: '600',
        color: LESSON_COLORS.textSecondary,
    },
    actionButtonTextActive: {
        color: LESSON_COLORS.primary,
    },
    // Scroll view styles
    vocabCardScroll: {
        flex: 1,
    },
    vocabCardScrollContent: {
        flexGrow: 1,
    },
    // Writing View Styles
    writingView: {
        alignItems: 'center',
        width: '100%',
    },
    writingCharacter: {
        fontSize: 80,
        fontWeight: '300',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 8,
    },
    writingInstruction: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        marginBottom: 20,
    },
    writingCanvas: {
        width: '100%',
        height: 200,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    writingGuide: {
        position: 'absolute',
        opacity: 0.2,
    },
    writingGuideText: {
        fontSize: 120,
        color: LESSON_COLORS.textSecondary,
    },
    writingHint: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    strokeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 8,
    },
    strokeText: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    // Examples View Styles
    examplesView: {
        width: '100%',
        alignItems: 'flex-start',
    },
    examplesTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 16,
    },
    exampleItem: {
        width: '100%',
        backgroundColor: LESSON_COLORS.secondaryPink,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    exampleCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    exampleSentenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    exampleChineseText: {
        fontSize: 22,
        fontWeight: '500',
        color: LESSON_COLORS.textPrimary,
        flex: 1,
        lineHeight: 32,
    },
    exampleSpeakerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: LESSON_COLORS.secondaryPink,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    examplePinyinText: {
        fontSize: 16,
        color: LESSON_COLORS.primary,
        marginBottom: 12,
    },
    exampleDivider: {
        height: 1,
        backgroundColor: '#E8E8E8',
        marginVertical: 12,
    },
    exampleVietnameseText: {
        fontSize: 16,
        color: LESSON_COLORS.textSecondary,
        fontStyle: 'italic',
        lineHeight: 24,
    },
    exampleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    examplePinyin: {
        fontSize: 14,
        color: LESSON_COLORS.primary,
        marginTop: 4,
    },
    noExamples: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        width: '100%',
    },
    noExamplesText: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        marginTop: 8,
    },
    // Pronunciation View Styles
    pronunciationView: {
        alignItems: 'center',
        width: '100%',
    },
    pronunciationCharacter: {
        fontSize: 64,
        fontWeight: '300',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 8,
    },
    pronunciationPinyin: {
        fontSize: 24,
        color: LESSON_COLORS.primary,
        fontWeight: '500',
        marginBottom: 24,
    },
    listenButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: LESSON_COLORS.secondaryPink,
        borderRadius: 24,
        marginBottom: 32,
    },
    listenButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: LESSON_COLORS.primary,
    },
    recordSection: {
        alignItems: 'center',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: LESSON_COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    recordHint: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        textAlign: 'center',
    },
    // View Header Styles
    viewHeader: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    viewHeaderWord: {
        fontSize: 48,
        fontWeight: '300',
        color: LESSON_COLORS.textPrimary,
    },
    viewHeaderPinyin: {
        fontSize: 20,
        color: LESSON_COLORS.primary,
        fontWeight: '500',
        marginTop: 4,
    },
    viewHeaderMeaning: {
        fontSize: 16,
        color: LESSON_COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    wordWithSpeaker: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    speakerIcon: {
        padding: 4,
    },
    // Clear Button
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: LESSON_COLORS.secondaryPink,
        borderRadius: 20,
        marginTop: 16,
    },
    clearButtonText: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
    },
    // Listen Button Active State
    listenButtonActive: {
        backgroundColor: LESSON_COLORS.primary,
    },
    listenButtonTextActive: {
        color: '#FFFFFF',
    },
    // Record Section Title
    recordSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: LESSON_COLORS.textPrimary,
        marginBottom: 16,
    },
    recordSubHint: {
        fontSize: 12,
        color: LESSON_COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    // Recording Active State
    recordButtonActive: {
        backgroundColor: '#E53935',
    },
    // Result Container
    resultContainer: {
        width: '100%',
        backgroundColor: LESSON_COLORS.secondaryPink,
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreLabel: {
        fontSize: 14,
        color: LESSON_COLORS.textSecondary,
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: '700',
    },
    scoreGood: {
        color: '#4CAF50',
    },
    scoreOk: {
        color: '#FF9800',
    },
    scoreBad: {
        color: '#E53935',
    },
    detectedTextContainer: {
        marginBottom: 12,
    },
    detectedTextLabel: {
        fontSize: 12,
        color: LESSON_COLORS.textSecondary,
        marginBottom: 4,
    },
    detectedTextValue: {
        fontSize: 18,
        fontWeight: '500',
        color: LESSON_COLORS.textPrimary,
    },
    feedbackContainer: {
        marginBottom: 12,
    },
    feedbackLabel: {
        fontSize: 12,
        color: LESSON_COLORS.textSecondary,
        marginBottom: 4,
    },
    feedbackText: {
        fontSize: 14,
        color: LESSON_COLORS.textPrimary,
        lineHeight: 20,
    },
    issuesContainer: {
        marginBottom: 12,
    },
    issuesLabel: {
        fontSize: 12,
        color: LESSON_COLORS.textSecondary,
        marginBottom: 8,
    },
    issueItem: {
        fontSize: 14,
        color: '#E53935',
        marginBottom: 4,
    },
    pronunciationRetryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginTop: 8,
    },
    pronunciationRetryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: LESSON_COLORS.primary,
    },
});

export default LessonDetailScreen;
