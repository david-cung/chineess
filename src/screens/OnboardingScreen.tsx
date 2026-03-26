import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Animated,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof Feather.glyphMap;
    color: string;
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        title: 'Chào mừng tới Hanyu',
        description: 'Hành trình chinh phục tiếng Trung của bạn bắt đầu từ đây với phương pháp học hiện đại.',
        icon: 'heart',
        color: COLORS.primary,
    },
    {
        id: '2',
        title: 'Học tập thông minh',
        description: 'Bài học thiết kế theo chuẩn HSK với lộ trình cá nhân hóa dựa trên trình độ của bạn.',
        icon: 'book-open',
        color: COLORS.secondary,
    },
    {
        id: '3',
        title: 'Luyện nói cùng AI',
        description: 'Công nghệ AI nhận diện giọng nói giúp bạn sửa lỗi phát âm và tự tin giao tiếp 24/7.',
        icon: 'mic',
        color: COLORS.accent,
    },
    {
        id: '4',
        title: 'Học mọi lúc mọi nơi',
        description: 'Radio thụ động và chế độ offline giúp bạn tận dụng quỹ thời gian eo hẹp để học tập.',
        icon: 'headphones',
        color: '#673AB7',
    },
];

const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        setCurrentIndex(viewableItems[0].index);
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollTo = async () => {
        if (currentIndex < slides.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            try {
                await AsyncStorage.setItem('has_seen_onboarding', 'true');
                navigation.replace('Login');
            } catch (err) {
                console.log('Error @setItem: ', err);
                navigation.replace('Login');
            }
        }
    };

    const skip = async () => {
        try {
            await AsyncStorage.setItem('has_seen_onboarding', 'true');
            navigation.replace('Login');
        } catch (err) {
            navigation.replace('Login');
        }
    };

    const renderItem = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Feather name={item.icon} size={100} color={item.color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <TouchableOpacity style={styles.skipButton} onPress={skip}>
                <Text style={styles.skipText}>Bỏ qua</Text>
            </TouchableOpacity>

            <FlatList
                data={slides}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={(item) => item.id}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                onViewableItemsChanged={viewableItemsChanged}
                viewabilityConfig={viewConfig}
                scrollEventThrottle={32}
                ref={slidesRef}
            />

            <View style={styles.footer}>
                <View style={styles.paginator}>
                    {slides.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                style={[styles.dot, { width: dotWidth, opacity }]}
                                key={i.toString()}
                            />
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.button} onPress={scrollTo}>
                    <Text style={styles.buttonText}>
                        {currentIndex === slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slide: {
        width,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    iconContainer: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: FONT_SIZES.h1,
        fontWeight: '800',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    description: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        height: height * 0.2,
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
        width: '100%',
    },
    paginator: {
        flexDirection: 'row',
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
        marginHorizontal: 8,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    buttonText: {
        color: COLORS.textWhite,
        fontSize: FONT_SIZES.body,
        fontWeight: '700',
    },
    skipButton: {
        position: 'absolute',
        top: SPACING.xl,
        right: SPACING.xl,
        zIndex: 10,
    },
    skipText: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textLight,
        fontWeight: '600',
    },
});

export default OnboardingScreen;
