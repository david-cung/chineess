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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000';
const CANVAS_SIZE = 280;

interface VocabItem {
    id: number;
    word: string;
    pinyin: string;
    meaning: string;
}

// ─── Web Canvas component ────────────────────────────────────────────────────
const WebCanvas: React.FC<{
    word: string;
    showReference: boolean;
    onClear: () => void;
}> = ({ word, showReference }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
    const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
    const isDrawing = useRef(false);

    // Initial load/clear when word changes
    useEffect(() => {
        setStrokes([]);
        setCurrentStroke([]);
    }, [word]);

    // Redraw function
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear background
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // Grid
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(CANVAS_SIZE / 2, 0); ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
        ctx.moveTo(0, CANVAS_SIZE / 2); ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
        ctx.stroke();

        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE);
        ctx.moveTo(CANVAS_SIZE, 0); ctx.lineTo(0, CANVAS_SIZE);
        ctx.stroke();
        ctx.setLineDash([]);

        // Reference character
        if (showReference) {
            ctx.fillStyle = '#E5393520';
            ctx.font = `bold ${CANVAS_SIZE * 0.65}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(word, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
        }

        // Draw Strokes
        ctx.strokeStyle = '#E53935';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const drawStroke = (stroke: { x: number; y: number }[]) => {
            if (stroke.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
        };

        strokes.forEach(drawStroke);
        drawStroke(currentStroke);
    }, [strokes, currentStroke, showReference, word]);

    useEffect(() => {
        redraw();
    }, [redraw]);

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const client = 'touches' in e ? e.touches[0] : e;
        return { x: client.clientX - rect.left, y: client.clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        isDrawing.current = true;
        const pos = getPos(e);
        setCurrentStroke([pos]);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing.current) return;
        const pos = getPos(e);
        setCurrentStroke(prev => [...prev, pos]);
    };

    const endDraw = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        if (currentStroke.length > 0) {
            setStrokes(prev => [...prev, currentStroke]);
            setCurrentStroke([]);
        }
    };

    return (
        <View style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 16, overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                style={{
                    backgroundColor: '#FAFAFA',
                    touchAction: 'none',
                    cursor: 'crosshair',
                }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
            />
        </View>
    );
};

// ─── Native Canvas (RN PanResponder + SVG) ──────────────────────────────────
const NativeCanvas: React.FC<{ word: string; showReference: boolean }> = ({ word, showReference }) => {
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState('');
    const activePathRef = useRef('');
    const { Svg, Path: SvgPath, Rect, Text: SvgText } = require('react-native-svg');
    const { PanResponder } = require('react-native');

    const pan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt: any) => {
                const { locationX, locationY } = evt.nativeEvent;
                const p = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
                activePathRef.current = p;
                setCurrentPath(p);
            },
            onPanResponderMove: (evt: any) => {
                const { locationX, locationY } = evt.nativeEvent;
                const p = `${activePathRef.current} L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
                activePathRef.current = p;
                setCurrentPath(p);
            },
            onPanResponderRelease: () => {
                if (activePathRef.current) {
                    setPaths(prev => [...prev, activePathRef.current]);
                    activePathRef.current = '';
                    setCurrentPath('');
                }
            },
        })
    ).current;

    const half = CANVAS_SIZE / 2;
    return (
        <View style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, borderRadius: 16, overflow: 'hidden' }} {...pan.panHandlers}>
            <Svg width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ position: 'absolute' }}>
                <Rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#FAFAFA" stroke="#E0E0E0" strokeWidth={1.5} />
                <SvgPath d={`M${half},0 L${half},${CANVAS_SIZE}`} stroke="#E0E0E0" strokeWidth={1} strokeDasharray="6,4" />
                <SvgPath d={`M0,${half} L${CANVAS_SIZE},${half}`} stroke="#E0E0E0" strokeWidth={1} strokeDasharray="6,4" />
                <SvgPath d={`M0,0 L${CANVAS_SIZE},${CANVAS_SIZE}`} stroke="#E0E0E0" strokeWidth={0.5} strokeDasharray="4,6" />
                <SvgPath d={`M${CANVAS_SIZE},0 L0,${CANVAS_SIZE}`} stroke="#E0E0E0" strokeWidth={0.5} strokeDasharray="4,6" />
                {showReference && (
                    <SvgText x={half} y={half + 50} fontSize={CANVAS_SIZE * 0.65} fill="#E5393530" textAnchor="middle" fontWeight="bold">{word}</SvgText>
                )}
                {paths.map((p: string, i: number) => (
                    <SvgPath key={i} d={p} stroke="#E53935" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {currentPath ? <SvgPath d={currentPath} stroke="#E53935" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
            </Svg>
        </View>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const WritingPracticeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const [vocabList, setVocabList] = useState<VocabItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showReference, setShowReference] = useState(false);
    const [showPinyin, setShowPinyin] = useState(false);
    const [canvasKey, setCanvasKey] = useState(0);

    useEffect(() => { fetchVocab(); }, []);

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
        } catch (err) { console.error('Error fetching vocab:', err); }
        finally { setIsLoading(false); }
    };

    const clearCanvas = () => {
        setShowReference(false);
        setCanvasKey(prev => prev + 1);
    };

    const goNext = () => {
        if (currentIndex < vocabList.length - 1) {
            setCurrentIndex(i => i + 1);
            clearCanvas();
            setShowPinyin(false);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            clearCanvas();
            setShowPinyin(false);
        }
    };

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

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Viết Chữ</Text>
                <View style={styles.counter}>
                    <Text style={styles.counterText}>{currentIndex + 1}/{vocabList.length}</Text>
                </View>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.hintRow}>
                    <Text style={styles.meaning}>{current?.meaning}</Text>
                    <TouchableOpacity style={styles.pinyinToggle} onPress={() => setShowPinyin(!showPinyin)}>
                        <Feather name={showPinyin ? 'eye-off' : 'eye'} size={14} color={COLORS.secondary} />
                        <Text style={styles.pinyinToggleText}>{showPinyin ? current?.pinyin : 'Xem pinyin'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.instruction}>Viết chữ Hán của từ trên vào ô bên dưới</Text>

                <View style={styles.canvasWrapper}>
                    {Platform.OS === 'web'
                        ? <WebCanvas key={canvasKey} word={current?.word} showReference={showReference} onClear={clearCanvas} />
                        : <NativeCanvas key={canvasKey} word={current?.word} showReference={showReference} />
                    }
                </View>

                <View style={styles.canvasControls}>
                    <TouchableOpacity style={styles.controlBtn} onPress={clearCanvas}>
                        <Feather name="trash-2" size={16} color={COLORS.error} />
                        <Text style={[styles.controlBtnText, { color: COLORS.error }]}>Xóa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.controlBtn, styles.revealBtn, showReference && styles.revealBtnActive]}
                        onPress={() => setShowReference(!showReference)}
                    >
                        <Feather name={showReference ? 'eye-off' : 'eye'} size={16} color={showReference ? 'white' : COLORS.primary} />
                        <Text style={[styles.controlBtnText, showReference && { color: 'white' }]}>
                            {showReference ? 'Ẩn mẫu' : 'Xem mẫu'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.tipBox}>
                    <Feather name="info" size={14} color={COLORS.secondary} />
                    <Text style={styles.tipText}>Mẹo: Viết từ trên xuống, từ trái sang phải theo thứ tự nét bút.</Text>
                </View>
            </ScrollView>

            <View style={styles.navRow}>
                <TouchableOpacity style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]} onPress={goPrev} disabled={currentIndex === 0}>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
    backBtn: { padding: SPACING.xs },
    headerTitle: { fontSize: FONT_SIZES.h4, fontWeight: '700', color: COLORS.textPrimary },
    counter: { backgroundColor: '#F3E5F5', paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: BORDER_RADIUS.round },
    counterText: { fontSize: FONT_SIZES.bodySmall, color: '#9C27B0', fontWeight: '600' },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xxl, alignItems: 'center' },
    hintRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
    meaning: { fontSize: FONT_SIZES.h3, fontWeight: '700', color: COLORS.textPrimary },
    pinyinToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EBF3FC', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.round },
    pinyinToggleText: { color: COLORS.secondary, fontSize: FONT_SIZES.bodySmall, fontWeight: '600' },
    instruction: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textSecondary, marginBottom: SPACING.lg, alignSelf: 'flex-start' },
    canvasWrapper: { marginBottom: SPACING.md, ...SHADOWS.medium },
    canvasControls: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
    controlBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardBackground },
    controlBtnText: { fontSize: FONT_SIZES.bodySmall, fontWeight: '600', color: COLORS.textPrimary },
    revealBtn: { borderColor: COLORS.primary },
    revealBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#EBF3FC', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, width: '100%' },
    tipText: { flex: 1, fontSize: FONT_SIZES.caption, color: COLORS.secondary, lineHeight: 18 },
    navRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.divider, backgroundColor: COLORS.cardBackground, gap: SPACING.sm },
    navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, gap: 4 },
    navBtnNext: { backgroundColor: '#9C27B0', borderColor: '#9C27B0' },
    navBtnDisabled: { opacity: 0.4 },
    navBtnText: { fontSize: FONT_SIZES.bodySmall, color: COLORS.textPrimary, fontWeight: '600' },
    navBtnTextNext: { fontSize: FONT_SIZES.bodySmall, color: 'white', fontWeight: '600' },
});

export default WritingPracticeScreen;
