import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    pinyin?: string;
    translation?: string;
    isLoading?: boolean;
}

const AIChatScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const [messages, setMessages] = useState<Message[]>([
        { 
            id: '1', 
            role: 'ai', 
            content: '你好！你想跟我聊什么？',
            pinyin: 'Nǐ hǎo! Nǐ xiǎng gēn wǒ liáo shénme?',
            translation: 'Chào bạn! Bạn muốn trò chuyện với tôi về chủ đề gì?'
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Auto-play the first greeting
    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'ai') {
            playAudio(messages[0].content);
        }
        return () => {
            Speech.stop();
        };
    }, []);

    const playAudio = (text: string) => {
        Speech.stop();
        Speech.speak(text, { language: 'zh-CN', rate: 0.85 });
    };

    const sendMessage = async () => {
        const text = inputText.trim();
        if (!text) return;
        
        Keyboard.dismiss();

        const newUserMsg: Message = { id: Date.now().toString(), content: text, role: 'user' };
        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            const token = await AsyncStorage.getItem('access_token');
            
            // Format history for backend
            const history = messages
                .filter(m => !m.isLoading)
                .map(m => ({
                    role: m.role === 'ai' ? 'model' : 'user',
                    content: m.content
                }));

            const res = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: text,
                    history: history.slice(-10) // Keep last 10 messages for context
                }),
            });

            if (res.ok) {
                const data = await res.json();
                
                const aiMsg: Message = { 
                    id: (Date.now() + 1).toString(), 
                    content: data.response,
                    pinyin: data.pinyin,
                    translation: data.translation,
                    role: 'ai' 
                };
                
                setMessages(prev => [...prev, aiMsg]);
                
                // Play audio for the new AI message
                if (data.response) {
                    playAudio(data.response);
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                const detail = errData.detail || '';
                
                let errorText = 'Xin lỗi, tôi đang gặp sự cố kết nối.';
                if (res.status === 429 || detail.includes('429') || detail.includes('Quota')) {
                    errorText = '⚠️ AI đang hết lượt truy cập miễn phí. Vui lòng thử lại sau hoặc cấu hình Key.';
                }
                
                setMessages(prev => [...prev, {
                    id: (Date.now() + 2).toString(),
                    content: errorText,
                    role: 'ai'
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 3).toString(),
                content: 'Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn.',
                role: 'ai'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';
        
        return (
            <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <Feather name="cpu" size={20} color={COLORS.primary} />
                    </View>
                )}
                
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                        {item.content}
                    </Text>
                    
                    {!isUser && item.pinyin && (
                        <Text style={styles.pinyinText}>{item.pinyin}</Text>
                    )}
                    
                    {!isUser && item.translation && (
                        <View style={styles.translationContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.translationText}>{item.translation}</Text>
                        </View>
                    )}
                    
                    {!isUser && item.content && !item.translation?.includes('⚠️') && (
                        <TouchableOpacity 
                            style={styles.playButton} 
                            onPress={() => playAudio(item.content)}
                        >
                            <Feather name="volume-2" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Hội thoại AI</Text>
                    <View style={styles.onlineIndicator} />
                </View>
                <TouchableOpacity style={styles.backBtn}>
                    <Feather name="more-horizontal" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.chatList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    isTyping ? (
                        <View style={[styles.messageRow, styles.aiRow]}>
                            <View style={styles.avatarContainer}>
                                <Feather name="cpu" size={20} color={COLORS.primary} />
                            </View>
                            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.typingText}>đang phân tích...</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập tiếng Trung hoặc Việt..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={150}
                        editable={!isTyping}
                    />
                    <TouchableOpacity 
                        style={[styles.sendBtn, (!inputText.trim() || isTyping) && styles.sendBtnDisabled]} 
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isTyping}
                    >
                        <Feather name="send" size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: SPACING.md, 
        paddingVertical: SPACING.md, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.divider,
        backgroundColor: COLORS.cardBackground,
        ...SHADOWS.small
    },
    headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    onlineIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
    backBtn: { padding: SPACING.xs },
    headerTitle: { fontSize: FONT_SIZES.h4, fontWeight: '700', color: COLORS.textPrimary },
    chatList: { padding: SPACING.md, paddingBottom: SPACING.xxl },
    messageRow: { flexDirection: 'row', marginBottom: SPACING.lg },
    userRow: { justifyContent: 'flex-end' },
    aiRow: { justifyContent: 'flex-start', alignItems: 'flex-end' },
    avatarContainer: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        backgroundColor: '#EBF3FC', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginRight: 8,
        marginBottom: 4
    },
    messageBubble: { 
        maxWidth: '75%', 
        padding: SPACING.md, 
        borderRadius: 20, 
        ...SHADOWS.small 
    },
    userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: COLORS.cardBackground, borderBottomLeftRadius: 4 },
    typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
    typingText: { fontSize: FONT_SIZES.caption, color: COLORS.textSecondary, fontStyle: 'italic' },
    messageText: { fontSize: FONT_SIZES.body, lineHeight: 22 },
    userText: { color: 'white' },
    aiText: { color: COLORS.textPrimary, fontWeight: '500' },
    pinyinText: { fontSize: FONT_SIZES.bodySmall, color: COLORS.primary, marginTop: 4 },
    translationContainer: { marginTop: 8 },
    divider: { height: 1, backgroundColor: COLORS.divider, marginBottom: 8 },
    translationText: { fontSize: FONT_SIZES.caption, color: COLORS.textSecondary, fontStyle: 'italic' },
    playButton: {
        position: 'absolute',
        top: -12,
        right: -12,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.small,
        borderWidth: 1,
        borderColor: COLORS.divider
    },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        padding: SPACING.md, 
        backgroundColor: COLORS.cardBackground, 
        borderTopWidth: 1, 
        borderTopColor: COLORS.divider, 
        gap: SPACING.sm 
    },
    input: { 
        flex: 1, 
        backgroundColor: COLORS.background, 
        borderRadius: 20, 
        paddingHorizontal: SPACING.lg, 
        paddingTop: 12,
        paddingBottom: 12,
        maxHeight: 120, 
        fontSize: FONT_SIZES.bodySmall,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    sendBtn: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: COLORS.primary, 
        alignItems: 'center', 
        justifyContent: 'center',
        ...SHADOWS.small
    },
    sendBtnDisabled: { opacity: 0.5, backgroundColor: COLORS.textLight },
});

export default AIChatScreen;
