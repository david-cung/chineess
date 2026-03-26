import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { Card } from '../components';
import { dbService } from '../services/database';

interface VocabItem {
    id: number;
    word: string;
    pinyin: string;
    meaning: string;
}

const OfflineReviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const [vocab, setVocab] = useState<VocabItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCachedVocab();
    }, []);

    const loadCachedVocab = async () => {
        try {
            setIsLoading(true);
            const data = await dbService.getRandomVocabulary(20);
            if (data && data.length > 0) {
                setVocab(data);
            } else {
                const cached = await AsyncStorage.getItem('cached_vocab');
                if (cached) {
                    setVocab(JSON.parse(cached));
                }
            }
        } catch (err) {
            console.error('Error loading offline vocab:', err);
            const cached = await AsyncStorage.getItem('cached_vocab');
            if (cached) setVocab(JSON.parse(cached));
        } finally {
            setIsLoading(false);
        }
    };

    const playAudio = (text: string) => {
        Speech.speak(text, {
            language: 'zh-CN',
            rate: 0.8,
        });
    };

    const renderItem = ({ item }: { item: VocabItem }) => (
        <Card style={styles.vocabCard} variant="elevated">
            <View style={styles.vocabRow}>
                <View style={styles.vocabInfo}>
                    <Text style={styles.word}>{item.word}</Text>
                    <Text style={styles.pinyin}>{item.pinyin}</Text>
                    <Text style={styles.meaning}>{item.meaning}</Text>
                </View>
                <TouchableOpacity onPress={() => playAudio(item.word)} style={styles.audioButton}>
                    <Ionicons name="volume-medium" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ôn tập Offline</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.infoBox}>
                <Feather name="info" size={18} color={COLORS.secondary} />
                <Text style={styles.infoText}>
                    Đây là danh sách từ vựng được lưu trữ từ lần học cuối cùng của bạn. Bạn có thể ôn tập ngay cả khi không có mạng.
                </Text>
            </View>

            {vocab.length > 0 ? (
                <FlatList
                    data={vocab}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Feather name="wifi-off" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>Chưa có dữ liệu học tập offline.</Text>
                    <Text style={styles.emptySubtext}>Hãy học bài khi có mạng để dữ liệu được tự động lưu lại.</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
    },
    backButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    infoBox: {
        flexDirection: 'row',
        gap: SPACING.md,
        backgroundColor: '#EBF3FC',
        padding: SPACING.lg,
        margin: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
    },
    infoText: {
        flex: 1,
        fontSize: FONT_SIZES.bodySmall,
        color: COLORS.secondary,
        lineHeight: 20,
    },
    listContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.lg,
    },
    vocabCard: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    vocabRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    vocabInfo: {
        flex: 1,
    },
    word: {
        fontSize: FONT_SIZES.h3,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    pinyin: {
        fontSize: FONT_SIZES.body,
        color: COLORS.primary,
        fontWeight: '500',
        marginVertical: 2,
    },
    meaning: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
    },
    audioButton: {
        padding: SPACING.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyText: {
        fontSize: FONT_SIZES.h4,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: SPACING.lg,
    },
    emptySubtext: {
        fontSize: FONT_SIZES.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
    },
});

export default OfflineReviewScreen;
