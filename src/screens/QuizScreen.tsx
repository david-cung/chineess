import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { generateQuizMCQ } from '../utils/api';
import { QuizQuestion } from '../types';

const QuizScreen: React.FC<{ route: any, navigation: any }> = ({ route, navigation }) => {
    const { lessonId } = route.params;
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadQuiz();
    }, []);

    const loadQuiz = async () => {
        setIsLoading(true);
        const data = await generateQuizMCQ(lessonId);
        setQuestions(data);
        setIsLoading(false);
    };

    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedOption || isAnswered) return;

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
        } else {
            // Finished
            Alert.alert(
                "Hoàn thành!",
                `Bạn đạt được ${score}/${questions.length} điểm.`,
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (questions.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không tìm thấy câu hỏi cho bài học này.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="x" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.progressBarWrapper}>
                    <View style={[styles.progressBar, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                </View>
                <Text style={styles.scoreText}>{score}</Text>
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

                    let btnStyles: any[] = [styles.optionBtn];
                    if (isSelected) btnStyles.push(styles.optionSelected);
                    if (isCorrect) btnStyles.push(styles.optionCorrect);
                    if (isWrong) btnStyles.push(styles.optionWrong);

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => handleOptionSelect(option)}
                            style={btnStyles}
                            disabled={isAnswered}
                        >
                            <Text style={[
                                styles.optionText,
                                (isCorrect || isWrong || isSelected) && { color: 'white' }
                            ]}>
                                {option}
                            </Text>
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
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, justifyContent: 'space-between' },
    progressBarWrapper: { flex: 1, height: 10, backgroundColor: COLORS.border, borderRadius: 5, marginHorizontal: 20 },
    progressBar: { height: 10, backgroundColor: COLORS.success, borderRadius: 5 },
    scoreText: { fontSize: FONT_SIZES.body, fontWeight: 'bold', color: COLORS.primary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    emptyText: { textAlign: 'center', marginBottom: 20, fontSize: FONT_SIZES.body },
    backBtn: { padding: 15, backgroundColor: COLORS.primary, borderRadius: 10 },
    backBtnText: { color: 'white', fontWeight: 'bold' },
    questionContainer: { padding: SPACING.xl, alignItems: 'center', marginTop: 20 },
    questionType: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textSecondary, marginBottom: 10 },
    questionText: { fontSize: 48, fontWeight: 'bold', color: COLORS.textPrimary },
    optionsContainer: { padding: SPACING.lg, flex: 1 },
    optionBtn: { backgroundColor: 'white', padding: 20, borderRadius: BORDER_RADIUS.md, marginBottom: 15, ...SHADOWS.small, borderWidth: 1, borderColor: COLORS.border },
    optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    optionCorrect: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    optionWrong: { backgroundColor: COLORS.error, borderColor: COLORS.error },
    optionText: { fontSize: FONT_SIZES.body, color: COLORS.textPrimary, fontWeight: '500' },
    footer: { padding: SPACING.lg, paddingBottom: 40 },
    checkBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
    nextBtn: { backgroundColor: COLORS.success, padding: 18, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
    checkBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 1 },
    nextBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 1 },
});

export default QuizScreen;
