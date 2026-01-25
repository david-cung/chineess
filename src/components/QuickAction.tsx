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
}

export const QuickAction: React.FC<QuickActionProps> = ({
    icon,
    title,
    onPress,
    iconColor = COLORS.primary,
    iconBackgroundColor = COLORS.progressBackground,
}) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
                <Feather name={icon} size={24} color={iconColor} />
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
});

export default QuickAction;
