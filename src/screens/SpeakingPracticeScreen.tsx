import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Platform,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

interface VocabItem {
    id: number;
    word: string;
    pinyin: string;
    meaning: string;
}

interface ScoreResult {
    score: number;
    feedback: string;
    detected_text?: string;
    pronunciation_issues: string[];
}

// Web-specific recording using MediaRecorder
const useWebRecorder = () => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            chunksRef.current = [];
            mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mediaRecorderRef.current = mr;
            mr.start();
            return true;
        } catch {
            return false;
        }
    };

    const stopRecording = (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const mr = mediaRecorderRef.current;
            if (!mr) { resolve(null); return; }
            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                mr.stream.getTracks().forEach(t => t.stop());
                resolve(blob);
            };
            mr.stop();
        });
    };

    return { startRecording, stopRecording };
};

const SpeakingPracticeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const [vocabList, setVocabList] = useState<VocabItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const webRecorder = useWebRecorder();

    useEffect(() => {
        fetchVocab();
    }, []);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [isRecording]);

    const fetchVocab = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE_URL}/characters/random?limit=10`);
            if (res.ok) {
                const data = await res.json();
                setVocabList(data.map((item: any) => ({
                    id: item.id,
                    word: item.character || item.word,
                    pinyin: item.pinyin,
                    meaning: item.meaning,
                })));
            }
        } catch (err) {
            console.error('Error fetching vocab:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = () => {
        const word = vocabList[currentIndex]?.word;
        if (word) Speech.speak(word, { language: 'zh-CN', rate: 0.8 });
    };

    const handleMicPress = async () => {
        if (isRecording) {
            // Stop recording
            setIsRecording(false);
            setIsAnalyzing(true);
            setScoreResult(null);

            try {
                const currentWord = vocabList[currentIndex];
                let audioBlob: Blob | null = null;

                if (Platform.OS === 'web') {
                    audioBlob = await webRecorder.stopRecording();
                }

                if (!audioBlob) {
                    setScoreResult({ score: 0, feedback: 'Không thể ghi âm trên thiết bị này. Hãy thử trên iOS/Android.', pronunciation_issues: [] });
                    return;
                }

                const token = await AsyncStorage.getItem('access_token');
                const formData = new FormData();
                formData.append('expected_text', currentWord.word);
                formData.append('expected_pinyin', currentWord.pinyin);
                formData.append('audio', audioBlob, 'recording.webm');

                const res = await fetch(`${API_BASE_URL}/api/v1/pronunciation/score`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                });

                if (res.ok) {
                    const data: ScoreResult = await res.json();
                    setScoreResult(data);
                } else {
                    const errData = await res.json().catch(() => ({}));
                    const detail = errData.detail || '';
                    if (res.status === 429 || detail.includes('429') || detail.includes('Quota') || detail.includes('exhausted')) {
                        setScoreResult({
                            score: 0,
                            feedback: '⚠️ AI hiện đang quá tải hoặc hết lượt miễn phí (Lỗi 429 Quota Exceeded). Vui lòng cấu hình API Key mới trong Backend.',
                            pronunciation_issues: []
                        });
                    } else {
                        setScoreResult({
                            score: 0,
                            feedback: detail || 'Không thể phân tích. Hãy đăng nhập và thử lại.',
                            pronunciation_issues: []
                        });
                    }
                }
            } catch (err) {
                setScoreResult({ score: 0, feedback: 'Lỗi kết nối server.', pronunciation_issues: [] });
            } finally {
                setIsAnalyzing(false);
            }
        } else {
            // Start recording
            setScoreResult(null);
            let started = false;
            if (Platform.OS === 'web') {
                started = await webRecorder.startRecording();
            }

            if (!started && Platform.OS !== 'web') {
                // Native fallback (expo-av) — import dynamically
                try {
                    const { Audio } = await import('expo-av');
                    const { status } = await Audio.requestPermissionsAsync();
                    if (status !== 'granted') return;
                    started = true;
                } catch {}
            }

            if (started || Platform.OS === 'web') {
                setIsRecording(true);
            }
        }
    };

    const goNext = () => {
        if (currentIndex < vocabList.length - 1) {
            setCurrentIndex(i => i + 1);
            setScoreResult(null);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            setScoreResult(null);
        }
    };

    const getScoreColor = (score: number) =>
        score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.error;

    const getScoreLabel = (score: number) =>
        score >= 90 ? 'Xuất sắc! 🎉' : score >= 80 ? 'Rất tốt! 👏' : score >= 60 ? 'Khá tốt 👍' : 'Cần luyện thêm 💪';

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải từ vựng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const current = vocabList[currentIndex];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Luyện Nói</Text>
                <View style={styles.counter}>
                    <Text style={styles.counterText}>{currentIndex + 1}/{vocabList.length}</Text>
                </View>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Word Card */}
                <View style={styles.wordCard}>
                    <Text style={styles.chineseWord}>{current?.word}</Text>
                    <Text style={styles.pinyin}>{current?.pinyin}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.meaning}>{current?.meaning}</Text>

                    <TouchableOpacity style={styles.listenBtn} onPress={playAudio}>
                        <Feather name="volume-2" size={18} color={COLORS.secondary} />
                        <Text style={styles.listenBtnText}>Nghe phát âm mẫu</Text>
                    </TouchableOpacity>
                </View>

                {/* Recording Section */}
                <View style={styles.recordingSection}>
                    <Text style={styles.instruction}>
                        {isRecording ? '🎙 Đang ghi âm... Nhấn để dừng' : isAnalyzing ? '🤖 AI đang phân tích...' : 'Nhấn nút mic để bắt đầu đọc'}
                    </Text>

                    <Animated.View style={[styles.micWrapper, { transform: [{ scale: pulseAnim }] }]}>
                        <TouchableOpacity
                            style={[styles.micButton, isRecording && styles.micButtonActive]}
                            onPress={handleMicPress}
                            disabled={isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <Feather name={isRecording ? 'square' : 'mic'} size={36} color="white" />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Score Result */}
                {scoreResult && (
                    <View style={styles.resultCard}>
                        <View style={[styles.scoreCircle, { borderColor: getScoreColor(scoreResult.score) }]}>
                            <Text style={[styles.scoreNumber, { color: getScoreColor(scoreResult.score) }]}>
                                {Math.round(scoreResult.score)}
                            </Text>
                            <Text style={styles.scoreUnit}>/ 100</Text>
                        </View>

                        <Text style={[styles.scoreLabel, { color: getScoreColor(scoreResult.score) }]}>
                            {getScoreLabel(scoreResult.score)}
                        </Text>

                        {scoreResult.detected_text && (
                            <View style={styles.detectedBox}>
                                <Text style={styles.detectedLabel}>Bạn đã đọc:</Text>
                                <Text style={styles.detectedText}>"{scoreResult.detected_text}"</Text>
                            </View>
                        )}

                        <Text style={styles.feedback}>{scoreResult.feedback}</Text>

                        {scoreResult.pronunciation_issues.length > 0 && (
                            <View style={styles.issuesList}>
                                <Text style={styles.issuesTitle}>Điểm cần cải thiện:</Text>
                                {scoreResult.pronunciation_issues.map((issue, i) => (
                                    <View key={i} style={styles.issueItem}>
                                        <Feather name="alert-circle" size={14} color={COLORS.warning} />
                                        <Text style={styles.issueText}>{issue}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity style={styles.retryBtn} onPress={() => setScoreResult(null)}>
                            <Feather name="refresh-cw" size={14} color={COLORS.primary} />
                            <Text style={styles.retryBtnText}>Thử lại</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Navigation */}
            <View style={styles.navRow}>
                <TouchableOpacity
                    style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
                    onPress={goPrev}
                    disabled={currentIndex === 0}
                >
                    <Feather name="chevron-left" size={20} color={currentIndex === 0 ? COLORS.textLight : COLORS.textPrimary} />
                    <Text style={[styles.navBtnText, currentIndex === 0 && { color: COLORS.textLight }]}>Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navBtn, styles.navBtnNext, currentIndex === vocabList.length - 1 && styles.navBtnDisabled]}
                    onPress={goNext}
                    disabled={currentIndex === vocabList.length - 1}
                >
                    <Text style={[styles.navBtnTextNext, currentIndex === vocabList.length - 1 && { color: COLORS.textLight }]}>Tiếp theo</Text>
                    <Feather name="chevron-right" size={20} color={currentIndex === vocabList.length - 1 ? COLORS.textLight : 'white'} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    backBtn: { padding: SPACING.xs },
    headerTitle: { fontSize: FONT_SIZES.h4, fontWeight: '700', color: COLORS.textPrimary },
    counter: {
        backgroundColor: COLORS.progressBackground,
        paddingHorizontal: SPACING.md,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.round,
    },
    counterText: { fontSize: FONT_SIZES.bodySmall, color: COLORS.primary, fontWeight: '600' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl },
    wordCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        alignItems: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.medium,
    },
    chineseWord: { fontSize: 72, fontWeight: '700', color: COLORS.textPrimary },
    pinyin: { fontSize: FONT_SIZES.h3, color: COLORS.primary, fontWeight: '500', marginTop: 4 },
    divider: { width: 60, height: 2, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
    meaning: { fontSize: FONT_SIZES.body, color: COLORS.textSecondary },
    listenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.md,
        gap: 6,
        backgroundColor: '#EBF3FC',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
    },
    listenBtnText: { color: COLORS.secondary, fontWeight: '600', fontSize: FONT_SIZES.bodySmall },
    recordingSection: { alignItems: 'center', marginBottom: SPACING.lg },
    instruction: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textSecondary, marginBottom: SPACING.lg, textAlign: 'center' },
    micWrapper: { marginBottom: SPACING.md },
    micButton: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.large,
    },
    micButtonActive: { backgroundColor: COLORS.error },
    resultCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.lg,
        alignItems: 'center',
        ...SHADOWS.medium,
        marginBottom: SPACING.lg,
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    scoreNumber: { fontSize: 36, fontWeight: '800' },
    scoreUnit: { fontSize: 12, color: COLORS.textSecondary },
    scoreLabel: { fontSize: FONT_SIZES.h4, fontWeight: '700', marginBottom: SPACING.md },
    detectedBox: {
        backgroundColor: COLORS.background,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        width: '100%',
        marginBottom: SPACING.sm,
    },
    detectedLabel: { fontSize: FONT_SIZES.caption, color: COLORS.textSecondary, marginBottom: 2 },
    detectedText: { fontSize: FONT_SIZES.body, color: COLORS.textPrimary, fontStyle: 'italic' },
    feedback: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
    issuesList: { alignSelf: 'stretch', marginBottom: SPACING.md },
    issuesTitle: { fontSize: FONT_SIZES.bodySmall, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
    issueItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    issueText: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textSecondary, flex: 1 },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.round,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    retryBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZES.bodySmall },
    navRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        backgroundColor: COLORS.cardBackground,
        gap: SPACING.sm,
    },
    navBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 4,
    },
    navBtnNext: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textPrimary, fontWeight: '600' },
    navBtnTextNext: { fontSize: FONT_SIZES.bodySmall, color: 'white', fontWeight: '600' },
});

export default SpeakingPracticeScreen;
