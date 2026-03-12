import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { getReviewDue, submitReviewAnswer } from '../utils/api';
import { ReviewCard, ReviewRating } from '../types';

const { width } = Dimensions.get('window');

const ReviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [cards, setCards] = useState<ReviewCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [flipAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        setIsLoading(true);
        const dueCards = await getReviewDue();
        setCards(dueCards);
        setIsLoading(false);
    };

    const handleFlip = () => {
        const toValue = isFlipped ? 0 : 180;
        Animated.spring(flipAnim, {
            toValue,
            friction: 8,
            tension: 10,
            useNativeDriver: true,
        }).start();
        setIsFlipped(!isFlipped);
    };

    const handleRate = async (ratingId: number) => {
        const card = cards[currentIndex];
        await submitReviewAnswer(card.id, ratingId);

        // Move to next card
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
            flipAnim.setValue(0);
        } else {
            // Finished review
            navigation.goBack();
        }
    };

    const speak = (text: string) => {
        Speech.speak(text, { language: 'zh-CN' });
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (cards.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Feather name="check-circle" size={64} color={COLORS.success} />
                <Text style={styles.emptyText}>Tuyệt vời! Bạn không có từ nào cần ôn tập.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentCard = cards[currentIndex];
    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['0deg', '180deg'],
    });
    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 180],
        outputRange: ['180deg', '360deg'],
    });

    const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
    const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="x" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ôn tập ({currentIndex + 1}/{cards.length})</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.cardContainer}>
                <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.flipWrapper}>
                    {/* Front Side */}
                    <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
                        <Text style={styles.chineseChar}>{currentCard.vocabulary.word}</Text>
                        <Text style={styles.tapToReveal}>Chạm để xem nghĩa</Text>
                        <TouchableOpacity onPress={() => speak(currentCard.vocabulary.word)} style={styles.speakBtn}>
                            <Feather name="volume-2" size={32} color={COLORS.primary} />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Back Side */}
                    <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
                        <Text style={styles.pinyin}>{currentCard.vocabulary.pinyin}</Text>
                        <Text style={styles.meaning}>{currentCard.vocabulary.meaning}</Text>

                        {currentCard.vocabulary.examples && currentCard.vocabulary.examples.length > 0 && (
                            <View style={styles.exampleContainer}>
                                <Text style={styles.exampleHeading}>Ví dụ:</Text>
                                <Text style={styles.exampleZh}>{currentCard.vocabulary.examples[0].sentence}</Text>
                                <Text style={styles.exampleVi}>{currentCard.vocabulary.examples[0].translation}</Text>
                            </View>
                        )}
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {isFlipped && (
                <View style={styles.ratingContainer}>
                    <TouchableOpacity onPress={() => handleRate(1)} style={[styles.ratingBtn, { backgroundColor: COLORS.error }]}>
                        <Text style={styles.ratingLabel}>Quên</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRate(2)} style={[styles.ratingBtn, { backgroundColor: COLORS.warning }]}>
                        <Text style={styles.ratingLabel}>Khó</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRate(3)} style={[styles.ratingBtn, { backgroundColor: COLORS.info }]}>
                        <Text style={styles.ratingLabel}>Được</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRate(4)} style={[styles.ratingBtn, { backgroundColor: COLORS.success }]}>
                        <Text style={styles.ratingLabel}>Dễ</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, alignItems: 'center' },
    headerTitle: { fontSize: FONT_SIZES.body, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    emptyText: { textAlign: 'center', marginTop: SPACING.md, fontSize: FONT_SIZES.body, color: COLORS.textSecondary },
    backBtn: { marginTop: SPACING.lg, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md },
    backBtnText: { color: 'white', fontWeight: 'bold' },
    cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
    flipWrapper: { width: width - 40, height: 400 },
    card: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden', ...SHADOWS.medium },
    cardFront: { backgroundColor: 'white' },
    cardBack: { backgroundColor: 'white', position: 'absolute', top: 0 },
    chineseChar: { fontSize: 72, fontWeight: 'bold', color: COLORS.textPrimary },
    tapToReveal: { position: 'absolute', bottom: 40, fontSize: FONT_SIZES.caption, color: COLORS.textLight },
    speakBtn: { marginTop: 20 },
    pinyin: { fontSize: FONT_SIZES.h2, color: COLORS.primary, marginBottom: 10 },
    meaning: { fontSize: FONT_SIZES.h3, color: COLORS.textPrimary, textAlign: 'center' },
    exampleContainer: { marginTop: 40, width: '100%', padding: 15, backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md },
    exampleHeading: { fontSize: FONT_SIZES.caption, color: COLORS.textSecondary, marginBottom: 5 },
    exampleZh: { fontSize: FONT_SIZES.body, color: COLORS.textPrimary, marginBottom: 5 },
    exampleVi: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textSecondary },
    ratingContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: SPACING.lg, paddingBottom: 40 },
    ratingBtn: { flex: 1, marginHorizontal: 5, paddingVertical: 15, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
    ratingLabel: { color: 'white', fontWeight: 'bold' },
});

export default ReviewScreen;
