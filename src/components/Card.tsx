import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../constants/theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'default' | 'elevated' | 'outlined';
    padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    variant = 'default',
    padding = 'medium',
}) => {
    const getCardStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            backgroundColor: COLORS.cardBackground,
            borderRadius: BORDER_RADIUS.lg,
            overflow: 'hidden',
        };

        // Padding styles
        switch (padding) {
            case 'none':
                break;
            case 'small':
                baseStyle.padding = SPACING.sm;
                break;
            case 'large':
                baseStyle.padding = SPACING.lg;
                break;
            default:
                baseStyle.padding = SPACING.md;
        }

        // Variant styles
        switch (variant) {
            case 'elevated':
                Object.assign(baseStyle, SHADOWS.medium);
                break;
            case 'outlined':
                baseStyle.borderWidth = 1;
                baseStyle.borderColor = COLORS.border;
                break;
            default:
                Object.assign(baseStyle, SHADOWS.small);
        }

        return baseStyle;
    };

    return <View style={[getCardStyle(), style]}>{children}</View>;
};

export default Card;
