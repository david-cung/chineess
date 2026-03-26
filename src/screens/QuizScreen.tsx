import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { generateQuizMCQ } from '../utils/api';
import { QuizQuestion } from '../types';

const TIMER_DURATION = 10; // 10 seconds per question

const QuizScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
    const { lessonId } = route.params;
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    
    // Timer state
    const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const timerAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadQuiz();
        return () => clearTimer();
    }, []);

    useEffect(() => {
        if (!isLoading && questions.length > 0 && !isQuizFinished && !isAnswered) {
            startTimer();
        } else {
            clearTimer();
        }
        return () => clearTimer();
    }, [isLoading, currentIndex, isAnswered, isQuizFinished]);

    // Animate timer warning when < 3s left
    useEffect(() => {
        if (timeLeft <= 3 && timeLeft > 0 && !isAnswered) {
            Animated.sequence([
                Animated.timing(timerAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                Animated.timing(timerAnim, { toValue: 1, duration: 150, useNativeDriver: true })
            ]).start();
        }
    }, [timeLeft]);

    const loadQuiz = async () => {
        setIsLoading(true);
        setIsQuizFinished(false);
        setCurrentIndex(0);
        setScore(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setTimeLeft(TIMER_DURATION);
        
        const data = await generateQuizMCQ(lessonId);
        setQuestions(data);
        setIsLoading(false);
    };

    const startTimer = () => {
        clearTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleTimeUp = () => {
        if (isAnswered) return;
        setIsAnswered(true);
        setSelectedOption(null); // Time up = no answer
        
        const currentQ = questions[currentIndex];
        Speech.speak(currentQ.type === 'zh_to_en' ? currentQ.question : currentQ.correct_answer, { language: 'zh-CN' });
    };

    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedOption || isAnswered) return;
        clearTimer();

        const currentQ = questions[currentIndex];
        const correct = selectedOption === currentQ.correct_answer;

        if (correct) {
            setScore(score + 1);
        }

        setIsAnswered(true);
        Speech.speak(currentQ.type === 'zh_to_en' ? currentQ.question : currentQ.correct_answer, { language: 'zh-CN' });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setTimeLeft(TIMER_DURATION);
        } else {
            setIsQuizFinished(true);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Feather name="x" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải câu hỏi...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (questions.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Feather name="x" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyContainer}>
                    <Feather name="folder-minus" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>Chưa có từ vựng cho bài học này.</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (isQuizFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        const isSuccess = percentage >= 80;
        
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Feather name="x" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kết Quả</Text>
                    <View style={{ width: 24 }} />
                </View>
                
                <View style={styles.summaryContainer}>
                    <View style={styles.iconWrapper}>
                        <Feather 
                            name={isSuccess ? "award" : "target"} 
                            size={64} 
                            color={isSuccess ? COLORS.success : COLORS.warning} 
                        />
                    </View>
                    
                    <Text style={styles.summaryTitle}>
                        {isSuccess ? 'Tuyệt Vời!' : 'Cố gắng lên nhé!'}
                    </Text>
                    <Text style={styles.summarySubtitle}>
                        Bạn đã hoàn thành Trắc nghiệm nhanh
                    </Text>
                    
                    <View style={styles.scoreBoard}>
                        <View style={styles.scoreItem}>
                            <Text style={styles.scoreValue}>{score}/{questions.length}</Text>
                            <Text style={styles.scoreLabel}>Câu đúng</Text>
                        </View>
                        <View style={styles.scoreDivider} />
                        <View style={styles.scoreItem}>
                            <Text style={[styles.scoreValue, { color: isSuccess ? COLORS.success : COLORS.warning }]}>
                                {percentage}%
                            </Text>
                            <Text style={styles.scoreLabel}>Độ chính xác</Text>
                        </View>
                    </View>
                    
                    <View style={styles.summaryActions}>
                        <TouchableOpacity style={styles.replayBtn} onPress={loadQuiz}>
                            <Feather name="rotate-ccw" size={20} color="white" />
                            <Text style={styles.replayBtnText}>Chơi lại</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.quitBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.quitBtnText}>Quay về</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const currentQ = questions[currentIndex];
    const timerColor = timeLeft <= 3 ? COLORS.error : COLORS.primary;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="x" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                
                <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBar, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                </View>
                
                <View style={styles.scoreBadge}>
                    <Feather name="star" size={12} color="#FFD700" />
                    <Text style={styles.scoreText}>{score}</Text>
                </View>
            </View>
            
            <View style={styles.timerRow}>
                <Animated.View style={[styles.timerBadge, { transform: [{ scale: timerAnim }], backgroundColor: timerColor + '15' }]}>
                    <Feather name="clock" size={16} color={timerColor} />
                    <Text style={[styles.timerText, { color: timerColor }]}>
                        {timeLeft}s
                    </Text>
                </Animated.View>
            </View>

            <View style={styles.questionContainer}>
                <Text style={styles.questionType}>
                    {currentQ.type === 'zh_to_en' ? 'Chọn nghĩa đúng của từ này:' : 'Từ này trong tiếng Trung là:'}
                </Text>
                <Text style={styles.questionText}>{currentQ.question}</Text>
            </View>

            <View style={styles.optionsContainer}>
                {currentQ.options.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = isAnswered && option === currentQ.correct_answer;
                    const isWrong = isAnswered && isSelected && option !== currentQ.correct_answer;
                    const isMissed = isAnswered && !selectedOption && option === currentQ.correct_answer; // show answer if time out

                    let btnStyles: any[] = [styles.optionBtn];
                    let textStyles: any[] = [styles.optionText];
                    
                    if (isSelected) btnStyles.push(styles.optionSelected);
                    if (isCorrect || isMissed) {
                        btnStyles.push(styles.optionCorrect);
                        textStyles.push(styles.textWhite);
                    } else if (isWrong) {
                        btnStyles.push(styles.optionWrong);
                        textStyles.push(styles.textWhite);
                    } else if (isAnswered) {
                        btnStyles.push(styles.optionMuted); // mute other options
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleOptionSelect(option)}
                            style={btnStyles}
                            disabled={isAnswered}
                        >
                            <Text style={textStyles}>{option}</Text>
                            
                            {(isCorrect || isMissed) && (
                                <Feather name="check-circle" size={20} color="white" style={styles.optionIcon} />
                            )}
                            {isWrong && (
                                <Feather name="x-circle" size={20} color="white" style={styles.optionIcon} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footer}>
                {!isAnswered ? (
                    <TouchableOpacity
                        onPress={handleCheckAnswer}
                        style={[styles.checkBtn, !selectedOption && { opacity: 0.5 }]}
                        disabled={!selectedOption}
                    >
                        <Text style={styles.checkBtnText}>KIỂM TRA</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                        <Text style={styles.nextBtnText}>TIẾP TỤC</Text>
                        <Feather name="arrow-right" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, justifyContent: 'space-between' },
    headerTitle: { fontSize: FONT_SIZES.h4, fontWeight: '700', color: COLORS.textPrimary },
    progressBarWrapper: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginHorizontal: 20 },
    progressBar: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
    scoreBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9C4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    scoreText: { fontSize: FONT_SIZES.caption, fontWeight: 'bold', color: '#F57F17' },
    
    timerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
    timerBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
    timerText: { fontSize: FONT_SIZES.body, fontWeight: '700' },
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary },
    
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    emptyText: { textAlign: 'center', marginVertical: SPACING.lg, fontSize: FONT_SIZES.body, color: COLORS.textSecondary },
    backBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md },
    backBtnText: { color: 'white', fontWeight: 'bold' },
    
    questionContainer: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.xl, alignItems: 'center' },
    questionType: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textSecondary, marginBottom: 16 },
    questionText: { fontSize: 42, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
    
    optionsContainer: { paddingHorizontal: SPACING.lg, flex: 1 },
    optionBtn: { 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.cardBackground, 
        padding: 20, 
        borderRadius: BORDER_RADIUS.lg, 
        marginBottom: 12, 
        borderWidth: 2, 
        borderColor: COLORS.border,
        ...SHADOWS.small
    },
    optionSelected: { borderColor: COLORS.primary, backgroundColor: '#EBF3FC' },
    optionCorrect: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    optionWrong: { backgroundColor: COLORS.error, borderColor: COLORS.error },
    optionMuted: { opacity: 0.5 },
    optionText: { fontSize: FONT_SIZES.body, color: COLORS.textPrimary, fontWeight: '500', flex: 1 },
    textWhite: { color: 'white' },
    optionIcon: { marginLeft: 10 },
    
    footer: { padding: SPACING.lg, paddingBottom: 40 },
    checkBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: BORDER_RADIUS.round, alignItems: 'center', ...SHADOWS.small },
    nextBtn: { flexDirection: 'row', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, padding: 18, borderRadius: BORDER_RADIUS.round, alignItems: 'center', ...SHADOWS.small },
    checkBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 1, fontSize: FONT_SIZES.body },
    nextBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 1, fontSize: FONT_SIZES.body },
    
    summaryContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    iconWrapper: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl, ...SHADOWS.medium },
    summaryTitle: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
    summarySubtitle: { fontSize: FONT_SIZES.body, color: COLORS.textSecondary, marginBottom: SPACING.xl },
    scoreBoard: { flexDirection: 'row', backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, width: '100%', marginBottom: 40, ...SHADOWS.medium },
    scoreItem: { flex: 1, alignItems: 'center' },
    scoreValue: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    scoreLabel: { fontSize: FONT_SIZES.caption, color: COLORS.textSecondary, textTransform: 'uppercase' },
    scoreDivider: { width: 1, backgroundColor: COLORS.divider, marginHorizontal: SPACING.md },
    summaryActions: { width: '100%', gap: SPACING.md },
    replayBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: BORDER_RADIUS.round, ...SHADOWS.small },
    replayBtnText: { color: 'white', fontSize: FONT_SIZES.body, fontWeight: '700' },
    quitBtn: { paddingVertical: 16, alignItems: 'center' },
    quitBtnText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.body, fontWeight: '600' },
});

export default QuizScreen;
