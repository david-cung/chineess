import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { generateQuizMCQ } from '../utils/api';

interface PlaylistItem {
    zh: string;
    vi: string;
}

const RadioModeScreen: React.FC<{ route?: any, navigation?: any }> = ({ route, navigation }) => {
    const lessonId = route?.params?.lessonId || 1;
    const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRepeat, setIsRepeat] = useState(false);

    // Refs for playback control
    const isPlayingRef = useRef(isPlaying);
    const isRepeatRef = useRef(isRepeat);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        isRepeatRef.current = isRepeat;
    }, [isRepeat]);

    useEffect(() => {
        loadPlaylist();
        return () => stopPlayback();
    }, []);

    // Whenever we hit play or switch track, we start speaking automatically
    useEffect(() => {
        if (isPlaying && playlist.length > 0) {
            playCurrentTrack();
        } else {
            Speech.stop();
            clearAllTimeouts();
        }
    }, [isPlaying, currentIndex, playlist]);

    const loadPlaylist = async () => {
        setIsLoading(true);
        const data = await generateQuizMCQ(lessonId);
        
        // Extract unique vocab from quiz endpoint
        const vocabMap = new Map();
        data.forEach(q => {
            if (q.type === 'zh_to_en') {
                vocabMap.set(q.vocabulary_id, { zh: q.question, vi: q.correct_answer });
            } else {
                vocabMap.set(q.vocabulary_id, { zh: q.correct_answer, vi: q.question });
            }
        });
        
        const extracted = Array.from(vocabMap.values());
        setPlaylist(extracted);
        setIsLoading(false);
    };

    const stopPlayback = () => {
        setIsPlaying(false);
        Speech.stop();
        clearAllTimeouts();
    };

    const clearAllTimeouts = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const playCurrentTrack = () => {
        Speech.stop();
        clearAllTimeouts();

        if (playlist.length === 0 || !isPlayingRef.current) return;

        const item = playlist[currentIndex];

        // Animate text breathing
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true })
        ]).start();

        // 1. Speak Chinese
        Speech.speak(item.zh, {
            language: 'zh-CN',
            rate: 0.8,
            onDone: () => {
                if (!isPlayingRef.current) return;
                
                // 2. Wait 1 second
                timeoutRef.current = setTimeout(() => {
                    if (!isPlayingRef.current) return;
                    
                    // 3. Speak Vietnamese
                    Speech.speak(item.vi, {
                        language: 'vi-VN',
                        rate: 1.0,
                        onDone: () => {
                            if (!isPlayingRef.current) return;
                            
                            // 4. Wait 2 seconds and move to next track
                            timeoutRef.current = setTimeout(() => {
                                if (!isPlayingRef.current) return;
                                
                                if (isRepeatRef.current) {
                                    playCurrentTrack(); // Loop same track
                                } else {
                                    handleNext(); // Move to next
                                }
                            }, 2000);
                        }
                    });
                }, 1000);
            }
        });
    };

    const handleNext = () => {
        if (playlist.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
    };

    const handlePrev = () => {
        if (playlist.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                        <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Tạo danh sách phát...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (playlist.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                        <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContainer}>
                    <Feather name="volume-x" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>Chưa có từ vựng cho Đài Radio này.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentItem = playlist[currentIndex];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hanyu Podcast</Text>
                <View style={styles.trackBadge}>
                    <Text style={styles.trackBadgeText}>{currentIndex + 1} / {playlist.length}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.lyricsContainer}>
                    <Animated.Text style={[styles.mainLyric, { transform: [{ scale: scaleAnim }] }]}>
                        {currentItem.zh}
                    </Animated.Text>
                    <Text style={styles.subLyric}>{currentItem.vi}</Text>
                </View>

                <View style={styles.playerCard}>
                    <View style={styles.progressRow}>
                        <View style={styles.progressBarWrapper}>
                            <View style={[styles.progressBar, { width: `${((currentIndex + 1) / playlist.length) * 100}%` }]} />
                        </View>
                    </View>
                    
                    <View style={styles.controls}>
                        <TouchableOpacity 
                            style={styles.actionBtn} 
                            onPress={() => setIsRepeat(!isRepeat)}
                        >
                            <Feather name="repeat" size={24} color={isRepeat ? COLORS.primary : COLORS.textSecondary} />
                        </TouchableOpacity>
                        
                        <View style={styles.mainControls}>
                            <TouchableOpacity style={styles.controlBtn} onPress={handlePrev}>
                                <Feather name="skip-back" size={28} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.playBtn, isPlaying && styles.playBtnActive, SHADOWS.medium]} 
                                onPress={togglePlay}
                            >
                                <Feather name={isPlaying ? "pause" : "play"} size={36} color="white" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.controlBtn} onPress={handleNext}>
                                <Feather name="skip-forward" size={28} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.actionBtn}>
                            <Feather name="shuffle" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Feather name="headphones" size={18} color={COLORS.secondary} />
                    <Text style={styles.infoText}>
                        Chế độ Rảnh tay: Ứng dụng tự động đọc lặp lại từ vựng + nghĩa tiếng Việt. Thích hợp nghe khi đang di chuyển.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
    backBtn: { padding: SPACING.xs },
    headerTitle: { fontSize: FONT_SIZES.body, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    trackBadge: { backgroundColor: COLORS.progressBackground, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    trackBadgeText: { fontSize: FONT_SIZES.caption, color: COLORS.primary, fontWeight: 'bold' },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    emptyText: { textAlign: 'center', marginVertical: SPACING.lg, fontSize: FONT_SIZES.body, color: COLORS.textSecondary },

    content: { flex: 1, padding: SPACING.xl, justifyContent: 'space-between', alignItems: 'center' },
    
    lyricsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xxl },
    mainLyric: { fontSize: 80, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.lg, letterSpacing: 4 },
    subLyric: { fontSize: FONT_SIZES.h4, color: COLORS.textSecondary, textAlign: 'center', fontWeight: '500' },

    playerCard: { width: '100%', backgroundColor: COLORS.cardBackground, borderRadius: 32, padding: SPACING.xl, ...SHADOWS.medium },
    progressRow: { marginBottom: SPACING.lg },
    progressBarWrapper: { width: '100%', height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
    progressBar: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
    
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mainControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xl },
    controlBtn: { padding: SPACING.sm },
    actionBtn: { padding: SPACING.sm },
    playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
    playBtnActive: { backgroundColor: '#FF5252' }, // Red when playing/pausing
    
    infoBox: { flexDirection: 'row', gap: SPACING.md, backgroundColor: '#EBF3FC', padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, marginTop: SPACING.xxl, width: '100%' },
    infoText: { flex: 1, fontSize: FONT_SIZES.bodySmall, color: COLORS.secondary, lineHeight: 20 },
});

export default RadioModeScreen;
