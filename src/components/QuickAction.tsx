import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS, FONT_SIZES } from '../constants/theme';

interface QuickActionProps {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    onPress: () => void;
    iconColor?: string;
    iconBackgroundColor?: string;
    badge?: number | string;
}

export const QuickAction: React.FC<QuickActionProps> = ({
    icon,
    title,
    onPress,
    iconColor = COLORS.primary,
    iconBackgroundColor = COLORS.progressBackground,
    badge,
}) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
                <Feather name={icon} size={24} color={iconColor} />
                {badge !== undefined && (
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.cardBackground,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        ...SHADOWS.small,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    title: {
        fontSize: FONT_SIZES.bodySmall,
        fontWeight: '500',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    badgeContainer: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: COLORS.cardBackground,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
});

export default QuickAction;
